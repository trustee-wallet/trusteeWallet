/**
 *
 * @typedef {Object} UnifiedTransaction
 * @property {*} transaction_hash
 * @property {*} block_hash
 * @property {*} block_number
 * @property {*} block_time
 * @property {*} block_confirmations
 * @property {*} transaction_direction
 * @property {*} address_from
 * @property {*} address_to
 * @property {*} address_amount
 * @property {*} transaction_status
 * @property {*} transaction_fee
 * @property {*} lock_time
 * @property {*} vin
 * @property {*} vout
 * @property {*} contract_address
 * @property {*} input_value
 * @property {*} transaction_json
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

let bitcoin = require('bitcoinjs-lib')

class BtcScannerProcessor {
    constructor(settings) {
        this._currencyCode = settings.currencyCode
        this._network = settings.network
        BlocksoftCryptoLog.log('BtcScannerProcessor init started', settings.currencyCode)
        this.balancesProvider = require('./providers/BtcBalancesProvider').init(settings)
        this.transactionsProvider = require('./providers/BtcTransactionsProvider').init(settings)
        this.transactionProvider = require('./providers/BtcTransactionProvider').init(settings)
        this.addressProcessor = require('./BtcAddressProcessor').init(settings)

        BlocksoftCryptoLog.log('BtcScannerProcessor inited')
    }


    /**
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        BlocksoftCryptoLog.log('BtcScannerProcessor.getBalance started ' + this._currencyCode + ' ' + this._network, address)
        return this.balancesProvider.get(address)
    }

    /**
     * @param {string} address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address) {
        BlocksoftCryptoLog.log('BtcScannerProcessor.getTransactions started ' + this._currencyCode + ' ' + this._network, address)
        let tmp = await this.transactionsProvider.get(address)
        let transactions = []
        for (let tx of tmp) {
            let transaction = await this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('BtcScannerProcessor.getTransactions finished', address + ' total: ' + transactions.length)
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.txid '5b7bd229fae164cfb392271287b7587ace798e5ec8d157b199a7e55da5b33e69',
     * @param {string} transaction.version 2,
     * @param {string} transaction.locktime 0,
     * @param {Array} transaction.vin
     * @param {string} transaction.vin[].transactionid  'bb14bfe4a67a81d0384bed52058194dcf5923264b7608a8dfa58c54deae15319'
     * @param {string} transaction.vin[].vout 0
     * @param {string} transaction.vin[].sequence 4294967295
     * @param {string} transaction.vin[].n 0
     * @param {string} transaction.vin[].addr '1x3dwC4oTY2vuR93WoqJUbkJArpb3dpYL'
     * @param {string} transaction.vin[].valueSat 442292
     * @param {string} transaction.vin[].value 0.00442292
     * @param {string} transaction.vin[].doubleSpentTxID null
     * @param {Array} transaction.vout
     * @param {string} transaction.vout[].value: '0.00006078'
     * @param {string} transaction.vout[].n: 0
     * @param {string} transaction.vout[].scriptPubKey: [Object]
     * @param {string} transaction.vout[].spentTxId: null
     * @param {string} transaction.vout[].spentIndex: null
     * @param {string} transaction.vout[].spentHeight: null
     * @param {string} transaction.blockhash: '0000000000000000002168679885b77131681d4d36b02895b16002824067eb5b'
     * @param {string} transaction.blockheight: 578450
     * @param {string} transaction.confirmations: 1816
     * @param {string} transaction.time: 1559179342
     * @param {string} transaction.blocktime: 1559179342
     * @param {string} transaction.size: 222
     * @param {string} transaction.fees: 0.00052392
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let showAddresses = false
        try {
            showAddresses = await this._getAddresses(transaction.txid, address, transaction.vin, transaction.vout)
        } catch (e) {
            e.message += ' transaction hash ' + JSON.stringify(transaction) + ' address ' + address
            throw e
        }
        if (typeof (transaction.time) === "undefined") {
            new Error(' no transaction.time error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.time
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.time)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        let confirmations = transaction.confirmations * 1;
        return {
            transaction_hash: transaction.txid,
            block_hash: transaction.blockhash,
            block_number: +transaction.blockheight,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: showAddresses.direction,
            address_from: showAddresses.from,
            address_to: showAddresses.to,
            address_amount: BlocksoftUtils.toSatoshi(showAddresses.value), // to satoshi
            transaction_status: confirmations > 5 ? 'success' : 'new',
            transaction_fee: BlocksoftUtils.toSatoshi(transaction.fees),
            lock_time: +transaction.locktime,
            vin: JSON.stringify(transaction.vin),
            vout: JSON.stringify(transaction.vout)
        }
    }


    async _getAddressRestoreSegwitFrom(basicHash, prevHash) {
        BlocksoftCryptoLog.log('BtcScannerProcessor. _getAddressRestoreSegwitFrom started with prevHash' + prevHash + ' => basicHash' + basicHash)
        let raw = await this.transactionProvider.getRaw(basicHash)
        let anyFrom = this.addressProcessor.getAddressByRawWithWitness(raw)
        if (anyFrom) {
            BlocksoftCryptoLog.log('BtcScannerProcessor. _getAddressRestoreSegwitFrom found anyFrom by getAddressByRawWithWitness ' + anyFrom)
            return anyFrom
        }
        let tx = await this.transactionProvider.get(prevHash)
        if (!tx) return false
        for (let j = 0, jc = tx.vout.length; j < jc; j++) {
            if (tx.vout[j].spentTxId === basicHash) {
                //console.log(JSON.stringify(tx, null, 4))
                //anyFrom = await this.addressProcessor.getAddressByPublic(tx.vout[j].scriptPubKey)
                anyFrom = tx.vout[j].address
                BlocksoftCryptoLog.log('BtcScannerProcessor. _getAddressRestoreSegwitFrom found anyFrom by prevHash ' + anyFrom)
                return anyFrom
            }
        }
    }

    async _getAddresses(basicHash, address, vin, vout) {

        let output = {
            direction: 'outcome',
            from: '',
            to: '',
            value: 0
        }

        let anyFrom, anyTo, anyVin
        let anyToValue = 0

        for (let i = 0, ic = vin.length; i < ic; i++) {
            if (vin[i].txid) {
                anyVin = vin[i].txid
            }
            if (vin[i].addr === address) {
                output.from = vin[i].addr
                break
            } else if (!anyFrom) {
                anyFrom = vin[i].addr
            }
        }

        if (!output.from) {
            output.direction = 'income'
            if (!anyFrom) {
                anyFrom = await this._getAddressRestoreSegwitFrom(basicHash, anyVin)
            }
            output.from = anyFrom
        }


        for (let j = 0, jc = vout.length; j < jc; j++) {
            if (typeof vout[j].scriptPubKey.addresses === 'undefined') continue
            if (vout[j].scriptPubKey.addresses === null) continue
            if (vout[j].scriptPubKey.addresses[0] === address) {
                if (output.direction === 'income') {
                    // only
                    output.to = address
                    output.value = vout[j].value
                    break
                }
            } else if (!anyTo || anyToValue < vout[j].value) {
                // if its not transaction to our address
                anyTo = vout[j].scriptPubKey.addresses[0]
                anyToValue = vout[j].value
            }
        }
        if (!output.to) {
            output.to = anyTo
            output.value = anyToValue
        }

        return output
    }
}

module.exports.BtcScannerProcessor = BtcScannerProcessor

module.exports.init = function (settings) {
    return new BtcScannerProcessor(settings)
}
