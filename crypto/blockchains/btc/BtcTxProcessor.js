import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BtcUsedOutputsDS from './stores/BtcUsedOutputsDS'

let bitcoin = require('bitcoinjs-lib')


const DUST_FIRST_TRY = 546
const DUST_SECOND_TRY = 600

const CACHE_VALID_TIME = 120000 // 2 minutes

const CACHE_UNSPENT_TIME = 60000


let CACHE_UNSPENTS = []
let CACHE_FEES = []
let CACHE_FEES_TIME = []

const networksConstants = require('../../common/ext/networks-constants')

class BtcTxProcessor {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTxProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTxProcessor requires settings.network')
        }
        BlocksoftCryptoLog.log('BtcTxProcessor init started', settings.currencyCode)

        this._estimateFeeApiPath = 'https://estimatefee.com/n'

        if (typeof (networksConstants[settings.network]) === 'undefined') {
            throw new Error('while retrieving Bitcoin address - unknown Bitcoin network specified. Got : ' + settings.network)
        }
        this._bitcoinNetwork = networksConstants[settings.network].network
        this._langPrefix = networksConstants[settings.network].langPrefix

        this._isDusty = settings.currencyCode === 'USDT'
        this._data = {}
        this._settings = settings
        this._initProviders(settings)
        BlocksoftCryptoLog.log('BtcTxProcessor inited', this._bitcoinNetwork)
    }

    _initProviders(settings) {
        this.unspentsProvider = require('./providers/BtcTxUnspentsProvider').init(settings)
        this.sendProvider = require('./providers/BtcTxSendProvider').init(settings)
        this.dataProvider = require('./providers/BtcTxDataProvider').init(settings)
    }

    /**
     * precache network prices to avoid delay on send
     * @return {Promise<[*, *, *]>}
     */
    async getNetworkPrices() {
        BlocksoftCryptoLog.log('BtcTxProcessor.getNetworkPrices started')
        return Promise.all([
            this._getNetworkPrices(12),
            this._getNetworkPrices(6),
            this._getNetworkPrices(2)
        ])
    }

    async _getNetworkPrices(blocks) {
        const now = new Date().getTime()
        const link = `${this._estimateFeeApiPath}/${blocks}`
        if (CACHE_FEES[blocks] && now - CACHE_FEES_TIME[blocks] < CACHE_VALID_TIME) {
            BlocksoftCryptoLog.log('BtcTxProcessor._getNetworkPrices used cache', blocks)
            return CACHE_FEES[blocks]
        }
        BlocksoftCryptoLog.log('BtcTxProcessor._getNetworkPrices no cache', blocks)
        let tmp = await BlocksoftAxios.get(link, true)
        CACHE_FEES[blocks] = Math.round(tmp.data * 100000)
        CACHE_FEES_TIME[blocks] = now
        return CACHE_FEES[blocks]
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {number} data.amount
     * @return {Promise<{feeForTx, langMsg, feeForByte, txSize}[]>}
     */
    async getFeeRate(data) {
        BlocksoftCryptoLog.log('BtcTxProcessor.getFeeRate started ' + this._settings.currencyCode)
        this._data = data

        let addressForChange = false
        if (typeof this._data.addressForChange !== 'undefined') {
            addressForChange = this._data.addressForChange
        }

        let rawTxHex = await this._getRawTx(this._data.privateKey, this._data.addressFrom, this._data.addressTo, this._data.amount, 0, addressForChange)
        let result = await Promise.all([
            this._getFee(12, rawTxHex),
            this._getFee(6, rawTxHex),
            this._getFee(2, rawTxHex)
        ])

        // @todo debug mode mark result[0].feeForTx = Math.round(result[0].feeForTx * 0.1)
        if (result[1].feeForTx === result[2].feeForTx) {
            if (result[0].feeForTx === result[1].feeForTx) {
                if (result[0].feeForByte < 5) {
                    // chip blockchains aka litecoin
                    result[1].feeForTx = Math.round(result[0].feeForTx * 1.2)
                    result[2].feeForTx = Math.round(result[0].feeForTx * 1.6)
                } else {
                    // normal blockchains but something wrong and all fees are the same
                    result[0].feeForTx = Math.round(result[0].feeForTx * 0.2)
                    result[1].feeForTx = Math.round(result[1].feeForTx * 0.6)
                }
            } else {
                result[1].feeForTx = Math.round(result[2].feeForTx * 0.8)
            }
        } else if (result[0].feeForTx === result[1].feeForTx) {
            result[0].feeForTx = Math.round(result[0].feeForTx * 0.8)
        }

        return result
    }

    /**
     * @param {int} blocks
     * @param {string} rawTxHex
     * @return {Promise<{feeForTx: number, txSize, langMsg: string, feeForByte: number}>}
     * @private
     */
    async _getFee(blocks, rawTxHex) {
        BlocksoftCryptoLog.log('BtcTxProcessor._getFee started', blocks, rawTxHex)
        let feeRate = await this._getNetworkPrices(blocks)
        let txSize = Math.ceil(rawTxHex.length / 2)
        let feeForTx = txSize * feeRate
        return {
            langMsg: this._langPrefix + '_speed_blocks_' + blocks,
            feeForByte: feeRate,
            feeForTx,
            txSize
        }
    }

    /**
     * @param {string} privateKey
     * @param {string} addressFrom
     * @param {string} addressTo
     * @param {string|number} amount
     * @param {string|number} fee
     * @param {string|boolean} addressForChange
     * @param {number} dustAmount
     * @param {object} replacingUtx
     * @param {number} nSequence
     * @return {Promise<string>}
     * @private
     */
    async _getRawTx(privateKey, addressFrom, addressTo, amount, fee = 0, addressForChange = false, dustAmount = DUST_FIRST_TRY,
                    replacingUtx = false, nSequence = 0xfffffffe) {
        BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx started', { addressFrom, addressTo, amount, fee, addressForChange, dustAmount })
        let keyPair = false
        try {
            keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            let address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: this._bitcoinNetwork }).address
            if (address !== addressFrom) {
                throw new Error('not valid signing address ' + addressFrom + ' != ' + address)
            }
        } catch (e) {
            e.message += ' in privateKey signature check '
            throw e
        }
        BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx validated address private key')

        let txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork)
        txb.setVersion(1)
        BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx builder started')

        let changed = this._customChangesToTx({ amount, dustAmount, txb })
        amount = changed.amount

        let utx = false
        // noinspection PointlessArithmeticExpressionJS
        let totalAmount = (BlocksoftUtils.toBigNumber(amount)).add(BlocksoftUtils.toBigNumber(fee)) // 100 + 0 = 1000
        let subtitle = ''
        if (replacingUtx) {
            if (replacingUtx.balance < (totalAmount)) {
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx will make replacingUtx => utx', `amount = ${amount} fee = ${fee} totalAmount = ${totalAmount}`)
                utx = await this._parseUnspents(addressFrom, totalAmount, replacingUtx)
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx replacingUtx => utx', replacingUtx, utx)
                subtitle = 'while recounting replacing by fee'
            } else {
                utx = replacingUtx
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx replacingUtx=utx', utx)
                subtitle = 'while replacing by fee'
            }
        } else {
            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx will make parsedUtx', `amount = ${amount} fee = ${fee} totalAmount = ${totalAmount}`)
            let minDiffFixing = false
            try {
                utx = await this._parseUnspents(addressFrom, totalAmount * 1 + 546)
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx parsedUtx', utx)
            } catch (e) {
                try {
                    utx = await this._parseUnspents(addressFrom, totalAmount * 1)
                    BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx parsedUtx', utx)
                } catch (e) {
                    if (typeof (e.diff) != 'undefined') {
                        if (addressForChange === 'TRANSFER_ALL') {
                            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx parsedUtx transferAll error diff ' + e.diff + ' ' + e.message)
                            utx = await this._parseUnspents(addressFrom, 'TRANSFER_ALL')
                            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx transferAll parsedUtx', utx)
                            let newFee = utx.balance - amount
                            if (fee - newFee < 1000) {
                                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx transferAll newFee ' + fee + ' => ' + newFee)
                                fee = newFee
                                minDiffFixing = true
                            }

                        } else {
                            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx parsedUtx error diff ' + e.diff + ' ' + e.message)
                            let module = -1 * e.diff
                            if (module < 10000) {
                                minDiffFixing = true
                                BlocksoftCryptoLog.log(`BtcTxProcessor._getRawTx parsedUtx fixing fee = ${fee} totalAmount = ${totalAmount}`)
                                totalAmount -= module
                                fee -= module
                                BlocksoftCryptoLog.log(`BtcTxProcessor._getRawTx parsedUtx fixed fee = ${fee} totalAmount = ${totalAmount}`)
                                utx = await this._parseUnspents(addressFrom, totalAmount)
                                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx parsedUtx', utx)
                            } else {
                                throw e
                            }
                        }
                    } else {
                        throw e
                    }
                }
            }

            if (!utx || !utx.unspents || utx.unspents.length === 0) {
                let e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                e.code = 'ERROR_USER'
                throw e
            }
        }



        let change = utx.balance - amount - fee
        if (change < 0) {
            let e = new Error('not enough funds, max from outputs ' + subtitle + ' = '
                + BlocksoftUtils.toUnified(utx.balance - fee, this._settings.decimals) + ' ' + this._settings.currencyCode
                + ', requested = ' + BlocksoftUtils.toUnified(amount, this._settings.decimals) + ' ' + this._settings.currencyCode)
            e.code = 'ERROR_USER'
            e.outputs = utx.balance - fee
            throw e
        }

        if (fee > amount && ! this._isDusty) {
            let e = new Error('fee more than amount, fee = '
                + BlocksoftUtils.toUnified(fee, this._settings.decimals) + ' ' + this._settings.currencyCode
                + ', amount = ' + BlocksoftUtils.toUnified(amount, this._settings.decimals) + ' ' + this._settings.currencyCode)
            e.code = 'ERROR_USER'
            throw e
        }

        let log = { inputs: [], outputs: [] }
        for (let i = 0, ic = utx.unspents.length; i < ic; i++) {
            txb.addInput(utx.unspents[i].txId, utx.unspents[i].vout, nSequence)
            log.inputs.push({ txId: utx.unspents[i].txId, vout: utx.unspents[i].vout,  nSequence })
            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx input added', utx.unspents[i])
        }

        if (addressForChange === 'TRANSFER_ALL' && change < 10000 && !this._isDusty) {
            // noinspection PointlessArithmeticExpressionJS
            txb.addOutput(addressTo, amount * 1)
            log.outputs.push({ addressTo, amount })
            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx output added for transfer all', { addressTo, amount })
        } else {
            // noinspection PointlessArithmeticExpressionJS
            txb.addOutput(addressTo, amount * 1)
            log.outputs.push({ addressTo, amount })
            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx output added for usual transfer', { addressTo, amount })
            if (change > 1) {
                let addressCheckedForChange = addressFrom
                if (addressForChange && addressForChange !== 'TRANSFER_ALL') {
                    addressCheckedForChange = addressForChange
                }
                let tmp = { addressTo: addressCheckedForChange, change }
                try {
                    txb.addOutput(addressCheckedForChange, change)
                    log.outputs.push(tmp)
                    BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx change output added ', tmp)
                } catch (e) {
                    e.message = ' transaction add change error: ' + e.message + ' ' + JSON.stringify(tmp)
                    throw e
                }
            } else {
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx no change', { change })
            }
        }
        BtcUsedOutputsDS.setTmpUsed(this._settings.currencyCode, addressFrom, log.inputs)

        for (let i = 0; i < utx.unspents.length; i++) {
            try {
                txb.sign(i, keyPair)
                BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx sign added')
            } catch (e) {
                alert(e.message)
                e.message = ' transaction sign error: ' + e.message
                throw e
            }
        }

        let hex
        try {
            hex = txb.build().toHex()
            BlocksoftCryptoLog.log('BtcTxProcessor._getRawTx size ' + hex.length, log)

        } catch (e) {
            e.message = ' transaction build error: ' + e.message
            throw e
        }
        return hex
    }

    _customChangesToTx(params) {
        return { amount: params.amount }
    }

    /**
     * @param {[{tx_hash, tx_output_n, value, isConfirmed}]} txrefs
     * @param {number|string} wishedAmount
     * @param {number|boolean} totalBalance
     * @param {{unspents: [{txId, vout, value}], balance}} utx
     * @param {boolean} confirmedOnly
     * @return {Promise<{unspents: [{txId, vout, value, isConfirmed}], balance}>}
     * @private
     */
    async _sortParse(txrefs, wishedAmount, totalBalance = false, utx, confirmedOnly) {

        if (totalBalance === false) {
            totalBalance = BlocksoftUtils.toBigNumber(0)
            for (let i = 0, ic = txrefs.length; i < ic; i++) {
                if (confirmedOnly && !txrefs[i].isConfirmed) continue
                // noinspection JSUnresolvedFunction
                totalBalance = totalBalance.add(BlocksoftUtils.toBigNumber(txrefs[i].value))
            }
        }

        if (wishedAmount !== 'TRANSFER_ALL') {
            let diff = totalBalance.sub(BlocksoftUtils.toBigNumber(wishedAmount))
            diff = diff.toString() * 1
            BlocksoftCryptoLog.log('BtcTxProcessor._sortParse started', `wishedAmount = ${wishedAmount} totalBalance = ${totalBalance} diff ${diff}`)

            let currencyCode = this._settings.currencyCode
            let decimals = this._settings.decimals
            if (diff < 0) {
                let e = new Error(`inputs don't posses enough ${currencyCode} amount for this transaction (max = ${BlocksoftUtils.toUnified(totalBalance, decimals)} ${currencyCode} / wished ${BlocksoftUtils.toUnified(wishedAmount, decimals)} } ${currencyCode} / diff ${BlocksoftUtils.toUnified(diff, decimals)} ${currencyCode}) `)
                e.code = 'ERROR_USER'
                e.diff = diff
                throw e
            }

            let compareFunc = (a, b) => {
                return b.value - a.value
            }
            txrefs.sort(compareFunc)
        }

        // noinspection JSUnresolvedFunction
        let leftBalance = totalBalance.sub(BlocksoftUtils.toBigNumber(utx.balance)) // both in satoshi

        let ic = txrefs.length
        let msg = 'wishedAmount ' + wishedAmount + ' totalInputs ' + ic
        for (let i = 0; i < ic; i++) {

            if (confirmedOnly && !txrefs[i].isConfirmed) continue

            if (wishedAmount !== 'TRANSFER_ALL' && utx.balance >= wishedAmount) {
                msg += ' finished by collectedAmount ' + utx.balance
                break
            }

            //if (this._isTxrefIncluded(utx.unspents, txrefs[i])) {
            //    msg += ' ' + i + ') skipped as used ' + txrefs[i].value
            //    continue
            //}

            if (
                wishedAmount === 'TRANSFER_ALL'
                ||
                (utx.balance + txrefs[i].value <= wishedAmount)
                ||
                (leftBalance - txrefs[i].value < wishedAmount) // left of not included outputs will be less than needed
            ) {
                utx.unspents.push({
                    txId: txrefs[i].tx_hash,
                    vout: txrefs[i].tx_output_n,
                    value: txrefs[i].value,
                    isConfirmed: txrefs[i].isConfirmed
                })
                utx.balance += txrefs[i].value * 1
                msg += ' ' + i + ') added ' + txrefs[i].value + ' = ' + utx.balance
            } else {
                msg += ' ' + i + ') skipped ' + txrefs[i].value
                leftBalance -= txrefs[i].value
            }
        }

        BlocksoftCryptoLog.log('BtcTxProcessor._sortParse ' + msg)
        return utx
    }

    /**
     * @param {[{txId, vout, value}]} unspents
     * @param {{tx_hash, tx_output_n, value}} txref
     * @return {boolean}
     * @private
     _isTxrefIncluded(unspents, txref) {
        for (let i = 0, ic = unspents.length; i < ic; i++) {
            if (unspents[i].txId === txref.tx_hash) {
                return true
            }
        }
        return false
    }
     */


    /**
     * @param {string} address
     * @param {int} amount
     * @param {Object} usedUtx
     * @param {boolean} confirmedOnly
     * @return {Promise<{unspents: [{txId, vout, value}], balance}>}
     * @private
     */
    async _parseUnspents(address, amount, usedUtx = {
        unspents: [],
        balance: 0
    }, confirmedOnly = false) {
        BlocksoftCryptoLog.log('BtcTxProcessor._parseUnspents started', `currencyCode= ${this._settings.currencyCode} address = ${address} amount = ${amount}`)
        let getUtxs
        let now = new Date().getTime()
        let cacheUsed = false

        if (CACHE_UNSPENTS[address] && now - CACHE_UNSPENTS[address].cachedTime < CACHE_UNSPENT_TIME) {
            getUtxs = CACHE_UNSPENTS[address].getUtxs
            cacheUsed = true
        } else {
            try {
                getUtxs = await this.unspentsProvider.get(address)
            } catch (e) {
                e.message += ' ' + address
                e.code = 'ERROR_PROVIDER'
                throw e
            }
        }

        /**
         * @param {*} getUtxs.txrefs
         * @param {*} getUtxs.balance
         * @type {Array}
         */
        if (!getUtxs || typeof getUtxs.txrefs === 'undefined') {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.log('BtcTxProcessor._parseUnspents No Utxs ' + address, JSON.stringify(getUtxs))
            let e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            e.code = 'ERROR_USER'
            throw e
        }
        let alreadyUsedForOtherTx = await BtcUsedOutputsDS.getUsed(this._settings.currencyCode, address)
        if (alreadyUsedForOtherTx) {
            BlocksoftCryptoLog.log('BtcTxProcessor._parseUnspents already Used', alreadyUsedForOtherTx)
            for (let i = 0, ic = getUtxs.txrefs.length; i < ic; i++) {
                let ref = getUtxs.txrefs[i]
                if (typeof (alreadyUsedForOtherTx[ref.txId + '_' + ref.vout]) !== 'undefined') {
                    delete getUtxs.txrefs[i]
                }
            }
            BlocksoftCryptoLog.log('BtcTxProcessor._parseUnspents after Cleanup', getUtxs.txrefs)
            if (!getUtxs.txrefs) {
                BlocksoftCryptoLog.err('BtcTxProcessor._parseUnspents No Utxs after cleanup ' + address)
                let e = new Error(`all outputs are already used`)
                e.code = 'ERROR_USER'
                throw e
            }
        }

        if (!cacheUsed) {
            CACHE_UNSPENTS[address] = { getUtxs, cachedTime: now }
        }

        return this._sortParse(getUtxs.txrefs, amount, false, usedUtx, confirmedOnly)

    }


    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.addressForChange
     * @param {string} data.feeForTx.feeForTx // for ETH is object with gasPrice / gasLimit, for BTC general feeForTx
     * @param {string} data.amount
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     */
    async sendTx(data) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('BTC transaction requires privateKey')
        }
        if (typeof data.addressFrom === 'undefined') {
            throw new Error('BTC transaction requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('BTC transaction requires addressTo')
        }
        if (typeof data.feeForTx.feeForTx === 'undefined') {
            throw new Error('BTC transaction requires feeForTx.feeForTx')
        }
        if (typeof data.amount === 'undefined') {
            throw new Error('BTC transaction requires amount')
        }
        if (typeof data.nSequence === 'undefined') {
            data.nSequence = 0xfffffffe
        }

        BlocksoftCryptoLog.log('BtcTxProcessor.sendTx started')
        let replacingUtx = false
        if (typeof data.replacingTransaction !== 'undefined' && this.dataProvider) {
            BlocksoftCryptoLog.log('BtcTxProcessor.sendTx will replace', data.replacingTransaction)
            replacingUtx = await this.dataProvider.get(data.replacingTransaction)
        }
        BlocksoftCryptoLog.log('BtcTxProcessor.sendTx feeIs', data.feeForTx.feeForTx)

        let addressForChange = false
        if (typeof data.addressForChange !== 'undefined') {
            addressForChange = data.addressForChange
        }

        let rawTxHex = await this._getRawTx(data.privateKey, data.addressFrom,
            data.addressTo, data.amount, data.feeForTx.feeForTx, addressForChange, DUST_FIRST_TRY, replacingUtx, data.nSequence)

        let response = false
        try {
            response = await this.sendProvider.send(rawTxHex, this._isDusty ? ('with BTC = ' + DUST_FIRST_TRY) : '')
        } catch (e) {
            if (this._isDusty && typeof e.couldResend != 'undefined' && e.couldResend) {
                response = false
            } else {
                if (typeof e.code === 'undefined' || e.code !== 'ERROR_USER') {
                    delete (data.privateKey)
                    // noinspection JSUndefinedPropertyAssignment
                    data.rawTxHex = rawTxHex
                    e.data = data
                }
                throw e
            }
        }

        if (response) {
            BtcUsedOutputsDS.saveUsed(response)
            CACHE_UNSPENTS[data.addressFrom] = false
            CACHE_UNSPENTS[data.addressTo] = false
            return { hash: response }
        }

        BlocksoftCryptoLog.log('BtcTxProcessor.sendTx more dust will be sent')

        rawTxHex = await this._getRawTx(data.privateKey, data.addressFrom,
            data.addressTo, data.amount, data.feeForTx.feeForTx, addressForChange, DUST_SECOND_TRY, replacingUtx, data.nSequence)
        try {
            response = await this.sendProvider.send(rawTxHex, 'with BTC second try = ' + DUST_SECOND_TRY)
            BtcUsedOutputsDS.saveUsed(response)
            CACHE_UNSPENTS[data.addressFrom] = false
            CACHE_UNSPENTS[data.addressTo] = false
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                e.code = 'ERROR_USER'
            } else if (typeof e.code === 'undefined' || e.code !== 'ERROR_USER') {
                delete (data.privateKey)
                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                e.data = data
            }
            throw e
        }

        return { hash: response }
    }
}


module.exports.BtcTxProcessor = BtcTxProcessor

module.exports.init = function(settings) {
    return new BtcTxProcessor(settings)
}
