/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BtcTestFindAddressFunction from './basic/BtcTestFindAddressFunction'

const API_PATH = 'https://testnet-api.smartbit.com.au/v1/blockchain/address/'

const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}

export default class BtcTestScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 5

    async _get(address) {
        const now = new Date().getTime()
        if (typeof CACHE[address] !== 'undefined' && (now - CACHE[address].time < CACHE_VALID_TIME)) {
            return CACHE[address].data
        }
        const link = API_PATH + address
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data) {
            return false
        }
        if (typeof res.data.address === 'undefined') {
            throw new Error('BtcTestScannerProcessor._get nothing loaded for address ' + link)
        }

        CACHE[address] = {
            data: res.data.address,
            time: now
        }
        return res.data.address
    }

    /**
     * https://testnet-api.smartbit.com.au/v1/blockchain/address/mrEZPSepSrV2DveXpXnAyBMugUvUBhNiJS
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getBalance started', address)
        const res = await this._get(address)
        if (!res || typeof res.confirmed === 'undefined') {
            return false
        }
        return {balance: res.confirmed.balance_int, unconfirmed: res.unconfirmed.balance_int, provider: 'smartbit.com.au' }
    }

    /**
     * https://testnet-api.smartbit.com.au/v1/blockchain/address/mn5hqUL6kXUV4yocWxfJh9JGBv7mT3MgJe
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address, jsonData = {}) {
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions started ', address)
        const res = await this._get(address)
        if (!res || typeof res.transactions === 'undefined') {
            return []
        }
        const transactions = []
        let tx
        for (tx of res.transactions) {
            const transaction = await  this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions finished', address + ' total: ' + transactions.length)
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {string} addresses
     * @param {Object} transaction
     * @param {string} transaction.txid "51be02df7de46e278c31607a6fb1af89de1c9268140a782fa91490a2ef62bedd"
     * @param {string} transaction.hash "bbef21fa0dee19439cafc76697dec961e58f0f9f574b1496c1b9f61437a62cac"
     * @param {string} transaction.block 1669542
     * @param {string} transaction.confirmations 3
     * @param {string} transaction.version "2"
     * @param {string} transaction.locktime 1669541
     * @param {string} transaction.time 1583938596
     * @param {string} transaction.first_seen 1583937984
     * @param {string} transaction.propagation null
     * @param {string} transaction.double_spend false
     * @param {string} transaction.size 226
     * @param {string} transaction.vsize 145
     * @param {string} transaction.input_amount "0.01443588"
     * @param {string} transaction.input_amount_int 1443588
     * @param {string} transaction.output_amount "0.01443443"
     * @param {string} transaction.output_amount_int 1443443
     * @param {string} transaction.fee "0.00000145"
     * @param {string} transaction.fee_int 145
     * @param {string} transaction.fee_size "1.00000000"
     * @param {string} transaction.coinbase false
     * @param {string} transaction.input_count 1
     * @param {string} transaction.inputs [{…}]
     * @param {string} transaction.output_count 2
     * @param {string} transaction.outputs (2) [{…}, {…}]
     * @param {string} transaction.tx_index 55131161
     * @param {string} transaction.block_index 314
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let showAddresses = false
        try {
            showAddresses = await BtcTestFindAddressFunction(address, transaction)
        } catch (e) {
            e.message += ' transaction hash ' + JSON.stringify(transaction) + ' address ' + address
            throw e
        }

        let transactionStatus = 'new'
        if (transaction.confirmations >= this._blocksToConfirm) {
            transactionStatus = 'success'
        } else if (transaction.confirmations > 0) {
            transactionStatus = 'confirming'
        }

        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.time)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }

        return {
            transaction_hash: transaction.txid,
            block_hash: transaction.block,
            block_number: +transaction.block,
            block_time: formattedTime,
            block_confirmations: transaction.confirmations,
            transaction_direction: showAddresses.direction,
            address_from: showAddresses.from,
            address_to: showAddresses.to,
            vout: showAddresses.allMyAddresses,
            address_amount: showAddresses.value,
            transaction_status: transactionStatus,
            transaction_fee: transaction.fee_int
        }
    }
}
