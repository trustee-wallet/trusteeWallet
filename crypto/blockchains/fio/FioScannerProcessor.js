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
     * @param {string} scanData.account.address
     * @param {string} scanData.account.walletHash
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address.trim()
        const walletHash = scanData.account.walletHash
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' FioScannerProcessor.getTransactionsBlockchain started ' + address + ' of ' + walletHash)
        const response = await getTransactions(address)
        const actions = response['actions'] || []
        const lastBlock = response['last_irreversible_block']

        const transactions = []
        let tx
        for (tx of actions) {
            const transaction = await this._unifyTransaction(address, lastBlock, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
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
    async _unifyTransaction(address, lastBlock, transaction) {
        const txData = transaction.action_trace?.act?.data
        if (!txData?.payee_public_key || transaction.action_trace.receiver !== 'fio.token') {
            return false
        }

        const transactionStatus = lastBlock - transaction['block_num'] > 5 ? 'success' : 'new'
        const direction = (address === txData?.payee_public_key) ? 'income' : 'outcome'

        return {
            transactionHash: transaction['action_trace']['trx_id'],
            blockHash: '',
            blockNumber: transaction['block_num'],
            blockTime: transaction['block_time'],
            blockConfirmations: lastBlock - transaction['block_num'],
            transactionDirection: direction,
            addressFrom: direction === 'income' ? '-' : txData?.payee_public_key,
            addressTo: direction === 'income' ? txData?.payee_public_key : address,
            addressAmount: txData?.amount,
            transactionStatus: transactionStatus,
            transactionFee: txData?.max_fee || 0
        }
    }
}
