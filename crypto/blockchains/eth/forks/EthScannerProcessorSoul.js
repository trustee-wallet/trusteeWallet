/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import EthScannerProcessorErc20 from '../EthScannerProcessorErc20'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class EthScannerProcessorSoul extends EthScannerProcessorErc20 {

    /**
     * some fix for soul double tx
     * @param {string} address
     * @param {*} result
     * @param {boolean} isInternal
     * @param {boolean} isTrezor
     * @returns {Promise<[]>}
     * @private
     */
    async _unifyTransactions(address, result, isInternal, isTrezor = true) {
        const transactions = []
        const alreadyTransactions = {}
        let count = 0
        let tx
        for (tx of result) {

            let transaction
            try {
                if (isTrezor) {
                    transaction = await this._unifyTransactionTrezor(address, tx, isInternal)
                } else {
                    transaction = await this._unifyTransaction(address, tx, isInternal)
                }
            } catch (e) {
                BlocksoftCryptoLog.error('EthScannerProcessorSoul._unifyTransaction error ' + e.message + ' on ' + (isTrezor ? 'Trezor' : 'usual') + ' tx ' + JSON.stringify(tx))
            }
            if (!transaction) {
                continue
            }
            transaction.address_amount = BlocksoftUtils.fromENumber(transaction.address_amount)
            transaction.address_amount = BlocksoftUtils.toBigNumber(transaction.address_amount)
            if (typeof (alreadyTransactions[transaction.transaction_hash]) !== 'undefined') {
                const already = alreadyTransactions[transaction.transaction_hash]
                transactions[already].address_amount = transactions[already].address_amount.add(transaction.address_amount)
            } else {
                alreadyTransactions[transaction.transaction_hash] = count
                count++
                transactions.push(transaction)
            }
        }
        for (let i = 0, ic = transactions.length; i < ic; i++) {
            transactions[i].address_amount = transactions[i].address_amount.toString()
        }
        return transactions
    }
}
