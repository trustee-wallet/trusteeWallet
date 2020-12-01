/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

import DogeNetworkPrices from './basic/DogeNetworkPrices'
import DogeUnspentsProvider from './providers/DogeUnspentsProvider'
import DogeTxInputsOutputs from './tx/DogeTxInputsOutputs'
import DogeTxBuilder from './tx/DogeTxBuilder'
import DogeSendProvider from './providers/DogeSendProvider'
import DogeRawDS from './stores/DogeRawDS'
import { DogeLogs } from './basic/DogeLogs'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'
import config from '../../../app/config/config'


const networksConstants = require('../../common/ext/networks-constants')


export default class DogeTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    _trezorServerCode = 'DOGE_TREZOR_SERVER'

    _builderSettings: BlocksoftBlockchainTypes.BuilderSettings = {
        minOutputDustReadable: 0.001,
        minChangeDustReadable: 0.5,
        feeMaxReadable: 1000, // for tx builder
        feeMaxAutoReadable2: 300, // for fee calc,
        feeMaxAutoReadable6: 150, // for fee calc
        feeMaxAutoReadable12: 100, // for fee calc
        changeTogether: true
    }

    _initedProviders: boolean = false

    _settings: BlocksoftBlockchainTypes.CurrencySettings

    _langPrefix: string

    // @ts-ignore
    networkPrices: BlocksoftBlockchainTypes.NetworkPrices

    // @ts-ignore
    unspentsProvider: BlocksoftBlockchainTypes.UnspentsProvider

    // @ts-ignore
    sendProvider: BlocksoftBlockchainTypes.SendProvider

    // @ts-ignore
    txPrepareInputsOutputs: BlocksoftBlockchainTypes.TxInputsOutputs

    // @ts-ignore
    txBuilder: BlocksoftBlockchainTypes.TxBuilder

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings) {
        this._settings = settings
        this._langPrefix = networksConstants[settings.network].langPrefix
        this.networkPrices = new DogeNetworkPrices()
    }

    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new DogeUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new DogeSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._builderSettings)
        this.txBuilder = new DogeTxBuilder(this._settings, this._builderSettings)
        this._initedProviders = true
    }

    needPrivateForFee(): boolean {
        return true
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return true
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {})
        : Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        this._initProviders()

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.amount)

        let prices = {}
        if (typeof additionalData.feeForByte === 'undefined') {
            prices = typeof additionalData.prices !== 'undefined' ? additionalData.prices : await this.networkPrices.getNetworkPrices(this._settings.currencyCode)
        } else {
            // @ts-ignore
            prices.speed_blocks_12 = additionalData.feeForByte
        }

        let unspents = typeof additionalData.unspents !== 'undefined' ? additionalData.unspents : await this.unspentsProvider.getUnspents(data.addressFrom)
        if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            unspents = await this.unspentsProvider.getTx(data.transactionReplaceByFee, data.addressFrom, unspents)
        }

        if (unspents.length > 1) {
            unspents.sort((a, b) => {
                return BlocksoftUtils.diff(b.value, a.value) * 1
            })
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate unspents sorted', unspents)
        } else {
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate unspents no need to sort', unspents)
        }

        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -1,
            fees: [] as BlocksoftBlockchainTypes.Fee[]
        } as BlocksoftBlockchainTypes.FeeRateResult

        const keys = ['speed_blocks_12', 'speed_blocks_6', 'speed_blocks_2']
        const checkedPrices = {}
        let prevFeeForByte = 0
        for (const key of keys) {
            // @ts-ignore
            if (typeof prices[key] === 'undefined' || !prices[key]) continue
            // @ts-ignore
            let feeForByte = prices[key]
            if (typeof additionalData.feeForByte === 'undefined') {
                if (typeof data.transactionSpeedUp !== 'undefined' || typeof data.transactionReplaceByFee !== 'undefined') {
                    feeForByte = feeForByte * 2
                }
                if (typeof data.transactionJson !== 'undefined' && typeof data.transactionJson.feeForByte !== 'undefined') {
                    if (feeForByte * 1 < data.transactionJson.feeForByte * 1) {
                        feeForByte = Math.ceil(data.transactionJson.feeForByte * 1.5)
                    }
                    if (feeForByte * 1 <= prevFeeForByte * 1) {
                        feeForByte = Math.ceil(prevFeeForByte * 1.5)
                    }
                }
            }
            // @ts-ignore
            checkedPrices[key] = feeForByte
            prevFeeForByte = feeForByte
        }
        let uniqueFees = {}
        for (const key of keys) {
            // @ts-ignore
            if (typeof checkedPrices[key] === 'undefined' || !checkedPrices[key]) continue
            // @ts-ignore
            const feeForByte = checkedPrices[key]
            let preparedInputsOutputs
            const subtitle = 'getFeeRate_' + key + ' ' + feeForByte
            let autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable2
            if (key === 'speed_blocks_6') {
                autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable6
            } else if (key === 'speed_blocks_12') {
                autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable12
            }
            try {
                preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, unspents, {
                    feeForByte,
                    autoFeeLimitReadable
                }, subtitle)
                // @ts-ignore
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate_' + key + ' preparedInputsOutputs', preparedInputsOutputs)
                if (preparedInputsOutputs.inputs.length === 0) {
                    // do noting
                    continue
                }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log('getInputsOutputs error', e)
                }
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('v20_doge_error_getfeerate_' + key + ' ' + feeForByte + ' ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, unspents)
                throw e
            }
            const logInputsOutputs = DogeLogs.logInputsOutputs(data, unspents, preparedInputsOutputs, this._settings, subtitle)
            let blockchainData, txSize, actualFeeForByte
            try {
                blockchainData = await this.txBuilder.getRawTx(data, privateData, preparedInputsOutputs)
                txSize = Math.ceil(blockchainData.rawTxHex.length / 2)
                actualFeeForByte = Math.floor(BlocksoftUtils.div(logInputsOutputs.diffInOut, txSize))
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log('getRawTx error', e, blockchainData)
                }
                MarketingEvent.logOnlyRealTime('v20_doge_error_tx_builder ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message.toString(), logInputsOutputs)
                throw e
            }
            // @ts-ignore
            blockchainData.unspents = unspents

            // console.log('logInputsOutputs', JSON.parse(JSON.stringify(logInputsOutputs)))

            if (typeof uniqueFees[logInputsOutputs.diffInOut] !== 'undefined') {
                continue
            }
            result.fees.push(
                {
                    langMsg: this._langPrefix + '_' + key,
                    feeForByte: actualFeeForByte.toString(),
                    needSpeed: feeForByte.toString(),
                    feeForTx: logInputsOutputs.diffInOut,
                    amountForTx: logInputsOutputs.sendBalance,
                    blockchainData
                }
            )
            uniqueFees[logInputsOutputs.diffInOut] = true
        }
        result.selectedFeeIndex = result.fees.length - 1
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.unconfirmed && data.unconfirmed.toString().indexOf('-') === -1 ? BlocksoftUtils.add(data.amount, data.unconfirmed).toString() : data.amount

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' => ' + data.amount + ' + ' + data.unconfirmed + ' = ' + balance)

        data.isTransferAll = true
        const result = await this.getFeeRate(data, privateData, additionalData)
        // @ts-ignore
        if (!result || result.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                countedForBasicBalance: balance
            }
        }
        // @ts-ignore
        return {
            ...result,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx,
            shouldChangeBalance: true,
            countedForBasicBalance: balance
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof uiData.selectedFee.blockchainData === 'undefined' && typeof uiData.selectedFee.feeForTx === 'undefined') {
            throw new Error('SERVER_RESPONSE_PLEASE_SELECT_FEE')
        }
        const txHash = data.transactionReplaceByFee
        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('DOGE transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('DOGE transaction required addressTo')
        }

        if (txHash) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx resend started ' + txHash)
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx started')
        }


        const logData = uiData.selectedFee
        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            result = await this.sendProvider.sendTx(uiData.selectedFee.blockchainData.rawTxHex, txHash ? 'rbfSend' : 'usualSend')
            result.transactionFee = uiData.selectedFee.feeForTx
            result.transactionFeeCurrencyCode = this._settings.currencyCode
            result.transactionJson = {
                nSequence: uiData.selectedFee.blockchainData.nSequence,
                txAllowReplaceByFee: uiData.selectedFee.blockchainData.txAllowReplaceByFee,
                feeForByte: uiData.selectedFee.feeForByte
            }
            if (txHash) {
                await DogeRawDS.cleanRaw({
                    address: data.addressFrom,
                    currencyCode: this._settings.currencyCode,
                    transactionHash: result.transactionHash
                })
            }
            await DogeRawDS.saveRaw({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: result.transactionHash,
                transactionRaw: uiData.selectedFee.blockchainData.rawTxHex
            })
            await DogeRawDS.saveInputs({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: result.transactionHash,
                transactionRaw: JSON.stringify(uiData.selectedFee.blockchainData.preparedInputsOutputs.inputs)
            })

            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sent ' + data.addressFrom + ' done ' + JSON.stringify(result.transactionJson))
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeTransferProcessor.sent error', e, uiData)
            }

            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('v20_doge_tx_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, logData)
            throw e
        }
        // @ts-ignore
        logData.result = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v20_doge_tx_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)

        console.log('result', JSON.parse(JSON.stringify(result)))
        return result
    }

    async sendRawTx(data: BlocksoftBlockchainTypes.DbAccount, rawTxHex: string): Promise<string> {
        this._initProviders()
        const result = await this.sendProvider.sendTx(rawTxHex, 'rawSend')
        return result.transactionHash
    }

    async setMissingTx(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): Promise<boolean> {
        DogeRawDS.cleanRaw({
            address: data.address,
            transactionHash: transaction.transactionHash,
            currencyCode: this._settings.currencyCode
        })
        MarketingEvent.logOnlyRealTime('v20_doge_tx_set_missing ' + this._settings.currencyCode + ' ' + data.address + ' => ' + transaction.addressTo, transaction)
        return true
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): boolean {
        if (transaction.transactionDirection === 'income') {
            return true
        }
        if (typeof transaction.transactionJson !== 'undefined') {
            // console.log('transaction.transactionJson', JSON.stringify(transaction.transactionJson))
        }
        return true
    }
}
