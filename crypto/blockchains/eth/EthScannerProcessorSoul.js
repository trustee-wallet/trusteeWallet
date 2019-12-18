import BlocksoftUtils from '../../common/BlocksoftUtils'

class EthScannerProcessorSoul extends require('./EthScannerProcessorErc20').EthScannerProcessorErc20 {

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
        let tcount = 0
        for (let tx of result) {
            let transaction = await this._unifyTransaction(address, tx)
            transaction.address_amount = BlocksoftUtils.toBigNumber(transaction.address_amount)
            if (typeof(already_transactions[transaction.transaction_hash]) !== 'undefined') {
                let already = already_transactions[transaction.transaction_hash]
                transactions[already].address_amount = transactions[already].address_amount.add(transaction.address_amount)
            } else {
                already_transactions[transaction.transaction_hash] = tcount
                tcount++
                transactions.push(transaction)
            }
        }
        for (let i = 0, ic = transactions.length; i<ic; i++) {
            transactions[i].address_amount = transactions[i].address_amount.toString()
        }
        return transactions
    }
}

module.exports.init = function(settings) {
    return new EthScannerProcessorSoul(settings)
}
