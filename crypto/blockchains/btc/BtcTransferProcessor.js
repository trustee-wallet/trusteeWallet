/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

import BtcNetworkPrices from './basic/BtcNetworkPrices'
import BtcUnspentsProvider from './providers/BtcUnspentsProvider'
import BtcTxInputsOutputs from './tx/BtcTxInputsOutputs'
import BtcTxBuilder from './tx/BtcTxBuilder'
import BtcSegwitTxBuilder from './tx/BtcSegwitTxBuilder'
import BtcSegwitCompatibleTxBuilder from './tx/BtcSegwitCompatibleTxBuilder'
import BtcSendProvider from './providers/BtcSendProvider'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'


const CACHE_VALID_TIME = 1000

const networksConstants = require('../../common/ext/networks-constants')


export default class BtcTransferProcessor {
    /**
     * @type {string}
     * @private
     */
    _trezorServer = 'https://btc1.trezor.io'

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
        this.networkPrices = new BtcNetworkPrices()
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BtcUnspentsProvider(this._settings, this._trezorServer)
        this.sendProvider = new BtcSendProvider(this._settings, this._trezorServer)
        this.txPrepareInputsOutputs = new BtcTxInputsOutputs(this._settings)
        if (this._settings.currencyCode === 'BTC_SEGWIT') {
            this.txBuilder = new BtcSegwitTxBuilder(this._settings)
        } else if (this._settings.currencyCode === 'BTC_SEGWIT_COMPATIBLE') {
            this.txBuilder = new BtcSegwitCompatibleTxBuilder(this._settings)
        } else {
            this.txBuilder = new BtcTxBuilder(this._settings)
        }
        this._initedProviders = true
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        this._initProviders()
        try {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache ' + data.addressFrom + ' started')
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
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents sorted', this._precached.unspents)
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents returned', this._precached.unspents)
                }
            }
            this._precached.unspentsAddress = data.addressFrom
            this._precached.time = new Date().getTime()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache finished', tmp)
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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let result, rawTxHex, preparedInputsOutputs, logInputsOutputs

        try {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRate')
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate preparedInputsOutputs', preparedInputsOutputs)
        } catch (e) {
            let tmp = {unspents : this._precached.unspents, error : e.message}
            MarketingEvent.logOnlyRealTime('btc_error_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
            if (data.addressForChange === 'TRANSFER_ALL' && e.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE') {
                return 0
            }
            throw e
        }

        logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate')

        try {
            rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                if (typeof e.basicMessage !== 'undefined') {
                    logInputsOutputs['error'] = e.basicMessage
                }
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('btc_error_2_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            } else {
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('btc_error_2_2 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            }
            if (data.addressForChange !== 'TRANSFER_ALL') {
                throw e
            }
        }

        let txSize = Math.ceil(rawTxHex.length / 2)
        let maxPrice = txSize * this._precached.blocks_2
        let maxFeePerByte = this._precached.blocks_2
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
                feeForByte: maxFeePerByte,
                feeForTx: maxPrice,
                txSize
            }
        ]
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate result', result)

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let preparedInputsOutputs
        data.addressForChange = 'TRANSFER_ALL'
        try {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getTransferAllBalance')
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferAllBalance preparedInputsOutputs', preparedInputsOutputs)
        } catch (e) {
            let tmp = {unspents : this._precached.unspents, error : e.message}
            MarketingEvent.logOnlyRealTime('btc_error_3 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
            if (e.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE') {
                return 0
            }
            throw e
        }

        this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getTransferAllBalance')

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
        (this._settings.currencyCode + ' BtcTransferProcessor.sendTx ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
        let logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.sendTx')

        if (preparedInputsOutputs.diffInOut > data.amount * 0.1 || preparedInputsOutputs.diffInOutReadable > 0.01 ) {
            let e = new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
            e.code = 'ERROR_USER'
            MarketingEvent.logOnlyRealTime('btc_error_4_0 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw e
        }

        let rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let result
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try')
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                logInputsOutputs['error'] = e.basicMessage
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('btc_error_4_1 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx basicMessage', e.basicMessage)
                throw e
            } else {
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('btc_error_4_2 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                throw e
            }
        }
        if (!result) {
            MarketingEvent.logOnlyRealTime('btc_error_4_3 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        //start prepare for next transactions will not work as it will give the same outputs
        this._precached.time = 0

        logInputsOutputs['hash'] = result
        MarketingEvent.logOnlyRealTime('btc_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

        return { hash: result, correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom }
    }

    _logInputsOutputs(data, preparedInputsOutputs, title) {
        let logInputsOutputs = { inputs: [], outputs: [], totalIn: 0, totalOut: 0, diffInOut: 0, msg: preparedInputsOutputs.msg }
        let totalIn = BlocksoftUtils.toBigNumber(0)
        let totalOut = BlocksoftUtils.toBigNumber(0)
        for (let input of preparedInputsOutputs.inputs) {
            logInputsOutputs.inputs.push({
                txid: input.txid,
                vout: input.vout,
                value: input.value,
                confirmations: input.confirmations
            })
            totalIn = totalIn.add(input.valueBN)
        }
        for (let output of preparedInputsOutputs.outputs) {
            logInputsOutputs.outputs.push(output)
            totalOut = totalOut.add(BlocksoftUtils.toBigNumber(output.amount))
        }
        logInputsOutputs.totalIn = totalIn.toString()
        logInputsOutputs.totalOut = totalOut.toString()
        logInputsOutputs.diffInOut = totalIn.sub(totalOut).toString()
        logInputsOutputs.diffInOutReadable = BlocksoftUtils.toUnified(logInputsOutputs.diffInOut, this._settings.decimals)
        logInputsOutputs.feeForByte = preparedInputsOutputs.feeForByte
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForByte === 'undefined' || data.feeForTx.feeForByte < 0) {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with autofee ', logInputsOutputs)
        } else {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with fee ' + data.feeForTx.feeForTx, logInputsOutputs)
        }
        MarketingEvent.logOnlyRealTime('btc_info ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        return logInputsOutputs
    }
}
