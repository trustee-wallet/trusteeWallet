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
import DaemonCache from '../../../app/daemons/DaemonCache'
import BlocksoftBN from '../../common/BlocksoftBN'


const CACHE_VALID_TIME = 1000
const CACHE_ALL_VALID_TIME = 10000

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
            unspentsKey: '',
            addressTo: '',
            usdtBalance: 0,
            time: 0
        }
        this._prefees = {
            unspentsKey: '',
            fees: [],
            time: 0
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

    _unspentsKeyFromData(data) {
        const txHash = data.txHash || false
        const txIn = data.txInput || false
        let key
        if (txHash) {
            key = txHash
        } else {
            key = data.addressFrom
        }
        if (txIn) {
            key += txIn
        }
        return key
    }

    _feeKeyFromData(data) {
        const txHash = data.txHash || false
        const txIn = data.txInput || false
        let key
        if (txHash) {
            key = txHash
        } else {
            key = data.addressFrom
        }
        if (txIn) {
            key += txIn
        }
        if (typeof data.addressTo !== 'undefined') {
            key += '_' + data.addressTo
        }

        if (typeof data.addressForChange !== 'undefined') {
            key += '_' + data.addressForChange
            if (data.addressForChange !== 'TRANSFER_ALL') {
                if (typeof data.amount !== 'undefined') {
                    key += '_' + data.amount
                }
            }
        } else if (typeof data.amount !== 'undefined') {
            key += '_' + data.amount
        }
        return key
    }

    /**
     * @param {string} data.txHash
     * @param {string} data.txInput
     * @param {string} data.addressFrom
     * @param {string} data.addressFromLegacy
     * @param {string} data.addressFromXpub
     * @param {string} data.addressFromCompatibleXpub
     * @param {string} data.addressFromLegacyXpub
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data, source) {
        this._initProviders()
        try {
            const txHash = data.txHash || false
            const txIn = data.txInput || false
            const address = data.addressFromXpub ? data.addressFromXpub : data.addressFrom
            const addressLegacy = data.addressFromLegacyXpub ? data.addressFromLegacyXpub : data.addressFromLegacy
            const addressCompatible = data.addressFromCompatibleXpub ? data.addressFromCompatibleXpub : false

            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache ' + data.addressFrom + ' started ' + address + ' ' + addressLegacy)

            this._precached.unspents = await this.unspentsProvider.getUnspents(address, addressLegacy, addressCompatible, source)

            if (txHash) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache for TX ' + txHash)

                const tmp = await this.unspentsProvider.getTx(txHash, this._precached.unspents)
                if (tmp && typeof tmp !== 'undefined' && typeof tmp.sortedUnspents !== 'undefined') {
                    this._precached.unspents = tmp.sortedUnspents
                    if (tmp.addressTo !== 'undefined') {
                        this._precached.addressTo = tmp.addressTo
                    }
                } else {
                    throw new Error('SERVER_RESPONSE_BAD_TX_TO_REPLACE')
                }

            }


            this._precached.blocks_12 = await this.networkPrices.getNetworkPrices(12, this._settings.currencyCode)
            this._precached.blocks_6 = await this.networkPrices.getNetworkPrices(6, this._settings.currencyCode)
            this._precached.blocks_2 = await this.networkPrices.getNetworkPrices(2, this._settings.currencyCode)


            if (this.usdtScannerProcessor) {
                const tmp = await DaemonCache.getCacheAccount(data.walletHash, 'USDT')
                this._precached.usdtBalance = 0
                // this._precached.usdtBalance = await this.usdtScannerProcessor.getBalanceBlockchain(data.addressFromLegacy)
                if (tmp && typeof tmp.balanceRaw !== 'undefined' && tmp.balanceRaw) {
                    this._precached.usdtBalance = tmp.balanceRaw
                }

            } else {
                this._precached.usdtBalance = 0
            }

            if (this._precached.unspents) {
                if (txIn) {
                    let unspent = false
                    for (unspent of this._precached.unspents) {
                        if (unspent.txid !== txIn) continue
                        unspent.isRequired = true
                        unspent.confirmations = 12
                    }
                }
                if (this._precached.unspents.length > 1) {
                    this._precached.unspents.sort((a, b) => {
                        if (a.isRequired) {
                            if (b.isRequired) {
                                return BlocksoftUtils.diff(b.value, a.value) // cloning diff as usual with change inner value of a and b
                            } else {
                                return false
                            }
                        } else {
                            return BlocksoftUtils.diff(b.value, a.value)
                        }
                    })
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents sorted', this._precached.unspents)
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache unspents returned', this._precached.unspents)
                }
                MarketingEvent.logOnlyRealTime('btc_unspents_scanned ' + this._settings.currencyCode + ' ' + data.addressFrom, {
                    address,
                    addressLegacy,
                    unspents: this._precached.unspents
                })
            }
            this._precached.unspentsKey = this._unspentsKeyFromData(data)
            this._precached.time = new Date().getTime()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferPrecache finished', this._precached)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                e.message += ' in getTransferPrecache BTC '
            }
            throw e
        }
        return this._precached
    }


    setCacheFees(fees, data) {
        const key = this._feeKeyFromData(data)
        this._prefees.unspentsKey = key
        this._prefees.fees = fees
        this._prefees.time = new Date().getTime()
        this._prefees.amount = data.amount
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
     * @param {number|boolean} additionalData.isPrecount
     */
    async getFeeRate(data, additionalData) {
        this._initProviders()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + data.addressFrom + ' started')

        const txHash = data.txHash || false
        const now = new Date().getTime()

        const isPrecount =  typeof additionalData.isPrecount  === 'undefined' || additionalData.isPrecount === false

        if (data.addressForChange === 'TRANSFER_ALL' && this._prefees.unspentsKey === this._feeKeyFromData(data) && now - this._prefees.time < CACHE_ALL_VALID_TIME) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + data.addressFrom + ' precached', this._prefees)
            return this._prefees.fees
        }

        if (this._precached.unspentsKey !== this._unspentsKeyFromData(data) || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data, 'btc getFeeRate')
        }

        if (this._settings.currencyCode === 'USDT' && typeof this._precached.usdtBalance !== 'undefined' && this._precached.usdtBalance && this._precached.usdtBalance > 0) {
            const diff = BlocksoftUtils.diff(data.amount, this._precached.usdtBalance)
            if (diff > 0) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + data.addressFrom + ' amount ' + data.amount + ' usdtBalance ' + this._precached.usdtBalance + ' diff ' + diff)
                throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            }
        }

        const startBlocks = ['blocks_2', 'blocks_6', 'blocks_12']
        const startOptions = ['usual', 'usual minus', 'usual plus1', 'usual plus2']
        const preparedInputsOutputsBlocks = { blocks_2: false, blocks_6: false, blocks_12: false }
        const logInputsOutputsBlocks = { blocks_2: false, blocks_6: false, blocks_12: false }
        let startBlock
        let prevBlock
        let startIndex = 0
        let prevError = false
        while (startIndex < 3) {
            startBlock = startBlocks[startIndex]
            let preparedInputsOutputs
            let startFee = this._precached[startBlock]
            if (txHash) {
                startFee = startFee * 2
            }
            let startOption
            for (startOption of startOptions) {
                // console.log(' ENTER ' + startBlock + ' ' + startOption)
                let moreFeesIsBetter = false
                if (preparedInputsOutputsBlocks[startBlock] && logInputsOutputsBlocks[startBlock]) {
                    if (data.addressForChange === 'TRANSFER_ALL' && startBlock === 'blocks_2') {
                        // do all
                        moreFeesIsBetter = true
                    } else {
                        continue
                    }
                }
                try {
                    const customData = JSON.parse(JSON.stringify(data))
                    customData.customFeeForByte = startFee
                    if (startOption.indexOf('minus') !== -1) {
                        if (moreFeesIsBetter) {
                            customData.customFeeForByte = startFee + 30
                        } else if (startFee > 10) {
                            customData.customFeeForByte = startFee - 10
                        } else {
                            customData.customFeeForByte = startFee - 5
                        }
                    } else if (startOption.indexOf('plus') !== -1) {

                        if (prevError === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE' || prevError === 'SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE') {
                            if (startOption.indexOf('plus1') !== -1) {
                                if (startFee > 100) {
                                    customData.customFeeForByte = startFee - 100
                                } else if (startFee > 50) {
                                    customData.customFeeForByte = startFee - 50
                                } else if (startBlock === 'blocks_12') {
                                    customData.customFeeForByte = 10
                                } else {
                                    customData.customFeeForByte = startFee - 15
                                }
                            } else {
                                if (startBlock === 'blocks_12') {
                                    customData.customFeeForByte = 1
                                } else {
                                    customData.customFeeForByte = startFee - 20
                                }
                            }
                        } else {
                            customData.customFeeForByte = startFee + 10
                        }
                    }
                    // console.log(' TRY ' + startOption + ' ' + startBlock + ' ' + customData.customFeeForByte)
                    preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(customData, this._precached, 'getFeeRate ' + startFee + ' ' + startOption)
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + startBlock + ' ' + startFee + ' ' + startOption + ' preparedInputsOutputs', preparedInputsOutputs)
                } catch (e) {
                    prevError = e.message
                    // console.log(' ERR ' + e.message)
                    continue
                }
                prevError = false

                const txSize = await this._getSize(data, preparedInputsOutputs)

                const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate ' + startBlock + ' ' + startOption)
                logInputsOutputs.feeForTx = Math.round(logInputsOutputs.diffInOut)
                logInputsOutputs.feeForByte = Math.round(logInputsOutputs.diffInOut / txSize)
                logInputsOutputs.txSize = txSize

                if (prevBlock) {
                    if (logInputsOutputsBlocks[prevBlock].diffInOut === logInputsOutputs.diffInOut) {
                        continue
                    } else if (logInputsOutputsBlocks[prevBlock].diffInOut * 1 < logInputsOutputs.diffInOut * 1) {
                        // console.log(' RESET BLOCK ')
                        startIndex--
                        prevBlock = false
                        break
                    }
                }

                /*
                console.log('')
                console.log('')
                console.log('=========logInputsOutputs ' + startBlock + ' ' + startFee + ' ' + startOption + '===========')
                console.log(' txSize : ' + logInputsOutputs.txSize)
                console.log(' fee : ' + logInputsOutputs.diffInOut)
                console.log(' feePerByte : ' + logInputsOutputs.feeForByte)
                console.log(' msg ' + logInputsOutputs.msg)
                console.log(JSON.parse(JSON.stringify(logInputsOutputs)))
                console.log('')
                */

                if (!logInputsOutputsBlocks[startBlock]) {
                    preparedInputsOutputsBlocks[startBlock] = preparedInputsOutputs
                    logInputsOutputsBlocks[startBlock] = logInputsOutputs
                } else {
                    const abs = logInputsOutputsBlocks[startBlock].feeForByte - startFee
                    const abs2 = logInputsOutputs.feeForByte - startFee
                    if (Math.abs(abs) > Math.abs(abs2)) {
                        preparedInputsOutputsBlocks[startBlock] = preparedInputsOutputs
                        logInputsOutputsBlocks[startBlock] = logInputsOutputs
                    }

                }
            }
            prevBlock = startBlock
            startIndex++
        }

        if (!isPrecount && prevError) {
            if (prevError === 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE' || prevError === 'SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE') {
                throw new Error( 'SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }

        let slowPrice = logInputsOutputsBlocks.blocks_12.diffInOut
        let mediumPrice = logInputsOutputsBlocks.blocks_6.diffInOut
        let fastestPrice = logInputsOutputsBlocks.blocks_2.diffInOut
        if (mediumPrice * 1 >= fastestPrice * 1) {
            // console.log('mediumPrice>=fastestPrice ' + mediumPrice + ' ' + fastestPrice)
            preparedInputsOutputsBlocks.blocks_6 = false
            mediumPrice = Math.round(fastestPrice / 2)
        }
        if (slowPrice * 1 >= mediumPrice * 1) {
            // console.log('slowPrice>=mediumPrice ' + slowPrice + ' ' + mediumPrice)
            preparedInputsOutputsBlocks.blocks_12 = false
            slowPrice = Math.round(mediumPrice / 2)
        }

        let maxPrice = fastestPrice
        let maxFeePerByte = logInputsOutputsBlocks.blocks_2.feeForByte
        let maxLang = this._langPrefix + '_speed_blocks_2'
        let maxTxSize = logInputsOutputsBlocks.blocks_2.txSize

        const tmp = BlocksoftUtils.diff(logInputsOutputsBlocks.blocks_2.leftBalanceAndChange, maxPrice)
        if (!isPrecount && tmp.toString() < 0) {
            // console.log('leftBalance less then Zero ' + tmp.toString())
            preparedInputsOutputsBlocks.blocks_2 = false
            if (logInputsOutputsBlocks.blocks_2.leftBalanceAndChange <= 0) {
                maxPrice = logInputsOutputsBlocks.blocks_2.diffInOut
            } else {
                maxPrice = logInputsOutputsBlocks.blocks_2.leftBalanceAndChange
            }
            maxFeePerByte = BlocksoftUtils.div(maxPrice, maxTxSize)
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
                feeForByte: logInputsOutputsBlocks.blocks_12.feeForByte,
                feeForTx: slowPrice,
                txSize: logInputsOutputsBlocks.blocks_12.txSize,
                preparedInputsOutputs: preparedInputsOutputsBlocks.blocks_12,
                needSpeed: this._precached.blocks_12,
                firstNeedSpeed: this._precached.blocks_12,
                sortIndex: 1
            },
            {
                langMsg: this._langPrefix + '_speed_blocks_6',
                feeForByte: logInputsOutputsBlocks.blocks_6.feeForByte,
                feeForTx: mediumPrice,
                txSize: logInputsOutputsBlocks.blocks_6.txSize,
                preparedInputsOutputs: preparedInputsOutputsBlocks.blocks_6,
                needSpeed: this._precached.blocks_6,
                firstNeedSpeed: this._precached.blocks_6,
                sortIndex: 2
            },
            {
                langMsg: maxLang,
                feeForByte: maxFeePerByte,
                feeForTx: maxPrice,
                txSize: maxTxSize,
                preparedInputsOutputs: preparedInputsOutputsBlocks.blocks_2,
                needSpeed: this._precached.blocks_2,
                firstNeedSpeed: this._precached.blocks_2,
                sortIndex: 3
            }
        ]
        // console.log('result', JSON.parse(JSON.stringify(result)))

        if (isPrecount) {
            try {
                const cacheFees = await this._recheckFees(result, data, isPrecount)
                this.setCacheFees(cacheFees, data)
                return cacheFees
            } catch (e) {
                if (e.message.indexOf('SERVER_') === -1) {
                    e.message += ' on _recheckFees1'
                }
                throw e
            }
        }
        if (this._settings.currencyCode !== 'USDT' && !txHash) {
            const div = BlocksoftUtils.div(data.amount, maxPrice) * 1
            if (div < 5) {
                const tmp = BlocksoftUtils.div(data.amount, 20) * 1
                if (tmp > 0) {
                    maxFeePerByte = Math.round(BlocksoftUtils.div(tmp, maxTxSize) * 1)
                    maxPrice = Math.round(BlocksoftUtils.mul(maxFeePerByte, maxTxSize))
                    if (maxPrice < slowPrice || maxFeePerByte < this._precached.blocks_12) {
                        maxLang = 'btc_corrected_speed_blocks_12_protection'
                    } else if (maxPrice < mediumPrice || maxFeePerByte < this._precached.blocks_6) {
                        maxLang = 'btc_corrected_speed_blocks_6_protection'
                    } else {
                        maxLang = 'btc_corrected_speed_blocks_2_protection'
                    }
                    result.push({
                        langMsg: maxLang,
                        feeForByte: maxFeePerByte,
                        feeForTx: maxPrice,
                        txSize: maxTxSize,
                        needSpeed: '',
                        sortIndex: 100
                    })
                }
            }
        }
        // console.log('result2', JSON.parse(JSON.stringify(result)))

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getFeeRate result', result)

        const cacheFees = await this._recheckFees(result, data)
        this.setCacheFees(cacheFees, data)
        return cacheFees
    }

    async _recheckFees(fees, dataMain) {
        if (!fees || !fees.length) {
            if (this._precached.unspents) {
                throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
            } else {
                return false
            }
        }
        let fee
        const data = JSON.parse(JSON.stringify(dataMain))

        for (fee of fees) {
            // console.log('fee', JSON.parse(JSON.stringify(fee)))
            data.feeForTx = fee
            let preparedInputsOutputs = fee.preparedInputsOutputs
            let recounted
            if (!preparedInputsOutputs) {
                recounted = true
                try {
                    preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getFeeRecheck')
                    fee.txSize = await this._getSize(data, preparedInputsOutputs)
                } catch (e) {
                    console.log(e)
                    preparedInputsOutputs = false
                }
                fee.preparedInputsOutputs = preparedInputsOutputs
            }
            fee.txAllowReplaceByFee = data.txAllowReplaceByFee
            // console.log('')
            // console.log('fee corrected ', fee.feeForTx + ' / ' + fee.feeForByte + ' => ' + logInputsOutputs.diffInOut, logInputsOutputs)
            // console.log('')
            if (recounted) {
                const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.getFeeRecheck')
                fee.feeForTx = logInputsOutputs.diffInOut
                fee.feeForByte = Math.round(logInputsOutputs.diffInOut / fee.txSize)

                /*
                console.log('')
                console.log('')
                console.log('=========logInputsOutputs recounted ===========')
                console.log(' old : ', recounted)
                console.log(' txSize : ' + fee.txSize)
                console.log(' fee : ' + logInputsOutputs.diffInOut)
                console.log(' feePerByte : ' + fee.feeForByte)
                console.log(' msg ' + logInputsOutputs.msg)
                console.log(JSON.parse(JSON.stringify(logInputsOutputs)))
                console.log('')
                */
            }
        }

        // console.log('result3', JSON.parse(JSON.stringify(fees)))

        const tested = []
        const already = {}

        fees = fees.sort((a, b) => {
            if (b.sortIndex < 100 && a.sortIndex < 100) {
                return b.feeForTx - a.feeForTx
            }
            return b.sortIndex - a.sortIndex
        })


        // console.log('result4', JSON.parse(JSON.stringify(fees)))

        for (let i = fees.length - 1; i >= 0; i--) {
            fee = fees[i]
            if (!fee.preparedInputsOutputs) continue
            if (typeof already[fee.feeForTx] === 'undefined') {
                already[fee.feeForTx] = tested.length
                tested.push(fee)
            } else {
                const saved = tested[already[fee.feeForTx]]
                if (saved.needSpeed && saved.needSpeed > fee.needSpeed) {
                    tested[already[fee.feeForTx]].langMsg = fee.langMsg
                    tested[already[fee.feeForTx]].needSpeed = fee.needSpeed
                }
            }
        }

        // console.log('result4+1', JSON.parse(JSON.stringify(fees)))

        const speeds = [12, 6, 2]
        let totalSpeeds = 0
        const testedL = tested.length
        if (testedL >= 2) {
            for (let i = 0; i <= testedL; i++) {
                if (typeof tested[i] === 'undefined') continue
                if (tested[i].sortIndex < 100) {
                    totalSpeeds++
                }
            }
            if (totalSpeeds === 3) {
                for (let i = 0; i < testedL; i++) {
                    if (tested[i].sortIndex < 100) {
                        tested[i].langMsg = this._langPrefix + '_speed_blocks_' + speeds[i]
                    }
                }
            } else if (totalSpeeds === 2) {
                for (let i = 0; i < testedL; i++) {
                    if (tested[i].sortIndex < 100) {
                        tested[i].langMsg = this._langPrefix + '_speed_blocks_' + speeds[i + 1]
                    }
                }
            }
        } else if (testedL === 1) {
            for (let i = 0; i < testedL; i++) {
                if (tested[i].sortIndex < 100) {
                    if (tested[i].feeForByte < this._precached.blocks_6 * 0.9) {
                        tested[i].langMsg = this._langPrefix + '_speed_blocks_12'
                    } else if (tested[i].feeForByte < this._precached.blocks_2 * 0.9) {
                        tested[i].langMsg = this._langPrefix + '_speed_blocks_6'
                    } else {
                        tested[i].langMsg = this._langPrefix + '_speed_blocks_2'
                    }
                }
            }
        }
        if (tested.length > 0) {
            let showSmallFeeNotice = true
            if (tested[0].feeForByte <= 2) {
                tested[0].langMsg = this._langPrefix + '_speed_blocks_24'
            }
            if (tested[tested.length - 1].langMsg === this._langPrefix + '_speed_blocks_2') {
                showSmallFeeNotice = false
            } else if (tested.length > 1) {
                if (tested[tested.length - 2].langMsg === this._langPrefix + '_speed_blocks_2') {
                    showSmallFeeNotice = false
                }
            }
            if (showSmallFeeNotice) {
                tested[tested.length - 1].showSmallFeeNotice = true
            }
        } else if (this._precached.unspents) {
            throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
        } else {
            return false
        }
        // console.log('result5', JSON.parse(JSON.stringify(tested)))
        return tested
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
        if (this._precached.unspentsKey !== this._unspentsKeyFromData(data) || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data, 'btc getTransferAllBalance')
        }

        let preparedInputsOutputs
        data.addressForChange = 'TRANSFER_ALL'
        try {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'getTransferAllBalance')
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.getTransferAllBalance preparedInputsOutputs', preparedInputsOutputs)
        } catch (e) {
            const tmp = { unspents: this._precached.unspents, error: e.message }
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
     * @param {string} data.walletAllowReplaceByFee
     * @param {string} data.txHash
     * @param {string} data.txInput
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @returns {Promise<{correctedAmountFrom: string, hash: string}>}
     */
    async sendTx(data, uiErrorConfirmed = false) {
        const txHash = data.txHash || false
        this._initProviders()

        if (txHash) {
            data.txAllowReplaceByFee = true
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx ' + data.addressFrom + ' resend started', {
                txHash: data.txHash,
                txInput: data.txInput,
                amount: data.amount
            })
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx ' + data.addressFrom + ' started', {
                txHash: data.txHash,
                txInput: data.txInput,
                amount: data.amount
            })
        }

        const now = new Date().getTime()
        if (this._precached.unspentsKey !== this._unspentsKeyFromData(data) || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data, 'btc sendTx')
        }

        if (txHash && (!data.addressTo || data.addressTo === '')) {
            data.addressTo = this._precached.addressTo
        }

        let preparedInputsOutputs, subtitle

        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.preparedInputsOutputs !== 'undefined' && data.feeForTx.preparedInputsOutputs) {
            preparedInputsOutputs = data.feeForTx.preparedInputsOutputs
            subtitle = ' BtcTransferProcessor.sendTxPrefee'
        } else {
            preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
            subtitle = ' BtcTransferProcessor.sendTxFee'
        }

        const logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + subtitle)

        if (logInputsOutputs.diffInOutReadable > 0.05) {
            const e = new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
            e.code = 'ERROR_USER'
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_4_0 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            throw e
        }

        const rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let result
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try', preparedInputsOutputs, uiErrorConfirmed)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                // can do something here to try more
                logInputsOutputs.userError = e.message
                logInputsOutputs.serverError = this.sendProvider.lastError
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('btc_error_4_1 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx serverError ' + logInputsOutputs.serverError)
                throw e
            } else {
                logInputsOutputs.userError = e.message
                MarketingEvent.logOnlyRealTime('btc_error_4_2 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                if (e.message === 'UI_CONFIRM_CHANGE_AMOUNT_FOR_REPLACEMENT') {
                    let newAmount = BlocksoftUtils.diff(data.amount, logInputsOutputs.diffInOut * 4)
                    if (newAmount < 0) {
                        newAmount = BlocksoftUtils.diff(data.amount, logInputsOutputs.diffInOut * 2)
                    }
                    if (newAmount < 0) {
                        newAmount = BlocksoftUtils.diff(data.amount, logInputsOutputs.diffInOut)
                    }
                    if (newAmount < 0) {
                        throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
                    }
                    e.newAmount = newAmount
                }
                throw e
            }
        }
        if (!result) {
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('btc_error_4_3 ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        // start prepare for next transactions will not work as it will give the same outputs
        this._precached.time = 0

        logInputsOutputs.HASH = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('btc_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
        MarketingEvent.logOnlyRealTime('btc_tx_raw_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo + ' ' + result, rawTxHex)

        return {
            hash: result,
            correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom,
            transactionJson: {
                nSequence: data.nSequence,
                allowReplaceByFee: data.txAllowReplaceByFee
            }
        }
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

        const tmpBN = new BlocksoftBN(totalOutBN)
        if (data.currencyCode === 'USDT') {
            // tmpBN.add(totalOutBN)
        } else {
            tmpBN.diff(data.amount)
        }
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
        MarketingEvent.logOnlyRealTime('btc_info ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logInputsOutputs)
        return logInputsOutputs
    }
}
