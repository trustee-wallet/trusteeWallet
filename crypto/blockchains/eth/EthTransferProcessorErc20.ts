/**
 * @author Ksu
 * @version 0.20
 */
import EthTransferProcessor from './EthTransferProcessor'
import config from '@app/config/config'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


const abi = require('./ext/erc20.js')

export default class EthTransferProcessorErc20 extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {


    constructor(settings: { network?: string; tokenAddress: any }) {
        super(settings)
        // @ts-ignore
        this._token = new this._web3.eth.Contract(abi.ERC20, settings.tokenAddress)
        this._tokenAddress = settings.tokenAddress.toLowerCase()
        this._useThisBalance = false
    }

    _token: any = false
    _tokenAddress: string = ''
    _useThisBalance: boolean = false

    async checkTransferHasError(data: BlocksoftBlockchainTypes.CheckTransferHasErrorData): Promise<BlocksoftBlockchainTypes.CheckTransferHasErrorResult> {
        // @ts-ignore
        const balance = data.addressFrom && data.addressFrom !== '' ? await this._web3.eth.getBalance(data.addressFrom) : 0
        if (balance > 0) {
            return { isOk: true }
        } else {
            // @ts-ignore
            return { isOk: false, code: 'TOKEN', parentBlockchain: this._mainTokenBlockchain, parentCurrency: this._mainCurrencyCode }
        }
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }


    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        if (this.checkWeb3CurrentServerUpdated()) {
            this._token = new this._web3.eth.Contract(abi.ERC20, this._settings.tokenAddress)
        }

        if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate dex ' + data.addressFrom + ' started')
            return super.getFeeRate(data, privateData, additionalData)
        }

        const tmpData = { ...data }
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate removeByFee no token ' + this._tokenAddress)
            tmpData.amount = '0'
            return super.getFeeRate(tmpData, privateData, additionalData)
        }
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas started token ' + this._tokenAddress)
        let estimatedGas

        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            let firstAddressTo = basicAddressTo
            let eventTitle = 'v20_' + this._mainCurrencyCode.toLowerCase() + '_gas_limit_token1 '
            if (basicAddressTo === data.addressFrom.toLowerCase()) {
                const tmp1 = '0xA09fe17Cb49D7c8A7858C8F9fCac954f82a9f487'
                const tmp2 = '0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'
                firstAddressTo = data.addressFrom === tmp1 ? tmp2 : tmp1
                // @ts-ignore
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas addressToChanged ' + basicAddressTo + ' => ' + firstAddressTo)
                eventTitle = 'v20_' + this._mainCurrencyCode.toLowerCase() + '_gas_limit_token2 '
            }

            let serverEstimatedGas = 0
            let serverEstimatedGas2 = 0
            let serverEstimatedGas3 = 0
            try {
                serverEstimatedGas = await this._token.methods.transfer(firstAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check1 ' + data.amount + ' firstAddressTo ' + firstAddressTo + ' from ' + data.addressFrom
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error1 ' + e.message)
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error1 ' + e.message)
            }
            try {
                serverEstimatedGas2 = await this._token.methods.transfer(basicAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check2 ' + data.amount +' basicAddressTo ' + firstAddressTo + ' from ' + data.addressFrom
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error2 ' + e.message)
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error2 ' + e.message)
            }
            // @ts-ignore
            const tmp3 = data.amount * 1
            try {
                serverEstimatedGas3 = await this._token.methods.transfer(basicAddressTo, tmp3).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check3 ' + tmp3 +' basicAddressTo ' + firstAddressTo + ' from ' + data.addressFrom
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error3 ' + e.message)
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas error3 ' + e.message)
            }


            if (serverEstimatedGas2 > serverEstimatedGas) {
                estimatedGas = serverEstimatedGas2
            } else {
                estimatedGas = serverEstimatedGas
            }
            if (estimatedGas < serverEstimatedGas3) {
                estimatedGas = serverEstimatedGas3
            }

            let minGas = BlocksoftExternalSettings.getStatic(this._settings.tokenBlockchain + '_MIN_GAS_ERC20')
            if (typeof minGas === 'undefined' || !minGas) {
                minGas = BlocksoftExternalSettings.getStatic('ETH_MIN_GAS_ERC20')
            }
            if (typeof minGas === 'undefined' || !minGas) {
                minGas = 70200
            }
            if (estimatedGas < minGas) {
                estimatedGas = minGas
            }
            MarketingEvent.logOnlyRealTime(eventTitle + '_' + this._settings.currencyCode,
                {
                    title: data.addressFrom + ' => ' + data.addressTo,
                    amount: data.amount + '',
                    estimatedGas,
                    serverEstimatedGas,
                    serverEstimatedGas2,
                    serverEstimatedGas3
                })

        } catch (e) {
            this.checkError(e, data)
        }


        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas finished ' + estimatedGas)
        const result = await super.getFeeRate(tmpData, privateData, { ...additionalData, ...{ gasLimit : estimatedGas } })
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const tmpData = { ...data }
        if (!tmpData.amount || tmpData.amount === '0') {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessorErc20.getTransferAllBalance ' + data.addressFrom + ' token ' + this._tokenAddress + ' started with load balance needed')
            try {
                // @ts-ignore
                tmpData.amount = await this._token.methods.balanceOf(data.addressFrom).call()
            } catch (e) {
                this.checkError(e, data)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessorErc20.getTransferAllBalance ' + data.addressFrom + ' token ' + this._tokenAddress + ' started with loaded balance ' + tmpData.amount)
        } else {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessorErc20.getTransferAllBalance ' + data.addressFrom + ' token ' + this._tokenAddress + ' started with preset balance ' + tmpData.amount)
        }

        const result = await super.getTransferAllBalance(tmpData, privateData, additionalData)
        return result
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx dex ' + data.addressFrom + ' started')
            return super.sendTx(data, privateData, uiData)
        }
        const tmpData = { ...data }
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.sendTx removeByFee no token ' + this._tokenAddress)
            tmpData.amount = '0'
            return super.sendTx(tmpData, privateData, uiData)
        }

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.sendTx started token ' + this._tokenAddress)

        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            tmpData.blockchainData = this._token.methods.transfer(basicAddressTo, data.amount).encodeABI()
            tmpData.basicAddressTo = basicAddressTo
            tmpData.basicAmount = data.amount
            tmpData.basicToken = this._tokenAddress
        } catch (e) {
            this.checkError(e, data)
        }
        // @ts-ignore
        BlocksoftCryptoLog.log('EthTxProcessorErc20 encodeABI finished', tmpData.blockchainData)
        tmpData.amount = '0'
        tmpData.addressTo = this._tokenAddress
        return super.sendTx(tmpData, privateData, uiData)
    }
}
