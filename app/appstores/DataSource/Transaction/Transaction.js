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
     * @param {string} transaction.transactionsScanLog
     * @param {integer} transaction.blockConfirmations
     * @param {string} transaction.addressTo
     * @param {string} transaction.addressFrom
     * @param {string} transaction.addressAmount
     * @param {string} transaction.transactionFee
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     * @param {integer} updateId
     */
    saveTransaction = async (transaction, updateId = false, source = '') => {

        // console.log('Transaction saveTransaction called ' + transaction.transactionHash + ' ' + source, transaction)

        const dbInterface = new DBInterface()

        dbInterface.setTableName('transactions')

        if (!transaction.updatedAt) {
            transaction.updatedAt = new Date().toISOString()
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
        } else {
            copy.transactionsScanLog = 'UNDEFINED TX SCAN LOG ' + source
        }


        if (updateId) {
            if (copy.addressTo === '') {
                delete copy.addressTo
            }
            if (copy.addressFrom === '') {
                delete copy.addressFrom
            }
            await dbInterface.setUpdateData({ key: { id: updateId }, updateObj: copy }).update()
            // Log.daemon('Transaction saveTransaction finished updated')
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
            // Log.daemon('Transaction saveTransaction finished inserted')
        } else {
            // Log.daemon('Transaction saveTransaction finished skipped')
        }
    }

    /**
     *
     * @param transaction.accountId
     * @param transaction.transactionHash
     * @param transaction.transactionsOtherHashes
     * @param transaction.transactionUpdateHash
     * @param transaction.transactionJson
     * @param transaction.currencyCode
     * @param transaction.addressAmount
     * @param transaction.addressTo
     * @param transaction.transactionStatus
     * @param transaction.transactionFee
     * @param transaction.transactionFeeCurrencyCode
     * @param transaction.transactionsScanLog
     * @returns {Promise<void>}
     */
    updateTransaction = async (transaction) => {

        // console.log('Transaction updateTransaction called ' + transaction.transactionHash, transaction)

        const dbInterface = new DBInterface()

        let transactionJson = ''
        if (typeof transaction.transactionJson !== 'undefined') {
            if (typeof transaction.transactionJson !== 'string') {
                transactionJson = dbInterface.escapeString(JSON.stringify(transaction.transactionJson))
            }
        }

        let sql = `UPDATE transactions 
                        SET transaction_hash='${transaction.transactionHash}', 
                        transactions_other_hashes='${transaction.transactionsOtherHashes}',
                        updated_at='${new Date().toISOString()}'
                     `
        if (transactionJson.length > 1) {
            sql += `, transaction_json='${transactionJson}'`
        }
        if (typeof transaction.addressAmount !== 'undefined') {
            sql += ', address_amount=' + transaction.addressAmount
        }
        if (typeof transaction.addressTo !== 'undefined') {
            sql += `, address_to='${transaction.addressTo}'`
        }
        if (typeof transaction.transactionStatus !== 'undefined') {
            sql += `, transaction_status='${transaction.transactionStatus}'`
        }
        if (typeof transaction.transactionFee !== 'undefined') {
            sql += `, transaction_fee='${transaction.transactionFee}'`
        }
        if (typeof transaction.transactionFeeCurrencyCode !== 'undefined') {
            sql += `, transaction_fee_currency_code='${transaction.transactionFeeCurrencyCode}'`
        }
        if (typeof transaction.transactionsScanLog !== 'undefined') {
            sql += `, transactions_scan_log='${transaction.transactionsScanLog} ' || transactions_scan_log`
        }
        sql += ` WHERE transaction_hash='${transaction.transactionUpdateHash}' `
        if (typeof transaction.currencyCode !== 'undefined' && transaction.currencyCode) {
            sql += ` AND currency_code='${transaction.currencyCode}' `
        }
        console.log('tx', JSON.parse(JSON.stringify(transaction)))
        console.log('sql ' + sql)

        await dbInterface.setQueryString(sql).query()

    }

    removeTransactions = async (ids) => {
        const dbInterface = new DBInterface()
        const sql = `DELETE FROM transactions WHERE id IN (` + ids.join(',') + `)`
        await dbInterface.setQueryString(sql).query()
    }

    getTransactionsCount = async (params, source = '?') => {
        const dbInterface = new DBInterface()

        // Log.daemon('DS/Transaction getTransactions called')

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
        if (params.transactionHash) {
            where.push(`transaction_hash='${params.transactionHash}'`)
        }
        if (params.bseOrderHash) {
            where.push(`(bse_order_id='${params.bseOrderHash}' OR bse_order_id_in='${params.bseOrderHash}' OR bse_order_id_out='${params.bseOrderHash}')`)
        }
        if (typeof params.minAmount !== 'undefined') {
            where.push(`(address_amount>${params.minAmount} AND address_amount IS NOT NULL)`)
            where.push(`address_to NOT LIKE '% Simple Send%'`)
        }

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params.noOrder) {
            order = ''
        } else {
            where.push(`hidden_at IS NULL`)
        }

        // where.push(`'${source}' = '${source}'`)

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT COUNT(id) AS cn
            FROM transactions 
            ${where}
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
            // Log.daemon('DS/Transaction getTransactions finished empty ' + where + ' ' + order)
            return false
        }
        return res[0]['cn']
    }

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.accountId
     * @param {string} params.noOrder
     * @returns {Promise<[{createdAt, updatedAt, blockTime, blockHash, blockNumber, blockConfirmations, transactionHash, addressFrom, addressAmount, addressTo, transactionFee, transactionStatus, transactionDirection, accountId, walletHash, currencyCode, transactionOfTrusteeWallet, transactionJson}]>}
     */
    getTransactions = async (params, source = '?') => {
        const dbInterface = new DBInterface()

        // Log.daemon('DS/Transaction getTransactions called')

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
        if (params.transactionHash) {
            where.push(`transaction_hash='${params.transactionHash}'`)
        }
        if (params.bseOrderHash) {
            where.push(`(bse_order_id='${params.bseOrderHash}' OR bse_order_id_in='${params.bseOrderHash}' OR bse_order_id_out='${params.bseOrderHash}')`)
        }
        if (typeof params.minAmount !== 'undefined') {
            where.push(`(address_amount>${params.minAmount} AND address_amount IS NOT NULL)`)
            where.push(`address_to NOT LIKE '% Simple Send%'`)
        }

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params.noOrder) {
            order = ''
        } else {
            where.push(`hidden_at IS NULL`)
        }

        // where.push(`'${source}' = '${source}'`)

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let limit = ''
        if (typeof params.limitPerPage !== 'undefined') {
            limit = ' LIMIT ' + params.limitPerPage
        }
        if (typeof params.limitFrom !== 'undefined') {
            limit += ' OFFSET ' + params.limitFrom
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
            address_from_basic AS addressFromBasic,
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
            transactions_other_hashes AS transactionsOtherHashes,
            bse_order_id AS bseOrderID,
            bse_order_id_out AS bseOrderOutID,
            bse_order_id_in AS bseOrderInID,
            bse_order_data AS bseOrderData
            FROM transactions 
            ${where}
            ${order}
            ${limit}
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
            // Log.daemon('DS/Transaction getTransactions finished empty ' + where + ' ' + order)
            return false
        }

        const shownTx = {}
        const txArray = []
        let tx
        const toRemove = []
        for(tx of res) {
            if (typeof shownTx[tx.transactionHash] !== 'undefined') {
                Log.daemon('Transaction getTransactions will remove ' + tx.id)
                toRemove.push( tx.id)
                continue
            }
            shownTx[tx.transactionHash] = 1
            tx.addressAmount = BlocksoftUtils.fromENumber(tx.addressAmount)

            if (typeof params.noOld !== 'undefined' || params.noOld) {
                if ((tx.blockConfirmations > 30 && tx.transactionStatus === 'success') || tx.blockConfirmations > 300) {
                    txArray.push({
                        id : tx.id,
                        transactionHash : tx.transactionHash,
                        transactionsOtherHashes : tx.transactionsOtherHashes,
                        updateSkip : true
                    })
                    continue
                }
            }

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

            if (typeof tx.bseOrderData !== 'undefined' && tx.bseOrderData !== null && tx.bseOrderData !== 'undefined') {
                try {
                    tx.bseOrderData = JSON.parse(tx.bseOrderData)
                } catch (e) {
                    e.message += ' while parsing tx 1 ' + tx.bseOrderData
                    throw e
                }
            }

            txArray.push(tx)
        }

        if (toRemove.length > 0) {
            await this.removeTransactions(toRemove)
        }

        // Log.daemon('DS/Transaction getTransactions finished ' + where + ' ' + order)
        return txArray
    }

}

export default new Transaction()
