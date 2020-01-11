/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import TrxTransactionsProvider from './TrxTransactionsProvider'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class TrxTransactionsTrc20Provider extends TrxTransactionsProvider {
    setLink(token) {
        this._tronscanLink = 'https://apilist.tronscan.org/api/contract/events?sort=-timestamp&count=true&limit=50&contract=' + token + '&address='
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.amount 1000000
     * @param {string} transaction.transferFromAddress 'TUbHxAdhPk9ykkc7SDP5e9zUBEN14K65wk'
     * @param {string} transaction.data ''
     * @param {string} transaction.decimals 6
     * @param {string} transaction.tokenName 'Tether USD'
     * @param {string} transaction.transferToAddress 'TUoyiQH9wSfYdJRhsXtgmgDvpWipPrQN8a'
     * @param {string} transaction.block 15847100
     * @param {string} transaction.id ''
     * @param {string} transaction.confirmed true
     * @param {string} transaction.transactionHash '4999b0965c1a5b17cbaa862b9357a32c9b8d096e170f4eecee929159b0b73ad3'
     * @param {string} transaction.timestamp: 1577796345000
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransaction(address, transaction) {

        let transaction_status = 'new'
        if (transaction.confirmed) {
            transaction_status = 'success'
        } else if (transaction.block > 0) {
            transaction_status = 'fail'
        }

        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (typeof transaction.amount == 'undefined') {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err('TrxTransactionsTrc20Provider._unifyTransaction buggy tx ' + JSON.stringify(tx))
        }
        return {
            transaction_hash: transaction.transactionHash,
            block_hash: '',
            block_number: transaction.block,
            block_time: formattedTime,
            block_confirmations: this._lastBlock - transaction.block,
            transaction_direction: (address.toLowerCase() === transaction.transferFromAddress.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.transferFromAddress,
            address_to: transaction.transferToAddress,
            address_amount: typeof transaction.amount !== 'undefined' ? transaction.amount : 0,
            transaction_status,
            transaction_fee: 0,
            input_value: transaction.data
        }
    }
}
