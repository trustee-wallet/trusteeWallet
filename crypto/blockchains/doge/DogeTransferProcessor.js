/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import DogeNetworkPrices from './basic/DogeNetworkPrices'
import DogeUnspentsProvider from './providers/DogeUnspentsProvider'
import DogeTxInputsOutputs from './tx/DogeTxInputsOutputs'
import DogeTxBuilder from './tx/DogeTxBuilder'
import DogeSendProvider from './providers/DogeSendProvider'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const CACHE_VALID_TIME = 1000

const networksConstants = require('../../common/ext/networks-constants')

export default class DogeTransferProcessor {
    /**
     * @type {string}
     * @private
     */
    _trezorServer = 'https://doge1.trezor.io'

    /**
     * @type {boolean}
     * @private
     */
    _initedProviders = false

    /**
     * @param settings
     */
    constructor(settings) {
        this._settings = settings
        this._precached = {
            blocks_12: 0,
            blocks_6: 0,
            blocks_2: 0,
            unspents: [],
            unspentsAddress: '',
            time : 0
        }
        this._langPrefix = networksConstants[settings.network].langPrefix
        this.networkPrices = new DogeNetworkPrices()
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new DogeUnspentsProvider(this._settings, this._trezorServer)
        this.sendProvider = new DogeSendProvider(this._settings, this._trezorServer)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings)
        this.txBuilder = new DogeTxBuilder(this._settings)
        this._initedProviders = true
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        this._initProviders()
        try {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache ' + data.addressFrom + ' started')
            let tmp = await Promise.all([
                this.networkPrices.getNetworkPrices(12, this._settings.currencyCode),
                this.networkPrices.getNetworkPrices(6, this._settings.currencyCode),
                this.networkPrices.getNetworkPrices(2, this._settings.currencyCode),
                this.unspentsProvider.getUnspents(data.addressFrom)
            ])
            this._precached.blocks_12 = tmp[0]
            this._precached.blocks_6 = tmp[1]
            this._precached.blocks_2 = tmp[2]
            this._precached.unspents = tmp[3]
            if (this._precached.unspents) {
                if (this._precached.unspents.length > 1) {
                    this._precached.unspents.sort((a, b) => {
                        return b.valueBN.sub(a.valueBN).toString() > 0
                    })
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache unspents sorted', this._precached.unspents)
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache unspents returned', this._precached.unspents)
                }
            }
            this._precached.unspentsAddress = data.addressFrom
            this._precached.time = new Date().getTime()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache finished', tmp)
        } catch (e) {
            e.message += ' in getTransferPrecache'
            throw e
        }
        return this._precached
    }


    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     */
    async getFeeRate(data) {
        this._initProviders()
        if (data.replacingTransaction !== 'undefined' && data.replacingTransaction) {
            throw new Error('PLZ CODE BACK REPLACING TX LOGIC')
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx ' + data.addressFrom + ' started')

        if (this._precached.unspentsAddress !== data.addressFrom || (!this._precached.blocks_2 && !this._precached.unspents)) {
            await this.getTransferPrecache(data)
        }

        let result, rawTxHex

        let preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRate')
        this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate')

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate preparedInputsOutputs', preparedInputsOutputs)
        rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let txSize = Math.ceil(rawTxHex.length / 2)
        result = [
            {
                langMsg: this._langPrefix + '_speed_blocks_12',
                feeForByte: this._precached.blocks_12,
                feeForTx: txSize * this._precached.blocks_12,
                txSize
            },
            {
                langMsg: this._langPrefix + '_speed_blocks_6',
                feeForByte: this._precached.blocks_6,
                feeForTx: txSize * this._precached.blocks_6,
                txSize
            },
            {
                langMsg: this._langPrefix + '_speed_blocks_2',
                feeForByte: this._precached.blocks_2,
                feeForTx: txSize * this._precached.blocks_2,
                txSize
            }
        ]
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate result', result)

        return result
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        this._initProviders()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        data.addressForChange = 'TRANSFER_ALL'
        let preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getTransferAllBalance')
        this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' DogeTransferProcessor.getTransferAllBalance')

        return preparedInputsOutputs.outputs[0].amount
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @returns {Promise<{correctedAmountFrom: string, hash: string}>}
     */
    async sendTx(data) {
        this._initProviders()
        if (data.replacingTransaction !== 'undefined' && data.replacingTransaction) {
            throw new Error('PLZ CODE BACK REPLACING TX LOGIC')
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
        let logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.sendTx')

        let rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let result
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try')
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                logInputsOutputs['error'] = e.basicMessage
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_user_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx basicMessage', e.basicMessage)
                throw e
            } else {
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_system_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                throw e
            }
        }
        if (!result) {
            MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_empty_result ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        //start prepare for next transactions will not work as it will give the same outputs
        this._precached.time = 0

        logInputsOutputs['hash'] = result
        MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

        return { hash: result, correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom }
    }

    _logInputsOutputs(data, preparedInputsOutputs, title) {
        let logInputsOutputs = { inputs: [], outputs: [], totalIn: 0, totalOut: 0, diffInOut: 0 }
        for (let input of preparedInputsOutputs.inputs) {
            logInputsOutputs.inputs.push({
                txid: input.txid,
                vout: input.vout,
                value: input.value,
                confirmations: input.confirmations
            })
            logInputsOutputs.totalIn += input.value * 1
        }
        for (let output of preparedInputsOutputs.outputs) {
            logInputsOutputs.outputs.push(output)
            logInputsOutputs.totalOut += output.amount * 1
        }
        logInputsOutputs.diffInOut = logInputsOutputs.totalIn - logInputsOutputs.totalOut
        logInputsOutputs.feeForByte = preparedInputsOutputs.feeForByte
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForByte === 'undefined' || data.feeForTx.feeForByte < 0) {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with autofee ', logInputsOutputs)
        } else {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with fee ' + data.feeForTx.feeForTx, logInputsOutputs)
        }
        MarketingEvent.logOnlyRealTime('prepared_inputs_outputs ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        return logInputsOutputs
    }
}
