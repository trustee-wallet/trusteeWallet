/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftBN from '../../../common/BlocksoftBN'
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
            transaction.addressAmount = new BlocksoftBN(BlocksoftUtils.fromENumber(transaction.addressAmount))
            if (typeof (alreadyTransactions[transaction.transactionHash]) !== 'undefined') {
                const already = alreadyTransactions[transaction.transactionHash]
                transactions[already].addressAmount.add(transaction.addressAmount)
            } else {
                alreadyTransactions[transaction.transactionHash] = count
                count++
                transactions.push(transaction)
            }
        }
        for (let i = 0, ic = transactions.length; i < ic; i++) {
            transactions[i].addressAmount = transactions[i].addressAmount.get()
        }
        return transactions
    }
}
