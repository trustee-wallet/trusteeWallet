/**
 * @author Ksu
 * @version 0.20
 */
import EthTransferProcessor from './EthTransferProcessor'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

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
        const balance = await this._web3.eth.getBalance(data.addressFrom)
        if (balance > 0) {
            return { isOk: true }
        } else {
            return { isOk: false, code: 'TOKEN', parentBlockchain: 'Ethereum', parentCurrency: 'ETH' }
        }
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }


    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const tmpData = { ...data }
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas started token ' + this._tokenAddress)
        let estimatedGas

        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            let firstAddressTo = basicAddressTo
            let eventTitle = 'v20_eth_gas_limit_token1 '
            if (basicAddressTo === data.addressFrom.toLowerCase()) {
                const tmp1 = '0xA09fe17Cb49D7c8A7858C8F9fCac954f82a9f487'
                const tmp2 = '0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'
                firstAddressTo = data.addressFrom === tmp1 ? tmp2 : tmp1
                // @ts-ignore
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getFeeRate estimateGas addressToChanged ' + basicAddressTo + ' => ' + firstAddressTo)
                eventTitle = 'v20_eth_gas_limit_token2 '
            }

            let serverEstimatedGas = 0
            let serverEstimatedGas2 = 0
            let serverEstimatedGas3 = 0
            try {
                serverEstimatedGas = await this._token.methods.transfer(firstAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check1 ' + data.amount
                throw e
            }
            try {
                serverEstimatedGas2 = await this._token.methods.transfer(basicAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check2 ' + data.amount
                throw e
            }
            // @ts-ignore
            const tmp3 = data.amount * 1
            try {
                serverEstimatedGas3 = await this._token.methods.transfer(basicAddressTo, tmp3).estimateGas({ from: data.addressFrom })
            } catch (e) {
                // do nothing
            }


            if (serverEstimatedGas2 > serverEstimatedGas) {
                estimatedGas = serverEstimatedGas2
            } else {
                estimatedGas = serverEstimatedGas
            }
            if (estimatedGas < serverEstimatedGas3) {
                estimatedGas = serverEstimatedGas3
            }
            if (estimatedGas < 70200) {
                estimatedGas = 70200
            }
            MarketingEvent.logOnlyRealTime(eventTitle + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo,
                {
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
        const result = await super.getFeeRate(tmpData, privateData, { ...additionalData, ...{ estimatedGas } })
        result.shouldChangeBalance = false
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.getTransferAllBalance estimateBalance started token ' + this._tokenAddress)
        const tmpData = { ...data }
        if (!data.amount || data.amount === '0') {
            try {
                // @ts-ignore
                tmpData.amount = await this._token.methods.balanceOf(data.addressFrom).call()
            } catch (e) {
                this.checkError(e, data)
            }
        }
        const result = await super.getTransferAllBalance(tmpData, privateData, additionalData)
        result.shouldChangeBalance = false
        return result
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessorErc20.sendTx started token ' + this._tokenAddress)
        const tmpData = { ...data }

        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            tmpData.blockchainData = this._token.methods.transfer(basicAddressTo, data.amount).encodeABI()
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
