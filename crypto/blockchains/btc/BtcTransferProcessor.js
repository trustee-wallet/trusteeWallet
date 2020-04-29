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

import UsdtScannerProcessor from '../usdt/UsdtScannerProcessor'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'



const CACHE_VALID_TIME = 1000

const networksConstants = require('../../common/ext/networks-constants')


export default class BtcTransferProcessor {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

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
            usdtBalance : 0,
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
        this.unspentsProvider = new BtcUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new BtcSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new BtcTxInputsOutputs(this._settings)
        if (this._settings.currencyCode === 'BTC_SEGWIT') {
            this.txBuilder = new BtcSegwitTxBuilder(this._settings)
        } else if (this._settings.currencyCode === 'BTC_SEGWIT_COMPATIBLE') {
            this.txBuilder = new BtcSegwitCompatibleTxBuilder(this._settings)
        } else {
            this.txBuilder = new BtcTxBuilder(this._settings)
        }
        this.usdtScannerProcessor = new UsdtScannerProcessor()
        this._initedProviders = true
    }

    /**
     * @param {string} data.addressFrom
     * @param {string} data.addressFromLegacy
     * @param {string} data.addressFromXpub
     * @param {string} data.addressFromLegacyXpub
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        this._initProviders()
        try {

            const tx = data.txHash || false
            let key, promises
            let address, addressLegacy
            if (tx) {
                address = ''
                addressLegacy = ''
                key = tx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache ' + tx)
                promises = [
                    this.networkPrices.getNetworkPrices(12, this._settings.currencyCode),
                    this.unspentsProvider.getTx(tx)
                ]
            } else {
                address = data.addressFromXpub ? data.addressFromXpub : data.addressFrom
                addressLegacy = data.addressFromLegacyXpub ? data.addressFromLegacyXpub : data.addressFromLegacy
                key = data.addressFrom

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache ' + data.addressFrom + ' started ' + address + ' ' + addressLegacy)
                promises = [
                    this.networkPrices.getNetworkPrices(12, this._settings.currencyCode),
                    this.unspentsProvider.getUnspents(address, addressLegacy)
                ]
                if (this.usdtScannerProcessor) {
                    promises.push(this.usdtScannerProcessor.getBalanceBlockchain(data.addressFromLegacy))
                }
            }
            const tmp = await Promise.all(promises)
            this._precached.blocks_12 = tmp[0] // actually next is cached too
            this._precached.blocks_6 = await this.networkPrices.getNetworkPrices(6, this._settings.currencyCode)
            this._precached.blocks_2 = await this.networkPrices.getNetworkPrices(2, this._settings.currencyCode)
            this._precached.unspents = tmp[1]
            if (this.usdtScannerProcessor && tmp[2] && typeof tmp[2].balance !== 'undefined') {
                this._precached.usdtBalance = tmp[2].balance * 1
            } else {
                this._precached.usdtBalance = 0
            }
            if (this._precached.unspents) {
                if (this._precached.unspents.length > 1) {
                    this._precached.unspents.sort((a, b) => {
                        return b.valueBN.sub(a.valueBN).toString() > 0
                    })
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents sorted', this._precached.unspents)
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents returned', this._precached.unspents)
                }
                MarketingEvent.logOnlyRealTime('btc_unspents_scanned ' + this._settings.currencyCode + ' ' + data.addressFrom, { address, addressLegacy, unspents : this._precached.unspents })
            }
            this._precached.unspentsAddress = key
            this._precached.time = new Date().getTime()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache finished', tmp)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                e.message += ' in getTransferPrecache'
            }
            throw e
        }
        return this._precached
    }


    /**
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.privateKeyLegacy
     * @param {string} data.addressFromLegacy
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     */
    async getFeeRate(data, isPrecount = false) {
        this._initProviders()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let rawTxHex, txSize, preparedInputsOutputs

        try {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRate')
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate preparedInputsOutputs', preparedInputsOutputs)
        } catch (e) {
            const tmp = {unspents : this._precached.unspents, error : e.message}
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
            if (data.addressForChange === 'TRANSFER_ALL' && e.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE') {
                return 0
            }
            throw e
        }

        const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate')
        // console.log('')
        // console.log('')
        // console.log('=========logInputsOutputs===========')
        // console.log(logInputsOutputs)
        // console.log('')
        try {
            rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
            txSize = Math.ceil(rawTxHex.length / 2)
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                if (typeof e.basicMessage !== 'undefined') {
                    logInputsOutputs.error = e.basicMessage
                }
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('btc_error_2_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            } else {
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('btc_error_2_2 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            }
            if (data.addressForChange !== 'TRANSFER_ALL') {
                throw e
            } else {
                txSize = 400
            }
        }

        const mediumPrice = txSize * this._precached.blocks_6
        const slowPrice = txSize * this._precached.blocks_12
        const fastestPrice =  txSize * this._precached.blocks_2

        let maxPrice = fastestPrice
        let maxFeePerByte = this._precached.blocks_2
        let maxLang = this._langPrefix + '_speed_blocks_2'

        const leftBalanceBN = BlocksoftUtils.toBigNumber(logInputsOutputs.leftBalanceAndChange)
        const tmp = leftBalanceBN.sub(BlocksoftUtils.toBigNumber(maxPrice))
        if (!isPrecount && tmp.toString() < 0) {
            maxPrice = logInputsOutputs.leftBalanceAndChange
            if (maxPrice <= 0) {
                maxPrice = logInputsOutputs.diffInOut
            }
            maxFeePerByte = BlocksoftUtils.toBigNumber(maxPrice).div(BlocksoftUtils.toBigNumber(txSize)).toString()
            if (maxPrice < slowPrice) {
                maxLang = 'btc_corrected_speed_blocks_12'
            } else if (maxPrice < mediumPrice) {
                maxLang = 'btc_corrected_speed_blocks_6'
            } else if (maxPrice < fastestPrice) {
                maxLang = 'btc_corrected_speed_blocks_2'
            }
        }

        const result = [
            {
                langMsg: this._langPrefix + '_speed_blocks_12',
                feeForByte: this._precached.blocks_12,
                feeForTx: slowPrice,
                txSize
            },
            {
                langMsg: this._langPrefix + '_speed_blocks_6',
                feeForByte: this._precached.blocks_6,
                feeForTx: mediumPrice,
                txSize
            },
            {
                langMsg: maxLang,
                feeForByte: maxFeePerByte,
                feeForTx: maxPrice,
                txSize
            }
        ]
        if (isPrecount) {
            return this._recheckFees(result, data, isPrecount)
         }
        if (this._settings.currencyCode !== 'USDT') {
            const amountBN = BlocksoftUtils.toBigNumber(data.amount)
            const div = amountBN.div(BlocksoftUtils.toBigNumber(maxPrice)).toString()
            if (div < 5) {
                const tmp = amountBN.div(BlocksoftUtils.toBigNumber(20))
                const tmp2 = tmp.toString()
                if (tmp2 > 0) {
                    maxPrice = tmp2
                    maxFeePerByte = tmp.div(BlocksoftUtils.toBigNumber(txSize)).toString()
                    if (maxPrice < slowPrice) {
                        maxLang = 'btc_corrected_speed_blocks_12_protection'
                    } else if (maxPrice < mediumPrice) {
                        maxLang = 'btc_corrected_speed_blocks_6_protection'
                    } else if (maxPrice < fastestPrice) {
                        maxLang = 'btc_corrected_speed_blocks_2_protection'
                    }
                    result.push({
                        langMsg: maxLang,
                        feeForByte: maxFeePerByte,
                        feeForTx: maxPrice,
                        txSize
                    })
                }
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate result', result)

        return this._recheckFees(result, data)
    }

    async _recheckFees(fees, dataMain) {
        if (!fees || !fees.length) return false
        let fee
        const data = JSON.parse(JSON.stringify(dataMain))

        if (typeof data.addressForChange !== 'undefined' && data.addressForChange === 'TRANSFER_ALL') {

            const lastFee = fees[fees.length - 1].feeForTx
            for (fee of fees) {
                data.feeForTx = fee
                if (typeof lastFee !== 'undefined' && typeof fee.feeForTx !== 'undefined') {
                    const tmp = BlocksoftUtils.add(data.amount - fee.feeForTx, lastFee).toString()
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ` BtcTransferProcessor._recheckFees data.amount by lastFee ${data.amount} - ${fee.feeForTx} + ${lastFee} = ${tmp}`)
                    data.amount = tmp
                }
                const preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRecheckTrAll')
                const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRecheckTrAll')
                fee.preparedInputsOutputs = preparedInputsOutputs
                // console.log('')
                // console.log('tr fee corrected ', fee.feeForTx + ' / ' + fee.feeForByte + ' => ' + logInputsOutputs.diffInOut, logInputsOutputs)
                // console.log('')
                fee.feeForTx = logInputsOutputs.diffInOut
            }

        } else {
            for (fee of fees) {
                data.feeForTx = fee
                const preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRecheck')
                const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRecheck')
                fee.preparedInputsOutputs = preparedInputsOutputs
                // console.log('')
                // console.log('fee corrected ', fee.feeForTx + ' / ' + fee.feeForByte + ' => ' + logInputsOutputs.diffInOut, logInputsOutputs)
                // console.log('')
                fee.feeForTx = logInputsOutputs.diffInOut
            }
        }

        const tested = []
        const already = {}
        for (let i = fees.length - 1; i>= 0; i--) {
            fee = fees[i]
            if (typeof already[fee.feeForTx] === 'undefined') {
                tested.push(fee)
                already[fee.feeForTx] = 1
            }
        }
        return tested.reverse()
    }

    /**
     * @param {Object} data
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.privateKeyLegacy
     * @param {string} data.addressFromLegacy
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
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
            const tmp = {unspents : this._precached.unspents, error : e.message}
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_3 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
            if (e.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE') {
                return 0
            }
            throw e
        }

        const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getTransferAllBalance')
        return logInputsOutputs.totalOut
    }

    /**
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.addressForChangeHD
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.privateKeyLegacy
     * @param {string} data.addressFromLegacy
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.txHash
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @returns {Promise<{correctedAmountFrom: string, hash: string}>}
     */
    async sendTx(data) {
        const tx = data.txHash || false

        this._initProviders()
        console.log('done init')

        let key
        if (tx) {
            key = tx
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx resendTx ' + tx + ' started')
        } else {
            key = data.addressFrom
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx ' + data.addressFrom + ' started')
        }

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== key  || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }
        console.log('done precached')

        let preparedInputsOutputs, subtitle
        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.preparedInputsOutputs !== 'undefined' && data.feeForTx.preparedInputsOutputs) {
            preparedInputsOutputs = data.feeForTx.preparedInputsOutputs
            subtitle = ' BtcTransferProcessor.sendTxPrefee'
        } else {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
            subtitle = ' BtcTransferProcessor.sendTxPrefee'
        }
        const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + subtitle)
        console.log('log', logInputsOutputs)

        if (logInputsOutputs.diffInOutReadable > 0.05 ) {
            const e = new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
            e.code = 'ERROR_USER'
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_4_0 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            console.log('btc_error_4_0 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw e
        }

        const rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let result
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try')
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                logInputsOutputs.error = e.basicMessage
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('btc_error_4_1 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
                console.log('btc_error_4_1 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx basicMessage', e.basicMessage)
                throw e
            } else {
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('btc_error_4_2 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
                console.log('btc_error_4_2 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                throw e
            }
        }
        if (!result) {
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_4_3 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            console.log('btc_error_4_3 ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        // start prepare for next transactions will not work as it will give the same outputs
        this._precached.time = 0

        logInputsOutputs.HASH = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('btc_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        console.log('btc_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

        return { hash: result, correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom }
    }

    _logInputsOutputs(data, preparedInputsOutputs, title) {
        const logInputsOutputs = { inputs: [], outputs: [], totalIn: 0, totalOut: 0, diffInOut: 0, msg: preparedInputsOutputs.msg }
        let totalIn = BlocksoftUtils.toBigNumber(0)
        let totalOut = BlocksoftUtils.toBigNumber(0)
        let totalBalance = BlocksoftUtils.toBigNumber(0)

        let unspent
        for (unspent of this._precached.unspents) {
            totalBalance = totalBalance.add(unspent.valueBN)
        }

        let leftBalance = totalBalance
        let input
        for (input of preparedInputsOutputs.inputs) {
            logInputsOutputs.inputs.push({
                txid: input.txid,
                vout: input.vout,
                value: input.value,
                confirmations: input.confirmations,
                address : input.address
            })
            totalIn = totalIn.add(input.valueBN)
            leftBalance = leftBalance.sub(input.valueBN)
        }
        let output
        for (output of preparedInputsOutputs.outputs) {
            logInputsOutputs.outputs.push(output)
            totalOut = totalOut.add(BlocksoftUtils.toBigNumber(output.amount))
        }
        logInputsOutputs.totalIn = totalIn.toString()
        logInputsOutputs.totalOut = totalOut.toString()
        logInputsOutputs.diffInOut = totalIn.sub(totalOut).toString()
        logInputsOutputs.diffInOutReadable = BlocksoftUtils.toUnified(logInputsOutputs.diffInOut, this._settings.decimals)

        let tmp = totalOut
        if (data.currencyCode === 'USDT') {
            tmp = tmp.add(totalOut)
        } else {
            tmp = tmp.sub(BlocksoftUtils.toBigNumber(data.amount))
        }
        if (logInputsOutputs.diffInOut > 0) {
            tmp = tmp.add(BlocksoftUtils.toBigNumber(logInputsOutputs.diffInOut))
        }
        logInputsOutputs.totalOutMinusAmount = tmp.toString()
        logInputsOutputs.totalBalance = totalBalance.toString()
        logInputsOutputs.leftBalance = leftBalance.toString()
        logInputsOutputs.leftBalanceAndChange = leftBalance.add(tmp).toString()

        logInputsOutputs.data = JSON.parse(JSON.stringify(data))
        logInputsOutputs.data.privateKey = '***'
        logInputsOutputs.data.privateKeyLegacy = '***'
        logInputsOutputs.data.mnemonic = '***'
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForByte === 'undefined' || data.feeForTx.feeForByte < 0) {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with autofee ', logInputsOutputs)
        } else {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with fee ' + data.feeForTx.feeForTx, logInputsOutputs)
        }
        // console.log('btc_info ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        // noinspection JSIgnoredPromiseFromCall
        MarketingEvent.logOnlyRealTime('btc_info ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        return logInputsOutputs
    }
}
