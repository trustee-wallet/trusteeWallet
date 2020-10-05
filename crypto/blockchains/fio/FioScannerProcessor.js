import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { getFioBalance, getTransactions } from './FioUtils'

export default class FioScannerProcessor {

    /**
     * @private
     */
    _serverUrl = false

    _blocksToConfirm = 10

    _maxBlockNumber = 500000000

    constructor(settings) {
        this._settings = settings
    }

    async _getCache(address, additionalData, walletHash) {
        return false
    }

    /**
     * @param address
     * @param additionalData
     * @param walletHash
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _get(address, additionalData, walletHash) {
        return false
    }

    /**
     * @param {string} address
     * @param {*} additionalData
     * @param {string} walletHash
     * @return {Promise<{balance:*, unconfirmed:*, provider:string}>}
     */
    async getBalanceBlockchainCache(address, additionalData, walletHash) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' FioScannerProcessor.getBalance (cache) started ' + address + ' of ' + walletHash)
        return false
    }

    /**
     * @param {string} address
     * @param {*} additionalData
     * @param {string} walletHash
     * @return {Promise<{balance:*, unconfirmed:*, provider:string}>}
     */
    async getBalanceBlockchain(address, additionalData, walletHash) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' FioScannerProcessor.getBalance started ' + address + ' of ' + walletHash)
        const balance = await getFioBalance(address)
        return {
            balance,
            unconfirmed: 0,
        }
    }

    /**
     * @param {string} address
     * @param {*} additionalData
     *  @param {string} walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(address, additionalData, walletHash) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' FioScannerProcessor.getTransactionsBlockchain started ' + address + ' of ' + walletHash)
        // const transactions = await getTransactions()
        return []
    }

    /**
     *
     * @param {string} address
     * @param {string} lastBlock
     * @param {Object} transaction
     * @param {BigInteger} transaction.amount BigInteger {_d: Array(2), _s: -1}
     * @param {string} transaction.approx_float_amount -0.00002724
     * @param {string} transaction.coinbase false
     * @param {string} transaction.fee "27240000"
     * @param {string} transaction.hash "ac319a3240f15dab342102fe248d3b95636f8a0bbfa962a5645521fac8fb86d3"
     * @param {string} transaction.height 2152183
     * @param {string} transaction.id 10506991
     * @param {string} transaction.mempool: false
     * @param {string} transaction.mixin 10
     * @param {string} transaction.payment_id ""
     * @param {string} transaction.spent_outputs [{…}]
     * @param {string} transaction.timestamp Tue Jul 28 2020 18:10:26 GMT+0300 (Восточная Европа, летнее время) {}
     * @param {string} transaction.total_received "12354721582"
     * @param {BigInteger} transaction.total_sent BigInteger {_d: Array(2), _s: 1}
     * @param {string} transaction.unlock_time
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    _unifyTransaction(address, lastBlock, transaction) {
        return {
            transactionHash: '',
            blockHash: '',
            blockNumber: 0,
            blockTime: '',
            blockConfirmations: 0,
            transactionDirection: 'income',
            addressFrom: '',
            addressTo: '',
            addressAmount: 0,
            transactionStatus: "transactionStatus",
            transactionFee: 0
        }
    }
}
