/**
 * @version 0.20
 */
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import TronUtils from './ext/TronUtils'
import TrxTronscanProvider from './basic/TrxTronscanProvider'
import TrxTrongridProvider from './basic/TrxTrongridProvider'
import TrxSendProvider from '@crypto/blockchains/trx/providers/TrxSendProvider'


import BlocksoftDispatcher from '../BlocksoftDispatcher'
import config from '@app/config/config'
import { sublocale } from '@app/services/i18n'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'


export default class TrxTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: any
    private _tronNodePath: string
    private _tronscanProvider: TrxTronscanProvider
    private _trongridProvider: TrxTrongridProvider
    private _tokenName: string
    private _isToken20: boolean
    private sendProvider: TrxSendProvider

    constructor(settings: any) {
        this._settings = settings
        this._tronNodePath = 'https://api.trongrid.io'
        this._tronscanProvider = new TrxTronscanProvider()
        this._trongridProvider = new TrxTrongridProvider()
        this._tokenName = '_'
        this._isToken20 = false
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
            if (this._tokenName[0] === 'T') {
                this._isToken20 = true
            }
        }
        this.sendProvider = new TrxSendProvider(this._settings, this._tronNodePath)
    }

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }

    async checkTransferHasError(data: BlocksoftBlockchainTypes.CheckTransferHasErrorData): Promise<BlocksoftBlockchainTypes.CheckTransferHasErrorResult> {
        // @ts-ignore
        if (!this._isToken20 || data.amount && data.amount * 1 > 0) {
            return { isOk: true }
        }
        /**
         * @type {TrxScannerProcessor}
         */
        const balanceProvider = BlocksoftDispatcher.getScannerProcessor(this._settings.currencyCode)
        const balanceRaw = await balanceProvider.getBalanceBlockchain(data.addressTo)
        if (balanceRaw && typeof balanceRaw.balance !== 'undefined' && balanceRaw.balance > 0) {
            return { isOk: true }
        }

        const balanceProviderBasic = BlocksoftDispatcher.getScannerProcessor('TRX')
        const balanceRawBasic = await balanceProviderBasic.getBalanceBlockchain(data.addressTo)
        if (balanceRawBasic && typeof balanceRawBasic.balance !== 'undefined' && balanceRawBasic.balance > 0) {
            return { isOk: true }
        }

        const transactionsBasic = await balanceProviderBasic.getTransactionsBlockchain({account : {address : data.addressTo}})
        if (transactionsBasic !== false) {
            return { isOk: true }
        }
        return { isOk: false, code: 'TRX_20', address: data.addressTo }
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -3,
            shouldShowFees : false
        } as BlocksoftBlockchainTypes.FeeRateResult
        try {
            const link = 'https://apilist.tronscan.org/api/account?address=' + data.addressFrom
            const res = await BlocksoftAxios.getWithoutBraking(link)
            let feeForTx = 0
            if (this._tokenName[0] === 'T') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTransferProcessor.getFeeRate result ' + link, res.data.bandwidth)
                if (res.data.bandwidth.freeNetRemaining.toString() === '0') {
                    feeForTx = 48300
                } else {
                    const diffB = 345 - res.data.bandwidth.freeNetRemaining.toString() * 1
                    if (diffB > 0) {
                        feeForTx = BlocksoftUtils.mul(48300, BlocksoftUtils.div(diffB, 345))
                    }
                }
                if (res.data.bandwidth.energyRemaining.toString() === '0') {
                    feeForTx = feeForTx * 1 + 2048340
                } else {
                    const diffE = 14631 - res.data.bandwidth.energyRemaining.toString() * 1
                    if (diffE > 0) {
                        feeForTx = feeForTx * 1 + BlocksoftUtils.mul(2048340, BlocksoftUtils.div(diffE / 14631)) * 1
                    }
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTransferProcessor.getFeeRate feeForTx ' + feeForTx)
            } else {
                // @ts-ignore
                if (res.data.bandwidth.freeNetRemaining.toString() === '0') {
                    feeForTx = 100000
                }
            }
            if (feeForTx !== 0) {
                result.fees = [
                    {
                        langMsg: 'xrp_speed_one',
                        feeForTx: Math.round(feeForTx).toString(),
                        amountForTx: data.amount
                    }
                ]
                result.selectedFeeIndex = 0
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' TrxTransferProcessor.getFeeRate error ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTransferProcessor.getFeeRate error ' + e.message)
        }
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: { estimatedGas?: number, gasPrice?: number[], balance?: string } = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        // noinspection EqualityComparisonWithCoercionJS
        if (balance === '0') {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -1,
                fees: [],
                shouldShowFees : false,
                countedForBasicBalance: '0'
            }
        }
        const fees = await this.getFeeRate(data, privateData, additionalData)
        if (!fees || fees.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: balance,
                selectedFeeIndex: -3,
                fees: [],
                shouldShowFees : false,
                countedForBasicBalance: balance
            }
        }
        return {
            ...fees,
            shouldShowFees : false,
            selectedTransferAllBalance: fees.fees[fees.selectedFeeIndex].amountForTx
        }
    }

    /**
     * https://developers.tron.network/reference#walletcreatetransaction
     * https://developers.tron.network/docs/trc20-introduction#section-8usdt-transfer
     */
    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('TRX transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('TRX transaction required addressTo')
        }
        if (data.addressFrom === data.addressTo) {
            throw new Error('SERVER_RESPONSE_SELF_TX_FORBIDDEN')
        }

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx started')

        let tx
        if (typeof data.blockchainData !== 'undefined' && data.blockchainData) {
            tx = data.blockchainData
        } else {
            let toAddress, ownerAddress

            try {
                toAddress = TronUtils.addressToHex(data.addressTo)
            } catch (e) {
                e.message += ' inside TronUtils.addressToHex to_address ' + data.addressTo
                throw e
            }

            try {
                ownerAddress = TronUtils.addressToHex(data.addressFrom)
            } catch (e) {
                e.message += ' inside TronUtils.addressToHex owner_address ' + data.addressFrom
                throw e
            }


            let link, res, params
            if (this._tokenName[0] === 'T') {
                link = this._tronNodePath + '/wallet/triggersmartcontract'
                params = {
                    owner_address: ownerAddress,
                    contract_address: TronUtils.addressToHex(this._tokenName),
                    function_selector: 'transfer(address,uint256)',
                    // @ts-ignore
                    parameter: '0000000000000000000000' + toAddress.toUpperCase() + '00000000000000000000000000000000000000000000' + BlocksoftUtils.decimalToHex(data.amount * 1, 20),
                    fee_limit: 100000000,
                    call_value: 0
                }
                res = await BlocksoftAxios.post(link, params)
            } else {
                params = {
                    owner_address: ownerAddress,
                    to_address: toAddress,
                    // @ts-ignore
                    amount: data.amount * 1
                }

                if (this._tokenName === '_') {
                    link = this._tronNodePath + '/wallet/createtransaction'
                } else {
                    // @ts-ignore
                    params.asset_name = '0x' + Buffer.from(this._tokenName).toString('hex')
                    link = this._tronNodePath + '/wallet/transferasset'
                }
                try {
                    res = await BlocksoftAxios.post(link, params)
                } catch (e) {
                    if (e.message.indexOf('timeout of') !== -1 || e.message.indexOf('network') !== -1) {
                        throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
                    } else {
                        throw e
                    }
                }
            }

            // @ts-ignore
            if (typeof res.data.Error !== 'undefined') {
                // @ts-ignore
                this.sendProvider.trxError(res.data.Error.message || res.data.Error)
            }

            // @ts-ignore
            tx = res.data
            if (this._tokenName[0] === 'T') {
                // @ts-ignore
                if (typeof res.data.transaction === 'undefined' || typeof res.data.result === 'undefined') {
                    // @ts-ignore
                    if (typeof res.data.result.message !== 'undefined') {
                        // @ts-ignore
                        res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                    }
                    // @ts-ignore
                    this.sendProvider.trxError('No tx in contract data ' + JSON.stringify(res.data))
                }
                // @ts-ignore
                tx = res.data.transaction
            } else {
                // @ts-ignore
                if (typeof res.data.txID === 'undefined') {
                    // @ts-ignore
                    if (typeof res.data.result.message !== 'undefined') {
                        // @ts-ignore
                        res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                    }
                    // @ts-ignore
                    this.sendProvider.trxError('No txID in data ' + JSON.stringify(res.data))
                }
            }
        }

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx tx', tx)

        tx.signature = [TronUtils.ECKeySign(Buffer.from(tx.txID, 'hex'), Buffer.from(privateData.privateKey, 'hex'))]
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx signed', tx)

        const logData = {}
        logData.currencyCode = this._settings.currencyCode
        logData.selectedFee = uiData.selectedFee
        logData.from = data.addressFrom
        logData.basicAddressTo = data.addressTo
        logData.basicAmount = data.amount
        logData.pushLocale = sublocale()
        logData.pushSetting = await settingsActions.getSetting('transactionsNotifs')
        logData.basicToken = this._tokenName

        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            result = await this.sendProvider.sendTx(tx, '', false, logData)
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx broadcasted')
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' TrxTransferProcessor.sent error', e, uiData)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTransferProcessor.sent error '+ e.message)
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('v20_trx_tx_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, logData)
            throw e
        }
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v20_trx_tx_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)

        if (config.debug.cryptoErrors) {
            console.log(this._settings.currencyCode + ' TrxTransferProcessor.sendTx result', JSON.parse(JSON.stringify(result)))
        }
        return result
    }
}
