/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftBN from '../../common/BlocksoftBN'

import DogeNetworkPrices from './basic/DogeNetworkPrices'
import DogeUnspentsProvider from './providers/DogeUnspentsProvider'
import DogeTxInputsOutputs from './tx/DogeTxInputsOutputs'
import DogeTxBuilder from './tx/DogeTxBuilder'
import DogeSendProvider from './providers/DogeSendProvider'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const CACHE_VALID_TIME = 5000

const networksConstants = require('../../common/ext/networks-constants')

export default class DogeTransferProcessor {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'DOGE_TREZOR_SERVER'

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 2

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee: 1000000,
        minOutputToBeDustedReadable: 0.5,
        minChangeThresholdReadable: 0.5
    }

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
            time: 0
        }
        this._langPrefix = networksConstants[settings.network].langPrefix
        this.networkPrices = new DogeNetworkPrices()
        this._minOutputToBeDusted = BlocksoftUtils.fromUnified(this._inputsOutputsSettings.minOutputToBeDustedReadable * 2, settings.decimals)
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new DogeUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new DogeSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._inputsOutputsSettings)
        this.txBuilder = new DogeTxBuilder(this._settings, this._maxDiffInOutReadable)
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
            this._precached.blocks_12 = await this.networkPrices.getNetworkPrices(12, this._settings.currencyCode)
            this._precached.blocks_6 = await this.networkPrices.getNetworkPrices(6, this._settings.currencyCode)
            this._precached.blocks_2 = await this.networkPrices.getNetworkPrices(2, this._settings.currencyCode)
            this._precached.unspents = await this.unspentsProvider.getUnspents(data.addressFrom)
            if (this._precached.unspents) {
                if (this._precached.unspents.length > 1) {
                    this._precached.unspents.sort((a, b) => {
                        return BlocksoftUtils.diff(b.value, a.value) * 1
                    })
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache unspents sorted', this._precached.unspents)
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache unspents returned', this._precached.unspents)
                }
            }
            this._precached.unspentsAddress = data.addressFrom
            this._precached.time = new Date().getTime()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferPrecache finished')
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                e.message += ' in getTransferPrecache'
            }
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
     * @param {string} data.multiply
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number|boolean} additionalData.isPrecount
     * @param {number} data.nSequence
     */
    async getFeeRate(data, additionalData) {
        this._initProviders()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        
        const isPrecount =  typeof additionalData.isPrecount  === 'undefined' || additionalData.isPrecount === false

        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let rawTxHex, preparedInputsOutputs, txSize

        try {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRate')
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate preparedInputsOutputs', preparedInputsOutputs)
        } catch (e) {
            const tmp = { unspents: this._precached.unspents, error: e.message }
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('doge_error_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
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
            rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs, logInputsOutputs)
            txSize = Math.ceil(rawTxHex.length / 2)
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                if (typeof e.basicMessage !== 'undefined') {
                    logInputsOutputs.error = e.basicMessage
                }
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('doge_error_2_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            } else {
                logInputsOutputs.userError = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('doge_error_2_2 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
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

        const leftBalanceBN = new BlocksoftBN(logInputsOutputs.leftBalanceAndChange)
        const tmp = BlocksoftUtils.diff(leftBalanceBN, maxPrice)
        if (!isPrecount && tmp * 1 < 0) {
            maxPrice = logInputsOutputs.leftBalanceAndChang
            if (maxPrice <= 0) {
                maxPrice = logInputsOutputs.diffInOut
            }
            maxFeePerByte = BlocksoftUtils.div(maxPrice, txSize)
            if (maxPrice < slowPrice) {
                maxLang = 'ltc_corrected_speed_blocks_12'
            } else if (maxPrice < mediumPrice) {
                maxLang = 'ltc_corrected_speed_blocks_6'
            } else if (maxPrice < fastestPrice) {
                maxLang = 'ltc_corrected_speed_blocks_2'
            }
        }

        const result = [
            {
                langMsg: this._langPrefix + '_speed_blocks_12',
                feeForByte: this._precached.blocks_12,
                feeForTx: txSize * this._precached.blocks_12,
                showError : false,
                txSize
            },
            {
                langMsg: this._langPrefix + '_speed_blocks_6',
                feeForByte: this._precached.blocks_6,
                feeForTx: mediumPrice,
                showError : true,
                txSize
            },
            {
                langMsg: maxLang,
                feeForByte: maxFeePerByte,
                feeForTx: maxPrice,
                showError:  false,
                txSize
            }
        ]
        if (isPrecount) {
            return this._recheckFees(result, data)
        }

        const div = BlocksoftUtils.div(data.amount, maxPrice) * 1
        if (div < 1 && logInputsOutputs.diffInOut > 0) {
            maxPrice = logInputsOutputs.diffInOut
            maxFeePerByte = Math.ceil(BlocksoftUtils.div(logInputsOutputs.diffInOut, txSize) * 1)
            if (maxPrice < slowPrice) {
                maxLang = 'ltc_corrected_speed_blocks_12_protection'
            } else if (maxPrice < mediumPrice) {
                maxLang = 'ltc_corrected_speed_blocks_6_protection'
            } else if (maxPrice < fastestPrice ) {
                maxLang = 'ltc_corrected_speed_blocks_2_protection'
            }
            result[2].showError = true
            result.push({
                langMsg: maxLang,
                feeForByte: maxFeePerByte,
                feeForTx: maxPrice,
                showError: false,
                txSize
            })
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate result', result)

        return this._recheckFees(result, data)
    }

    async _recheckFees(fees, dataMain) {
        if (!fees || !fees.length) return false
        let fee
        const data = JSON.parse(JSON.stringify(dataMain))

        const checkedFees = []
        if (typeof data.addressForChange !== 'undefined' && data.addressForChange === 'TRANSFER_ALL') {

            const lastFee = fees[fees.length - 1].feeForTx
            for (fee of fees) {
                try {
                    data.feeForTx = fee
                    if (typeof lastFee !== 'undefined' && typeof fee.feeForTx !== 'undefined') {
                        const tmp = BlocksoftUtils.add(data.amount - fee.feeForTx, lastFee)
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ` DogeTransferProcessor._recheckFees data.amount by lastFee ${data.amount} - ${fee.feeForTx} + ${lastFee} = ${tmp}`)
                        data.amount = tmp
                    }
                    const preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRecheckTrAll')
                    const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRecheckTrAll')
                    fee.preparedInputsOutputs = preparedInputsOutputs
                    // console.log('')
                    // console.log('tr fee corrected ', fee.feeForTx + ' / ' + fee.feeForByte + ' => ' + logInputsOutputs.diffInOut, logInputsOutputs)
                    // console.log('')
                    fee.feeForTx = logInputsOutputs.diffInOut
                    fee.txSize = await this._getSize(data, preparedInputsOutputs)
                    fee.feeForByte = Math.round(logInputsOutputs.diffInOut / fee.txSize)
                    fee.multiply = preparedInputsOutputs.multiply || 0
                    checkedFees.push(fee)
                } catch (e) {
                    // do nothing
                }
            }

        } else {
            for (fee of fees) {
                try {
                    data.feeForTx = fee
                    const preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRecheck')
                    const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRecheck')
                    fee.preparedInputsOutputs = preparedInputsOutputs
                    // console.log('')
                    // console.log('fee corrected ', fee.feeForTx + ' / ' + fee.feeForByte + ' => ' + logInputsOutputs.diffInOut, logInputsOutputs)
                    // console.log('')
                    fee.feeForTx = logInputsOutputs.diffInOut
                    fee.txSize = await this._getSize(data, preparedInputsOutputs)
                    fee.feeForByte = Math.round(logInputsOutputs.diffInOut / fee.txSize)
                    fee.multiply = preparedInputsOutputs.multiply || 0
                    checkedFees.push(fee)
                } catch (e) {
                    // do nothing
                }
            }
        }

        const tested = []
        const already = {}
        let showSmallFeeNotice = true
        for (let i = checkedFees.length - 1; i>= 0; i--) {
            fee = fees[i]
            if (typeof already[fee.feeForTx] === 'undefined') {
                if (fee.langMsg ===  this._langPrefix + '_speed_blocks_2') {
                    showSmallFeeNotice = false
                }
                tested.push(fee)
                already[fee.feeForTx] = 1
            }
        }
        if (showSmallFeeNotice) {
            for (let i = tested.length - 1; i>=0; i--) {
                tested[i].showSmallFeeNotice = true
            }
        }
        return tested.reverse()
    }

    async _getSize(data, preparedInputsOutputs) {
        let txSize = 400
        try {
            const rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
            txSize = Math.ceil(rawTxHex.length / 2)
        } catch (e) {

        }
        return txSize
    }

    /**
     * @param {Object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

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
            const tmp = { unspents: this._precached.unspents, error: e.message }
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('doge_error_3 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, tmp)
            if (e.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE') {
                return 0
            }
            throw e
        }
        const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' DogeTransferProcessor.getTransferAllBalance')
        return logInputsOutputs.totalOut
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.multiply
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @returns {Promise<{correctedAmountFrom: string, hash: string}>}
     */
    async sendTx(data) {
        this._initProviders()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let preparedInputsOutputs
        let subtitle = false
        let showError = false
        if (typeof data.feeForTx !== 'undefined' && data.feeForTx) {
            if (typeof data.feeForTx.preparedInputsOutputs !== 'undefined' && data.feeForTx.preparedInputsOutputs) {
                preparedInputsOutputs = data.feeForTx.preparedInputsOutputs
                subtitle = ' BtcTransferProcessor.sendTxPrefee'
            }
            if (typeof data.feeForTx.showError !== 'undefined' && data.feeForTx.showError) {
                showError = true
            }
        }

        if (subtitle === false) {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
            subtitle = ' BtcTransferProcessor.sendTx'
        }

        let logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + subtitle)

        if (logInputsOutputs.diffInOut > data.amount * 1.1 || logInputsOutputs.diffInOutReadable > this._maxDiffInOutReadable) {
            if (typeof preparedInputsOutputs.multiply !== 'undefined' && preparedInputsOutputs.multiply > 1) {
                // continue
            } else {
                const e = new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
                e.code = 'ERROR_USER'
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('doge_error_4_0 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
                throw e
            }
        }

        let rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs, logInputsOutputs)
        let error = false
        let result = false
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try')
        } catch (e1) {
            let lengthOutputs = preparedInputsOutputs.outputs.length
            if (!showError) {
                if (e1.message === 'SERVER_RESPONSE_NOT_CONNECTED') {
                    rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs, logInputsOutputs)
                    try {
                        result = await this.sendProvider.sendTx(rawTxHex, 'resend as not connected')
                    } catch (e2) {
                        error = e2
                    }
                } else if (e1.message === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST' && lengthOutputs > 1) {
                    lengthOutputs = lengthOutputs - 1
                    const lastOutput = preparedInputsOutputs.outputs[lengthOutputs]
                    if (lastOutput.amount < this._minOutputToBeDusted && lastOutput.to === data.addressTo) {
                        MarketingEvent.logOnlyRealTime('doge_error_4_will_resend ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx will resend without lastOutput', logInputsOutputs)

                        const newOutputs = []
                        for (let i = 0; i < lengthOutputs; i++) {
                            newOutputs.push(preparedInputsOutputs.outputs[i])
                        }
                        preparedInputsOutputs.outputs = newOutputs

                        logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.sendTx')

                        if (logInputsOutputs.diffInOut > data.amount * 1.1 || logInputsOutputs.diffInOutReadable > this._maxDiffInOutReadable) {
                            const e = new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
                            e.code = 'ERROR_USER'
                            // noinspection ES6MissingAwait
                            MarketingEvent.logOnlyRealTime('doge_error_4_0_on_resend ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
                            throw e
                        }
                        rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs, logInputsOutputs)
                        try {
                            result = await this.sendProvider.sendTx(rawTxHex, 'resend without last output')
                        } catch (e2) {
                            error = e2
                        }
                    } else {
                        error = e1
                    }
                } else if (e1.message === 'SERVER_RESPONSE_NO_RESPONSE_OR_MORE_FEE') {
                    if (typeof preparedInputsOutputs.multiply === 'undefined' || preparedInputsOutputs.multiply < 1000) {
                        error = e1
                        error.needFees = true
                    } else {
                        error = new Error('SERVER_RESPONSE_NO_RESPONSE')
                    }
                } else {
                    error = e1
                }
            } else {
                error = e1
            }
        }




        if (error) {
            if (typeof error.code !== 'undefined' && error.code === 'ERROR_USER') {
                // can do something here to try more
                logInputsOutputs.error = error.basicMessage
                logInputsOutputs.userError = error.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('doge_error_4_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx basicMessage', error.basicMessage)
                throw error
            } else {
                logInputsOutputs.userError = error.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('doge_error_4_2 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)

                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                throw error
            }
        }

        if (!result) {
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('doge_error_4_3 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        // start prepare for next transactions will not work as it will give the same outputs
        this._precached.time = 0

        logInputsOutputs.hash = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('doge_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)

        return { hash: result, correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom }
    }



    _logInputsOutputs(data, preparedInputsOutputs, title) {
        const logInputsOutputs = {
            inputs: [],
            outputs: [],
            totalIn: 0,
            totalOut: 0,
            diffInOut: 0,
            msg: preparedInputsOutputs.msg || 'none'
        }
        const totalInBN = new BlocksoftBN(0)
        const totalOutBN = new BlocksoftBN(0)
        const totalBalanceBN = new BlocksoftBN(0)

        let unspent
        for (unspent of this._precached.unspents) {
            totalBalanceBN.add(unspent.value)
        }

        const leftBalanceBN = new BlocksoftBN(totalBalanceBN)
        let input, output
        if (preparedInputsOutputs) {
            for (input of preparedInputsOutputs.inputs) {
                logInputsOutputs.inputs.push({
                    txid: input.txid,
                    vout: input.vout,
                    value: input.value,
                    confirmations: input.confirmations,
                    address: input.address
                })
                totalInBN.add(input.value)
                leftBalanceBN.diff(input.value)
            }
            for (output of preparedInputsOutputs.outputs) {
                logInputsOutputs.outputs.push(output)
                totalOutBN.add(output.amount)
            }
        }
        logInputsOutputs.totalIn = totalInBN.get()
        logInputsOutputs.totalOut = totalOutBN.get()
        logInputsOutputs.diffInOut = totalInBN.diff(totalOutBN).get()
        logInputsOutputs.diffInOutReadable = BlocksoftUtils.toUnified(logInputsOutputs.diffInOut, this._settings.decimals)

        const tmpBN = new BlocksoftBN(totalOutBN).diff(data.amount)
        if (logInputsOutputs.diffInOut > 0) {
            tmpBN.add(logInputsOutputs.diffInOut)
        }
        logInputsOutputs.totalOutMinusAmount = tmpBN.get()
        logInputsOutputs.totalBalance = totalBalanceBN.get()
        logInputsOutputs.leftBalance = leftBalanceBN.get()
        logInputsOutputs.leftBalanceAndChange = BlocksoftUtils.add(leftBalanceBN, tmpBN)

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
        MarketingEvent.logOnlyRealTime('doge_info ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
        return logInputsOutputs
    }
}
