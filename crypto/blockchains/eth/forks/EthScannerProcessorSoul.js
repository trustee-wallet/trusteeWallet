/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import EthScannerProcessorErc20 from '../EthScannerProcessorErc20'

export default class EthScannerProcessorSoul extends EthScannerProcessorErc20 {

    /**
     * some fix for soul double tx
     * @param address
     * @param result
     * @returns {Promise<[]>}
     * @private
     */
    async _unifyTransactions(address, result) {
        let transactions = []
        let already_transactions = {}
        let count = 0
        for (let tx of result) {
            let transaction = await this._unifyTransaction(address, tx)
            transaction.address_amount = BlocksoftUtils.toBigNumber(transaction.address_amount)
            if (typeof(already_transactions[transaction.transaction_hash]) !== 'undefined') {
                let already = already_transactions[transaction.transaction_hash]
                transactions[already].address_amount = transactions[already].address_amount.add(transaction.address_amount)
            } else {
                already_transactions[transaction.transaction_hash] = count
                count++
                transactions.push(transaction)
            }
        }
        for (let i = 0, ic = transactions.length; i<ic; i++) {
            transactions[i].address_amount = transactions[i].address_amount.toString()
        }
        return transactions
    }
}
