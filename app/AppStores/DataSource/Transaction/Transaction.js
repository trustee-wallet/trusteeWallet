/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'

class Transaction {

    /**
     * @param {object} transaction
     * @param {string} transaction.currencyCode
     * @param {string} transaction.walletHash
     * @param {string} transaction.accountId
     * @param {string} transaction.transactionHash
     * @param {string} transaction.transactionStatus
     * @param {string} transaction.transactionDirection
     * @param {integer} transaction.blockConfirmations
     * @param {string} transaction.addressTo
     * @param {string} transaction.addressFrom
     * @param {string} transaction.addressAmount
     * @param {string} transaction.transactionFee
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     * @param {integer} updateId
     */
    saveTransaction = async (transaction, updateId = false) => {

        Log.daemon('Transaction saveTransaction called ' + transaction.transactionHash)

        const dbInterface = new DBInterface()

        dbInterface.setTableName('transactions')

        if (!transaction.updatedAt) {
            transaction.updatedAt = new Date().toISOString()
        }
        if (!transaction.transactionDirection) {
            transaction.transactionDirection = 'outcome'
        }

        const copy = JSON.parse(JSON.stringify(transaction))
        if (typeof copy.transactionJson !== 'undefined') {
            if (typeof copy.transactionJson !== 'string') {
                copy.transactionJson = dbInterface.escapeString(JSON.stringify(copy.transactionJson))
            }
        }

        if (typeof copy.transactionsScanLog !== 'undefined') {
            if (copy.transactionsScanLog.length > 1000) {
                copy.transactionsScanLog = copy.transactionsScanLog.substr(0, 1000)
            }
            copy.transactionsScanLog = dbInterface.escapeString(copy.transactionsScanLog)
        }


        if (updateId) {
            if (copy.addressTo === '') {
                delete copy.addressTo
            }
            if (copy.addressFrom === '') {
                delete copy.addressFrom
            }
            await dbInterface.setUpdateData({ key: { id: updateId }, updateObj: copy }).update()
            Log.daemon('Transaction saveTransaction finished updated')
            return true
        }

        // sometimes db could be doubled so....
        const sql = `SELECT id FROM transactions WHERE currency_code='${transaction.currencyCode}'
                        AND wallet_hash='${transaction.walletHash}' 
                        AND transaction_hash='${transaction.transactionHash}' LIMIT 1`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || res.array.length === 0) {
            if (typeof copy.createdAt === 'undefined' || !copy.createdAt) {
                copy.createdAt = new Date().toISOString()
            }
            await dbInterface.setInsertData({ insertObjs: [copy] }).insert()
            Log.daemon('Transaction saveTransaction finished inserted')
        } else {
            Log.daemon('Transaction saveTransaction finished skipped')
        }
    }

    /**
     *
     * @param transaction.accountId
     * @param transaction.transactionHash
     * @param transaction.transactionsOtherHashes
     * @param transaction.transactionUpdateHash
     * @param transaction.transactionJson
     * @returns {Promise<void>}
     */
    updateTransaction = async (transaction) => {
        Log.log('Transaction updateTransaction called ' + transaction.transactionHash, transaction)

        const dbInterface = new DBInterface()

        let transactionJson = ''
        if (typeof transaction.transactionJson !== 'undefined') {
            if (typeof transaction.transactionJson !== 'string') {
                transactionJson = dbInterface.escapeString(JSON.stringify(transaction.transactionJson))
            }
        }
        if (transactionJson.length > 1) {
            transactionJson = `, transaction_json='${transactionJson}'`
        }

        const sql = `UPDATE transactions 
                        SET transaction_hash='${transaction.transactionHash}', 
                        transactions_other_hashes='${transaction.transactionsOtherHashes}'
                        ${transactionJson}
                        WHERE transaction_hash='${transaction.transactionUpdateHash}' 
                     `
        await dbInterface.setQueryString(sql).query()

    }

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.accountId
     * @param {string} params.noOrder
     * @returns {Promise<[{createdAt, updatedAt, blockTime, blockHash, blockNumber, blockConfirmations, transactionHash, addressFrom, addressAmount, addressTo, transactionFee, transactionStatus, transactionDirection, accountId, walletHash, currencyCode, transactionOfTrusteeWallet, transactionJson}]>}
     */
    getTransactions = async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Transaction getTransactions called')

        let where = []
        if (params.walletHash) {
            where.push(`wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`currency_code='${params.currencyCode}'`)
        }
        if (params.accountId) {
            where.push(`account_id='${params.accountId}'`)
        }

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params.noOrder) {
            order = ''
        } else {
            where.push(`hidden_at IS NULL`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }


        const sql = ` 
            SELECT id, 
            created_at AS createdAt, 
            updated_at AS updatedAt, 
            block_time AS blockTime, 
            block_hash AS blockHash, 
            block_number AS blockNumber,  
            block_confirmations AS blockConfirmations,
            transaction_hash AS transactionHash, 
            address_from AS addressFrom, 
            address_amount AS addressAmount, 
            address_to AS addressTo, 
            transaction_fee AS transactionFee,
            transaction_fee_currency_code AS transactionFeeCurrencyCode,
            transaction_status AS transactionStatus, 
            transaction_direction AS transactionDirection,
            account_id AS accountId, 
            wallet_hash AS walletHash, 
            currency_code AS currencyCode, 
            transaction_of_trustee_wallet AS transactionOfTrusteeWallet, 
            transaction_json AS transactionJson,
            transactions_scan_log AS transactionsScanLog,
            transactions_other_hashes AS transactionsOtherHashes
            FROM transactions 
            ${where}
            ${order}
            `
        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
            if (typeof res.array !== 'undefined') {
                res = res.array
            }
        } catch (e) {
            Log.errDaemon('DS/Transaction getTransactions error ' + sql, e)
        }

        if (!res || res.length === 0) {
            Log.daemon('DS/Transaction getTransactions finished empty ' + where + ' ' + order)
            return false
        }

        const shownTx = {}
        const txArray = []
        let tx
        for(tx of res) {
            if (typeof shownTx[tx.transactionHash] !== 'undefined') {
                dbInterface.query('DELETE FROM transaction WHERE id=' + tx.id)
                continue
            }
            shownTx[tx.transactionHash] = 1
            tx.addressAmount = BlocksoftUtils.fromENumber(tx.addressAmount)
            if (typeof tx.transactionJson !== 'undefined' && tx.transactionJson !== null && tx.transactionJson !== 'undefined') {

                try {
                    tx.transactionJson = JSON.parse(tx.transactionJson)
                } catch (e) {
                    e.message += ' while parsing tx 1 ' + tx.transactionJson
                    throw e
                }

                if (typeof tx.transactionJson !== 'object') {
                    try {
                        tx.transactionJson = JSON.parse(tx.transactionJson)
                    } catch (e) {
                        e.message += ' while parsing tx 2 ' + tx.transactionJson
                        throw e
                    }
                }
            }
            txArray.push(tx)
        }

        Log.daemon('DS/Transaction getTransactions finished ' + where + ' ' + order)
        return txArray
    }

}

export default new Transaction()
