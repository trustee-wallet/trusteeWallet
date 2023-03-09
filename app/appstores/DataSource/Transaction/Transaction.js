/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '@app/services/Log/Log'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import config from '@app/config/config'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

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
     * @param {string} transaction.bseOrderId
     * @param {object} transaction.bseOrderData
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     * @param {integer} updateId
     * @param {string} transaction.transactionFilterType: swap | walletConnect | fee | usaul
     */
    saveTransaction = async (transaction, updateId = false, source = '') => {
        if (!transaction.updatedAt) {
            transaction.updatedAt = new Date().toISOString()
        }
        const copy = JSON.parse(JSON.stringify(transaction))
        if (typeof copy.transactionJson !== 'undefined') {
            if (typeof copy.transactionJson !== 'string') {
                copy.transactionJson = Database.escapeString(JSON.stringify(copy.transactionJson))
            }
        }

        if (typeof copy.transactionsScanLog !== 'undefined') {
            if (copy.transactionsScanLog.length > 1000) {
                copy.transactionsScanLog = copy.transactionsScanLog.substr(0, 1000)
            }
            copy.transactionsScanLog = Database.escapeString(copy.transactionsScanLog)
        } else {
            copy.transactionsScanLog = 'UNDEFINED TX SCAN LOG ' + source
        }

        if (typeof copy.bseOrderData !== 'undefined' && copy.bseOrderData) {
            copy.bseOrderData = Database.escapeString(JSON.stringify(copy.bseOrderData))
        }


        if (updateId) {
            if (copy.addressTo === '') {
                delete copy.addressTo
            }
            if (copy.addressFrom === '') {
                delete copy.addressFrom
            }
            await Database.setTableName('transactions').setUpdateData({ key: { id: updateId }, updateObj: copy }).update()
            // Log.daemon('Transaction saveTransaction finished updated')
            return true
        }

        // sometimes db could be doubled so....
        const sql = `SELECT id FROM transactions WHERE currency_code='${transaction.currencyCode}'
                        AND wallet_hash='${transaction.walletHash}'
                        AND transaction_hash='${transaction.transactionHash}' LIMIT 1`
        const res = await Database.query(sql)
        if (!res || res.array.length === 0) {
            if (typeof copy.createdAt === 'undefined' || !copy.createdAt) {
                copy.createdAt = new Date().toISOString()
            }
            await Database.setTableName('transactions').setInsertData({ insertObjs: [copy] }).insert()
            // Log.daemon('Transaction saveTransaction finished inserted')
        } else {
            // Log.daemon('Transaction saveTransaction finished skipped')
        }
    }

    cleanAll = async (walletHash) => {
        const sql = `DELETE FROM transactions WHERE wallet_hash='${walletHash}'`
        return Database.query(sql)
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
     * @param transaction.addressToBasic
     * @param transaction.transactionDirection
     * @param transaction.transactionStatus
     * @param transaction.transactionFee
     * @param transaction.transactionFeeCurrencyCode
     * @param transaction.transactionsScanLog
     * @returns {Promise<void>}
     */
    updateTransaction = async (transaction) => {
        let transactionJson = ''
        if (typeof transaction.transactionJson !== 'undefined') {
            if (typeof transaction.transactionJson !== 'string') {
                transactionJson = Database.escapeString(JSON.stringify(transaction.transactionJson))
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
        if (typeof transaction.addressToBasic !== 'undefined') {
            sql += `, address_to_basic='${transaction.addressToBasic}'`
        }
        if (typeof transaction.transactionDirection !== 'undefined') {
            sql += `, transaction_direction='${transaction.transactionDirection}'`
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

        await Database.query(sql)

    }

    removeTransactions = async (ids) => {
        const sql = `DELETE FROM transactions WHERE id IN (` + ids.join(',') + `)`
        await Database.query(sql)
    }

    getTransactionsCount = async (params, source = '?') => {
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
            where.push(`transaction_hash !=''`)
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
            res = await Database.query(sql)
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
     * @param {string} params.startTime
     * @param {string} params.endTime
     * @param {string} params.startAmount
     * @param {string} params.endAmount
     * @param {string} params.searchQuery
     * @param {string} params.filterDirectionHideIncome
     * @param {string} params.filterDirectionHideOutcome
     * @param {string} params.filterStatusHideCancel
     * @param {string} params.filterTypeHideFee
     * @param {string} params.filterTypeHideSwap
     * @param {string} params.filterTypeHideStake
     * @param {string} params.filterTypeHideWalletConnect
     * @param {string} params.filterTypeShowSpam
     * @returns {Promise<[{createdAt, updatedAt, blockTime, blockHash, blockNumber, blockConfirmations, transactionHash, addressFrom, addressAmount, addressTo, transactionFee, transactionStatus, transactionDirection, accountId, walletHash, currencyCode, transactionOfTrusteeWallet, transactionJson}]>}
     */
    getTransactions = async (params, source = '?') => {
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
        if (typeof params.minAmount !== 'undefined' && params.minAmount * 1 > 0) {
            const tmp = params.minAmount * 1
            where.push(`((address_amount >${tmp} AND address_amount IS NOT NULL) OR (bse_order_id != '' AND bse_order_id IS NOT NULL AND bse_order_id != 'null'))`)
            where.push(`address_to NOT LIKE '% Simple Send%'`)
        }

        // date filter
        if (typeof params.startTime !== 'undefined' && params.startTime) {
            where.push(`created_at>='${params.startTime}'`)
        }
        if (typeof params.endTime !== 'undefined' && params.endTime) {
            where.push(`created_at<='${params.endTime}'`)
        }

        // amount filter
        if (typeof params.startAmount !== 'undefined' && params.startAmount) {
            where.push(`address_amount >= ${params.startAmount}`)
        }
        if (typeof params.endAmount !== 'undefined' && params.endAmount) {
            where.push(`address_amount <= ${params.endAmount}`)
        }

        // search by address or hash
        if (typeof params.searchQuery !== 'undefined' && params.searchQuery) {
            const tmp = params.searchQuery.toLowerCase()
            where.push(`(LOWER(address_from)='${tmp}' OR LOWER(address_to)='${tmp}' OR LOWER(transaction_hash)='${tmp}')`)
        }

        // way filter
        let countOutAndIncome = 0
        if (typeof params.filterDirectionHideIncome !== 'undefined' && params.filterDirectionHideIncome) {
            countOutAndIncome++
        }
        if (typeof params.filterDirectionHideOutcome !== 'undefined' && params.filterDirectionHideOutcome) {
            countOutAndIncome++
        }

        const filterTypeHideUsual = countOutAndIncome >= 2
        if (!filterTypeHideUsual) {
            if (typeof params.filterDirectionHideIncome !== 'undefined' && params.filterDirectionHideIncome) {
                where.push(`transaction_direction NOT IN ('income')`)
            }
            if (typeof params.filterDirectionHideOutcome !== 'undefined' && params.filterDirectionHideOutcome) {
                where.push(`transaction_direction NOT IN ('outcome')`)
            }
        }
        // if not selected both income and outcome - we assume someone dont want usual transactions to be seen

        let tmpWhere = []
        // status filter
        if (typeof params.filterStatusHideCancel !== 'undefined' && params.filterStatusHideCancel) {
            where.push(`transaction_status NOT IN ('fail')`)
        } else {
            tmpWhere.push(`
                (
                    transaction_direction IN ('outcome', 'self') 
                    ) AND ( 
                        transaction_status IN ('fail')
                        )
                `)
        }

        // fee filter
        if (typeof params.filterTypeHideFee !== 'undefined' && params.filterTypeHideFee) {
            where.push(`address_to NOT LIKE '% Simple Send%'`)
            where.push(`address_amount != '0'`)
            where.push(`(transaction_filter_type IS NULL OR transaction_filter_type NOT IN ('${TransactionFilterTypeDict.FEE}'))`)
        } else {
            tmpWhere.push(`
                (
                    transaction_direction IN ('outcome', 'self')
                ) AND ((
                    transaction_filter_type IS NOT NULL AND transaction_filter_type NOT IN ('usual')
                ) OR (
                    transaction_filter_type IS NULL AND (
                        address_amount == '0'
                        OR
                        address_to LIKE '% Simple Send%'
                    )
                ))
            `)
        }

        if (typeof params.filterTypeShowSpam !== 'undefined' && params.filterTypeShowSpam) {
            // do nothing
        } else {
            const spamLimit = BlocksoftExternalSettings.getStatic('TRX_SPAM_LIMIT') * 1
            if (spamLimit > 1) {
                where.push(`
                    NOT(currency_code='TRX' AND transaction_direction = 'income' AND address_amount<${spamLimit})
                    `)
            }
        }


        // other categories
        if (typeof params.filterTypeHideSwap !== 'undefined' && params.filterTypeHideSwap) {
            where.push(`(bse_order_id = '' OR bse_order_id IS NULL OR bse_order_id = 'null')`)
            where.push(`transaction_direction NOT IN ('swap_income', 'swap_outcome', 'swap')`)
            where.push(`(transaction_filter_type IS NULL OR transaction_filter_type NOT IN ('${TransactionFilterTypeDict.SWAP}'))`)
        } else {
            tmpWhere.push(`
                (
                    bse_order_id != '' OR bse_order_id IS NOT NULL OR bse_order_id != 'null'
                ) OR (
                    transaction_filter_type IN ('${TransactionFilterTypeDict.SWAP}')
                    ) OR (
                        transaction_direction IN ('swap_income', 'swap_outcome', 'swap')
                    )
                `)
        }

        if (typeof params.filterTypeHideStake !== 'undefined' && params.filterTypeHideStake) {
            where.push(`transaction_direction NOT IN ('freeze', 'unfreeze', 'claim')`)
            where.push(`(transaction_filter_type IS NULL OR transaction_filter_type NOT IN ('${TransactionFilterTypeDict.STAKE}'))`)
        } else {
            if (params.currencyCode === 'TRX' || params.currencyCode === 'SOL') {
                tmpWhere.push(`
                    (
                        transaction_direction IN ('freeze', 'unfreeze', 'claim', 'vote')
                    ) OR (
                        transaction_filter_type IS NOT NULL AND transaction_filter_type IN ('${TransactionFilterTypeDict.STAKE}')
                    )
                `)
            }
        }

        // if (typeof params.filterTypeHideWalletConnect !== 'undefined' && params.filterTypeHideWalletConnect) {
        //     where.push(`(transaction_filter_type IS NULL OR transaction_filter_type NOT IN ('${TransactionFilterTypeDict.WALLET_CONNECT}'))`)
        // }


        //
        if (typeof params.noFilter === 'undefined' && filterTypeHideUsual && tmpWhere.length > 0) {
            tmpWhere = '(' + tmpWhere.join(') OR (') + ')'
            where.push(tmpWhere)
        }

        where.push(`transaction_hash !=''`)

        // trx fee somehow marked as "swap_income"
        where.push(`NOT (currency_code != 'TRX' AND transaction_direction IN ('swap_income', 'income') AND (address_amount == '0' OR address_amount IS NULL))`)
        where.push(`NOT (currency_code = 'TRX' AND address_from !='' AND (address_amount == '0' OR address_amount IS NULL))`)

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params.noOrder) {
            order = ''
        } else {
            where.push(`(hidden_at IS NULL OR hidden_at='null')`)
        }



        if (where.length > 0) {
            where = ' WHERE (' + where.join(') AND (') + ')'
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
            mined_at AS minedAt,
            block_time AS blockTime,
            block_hash AS blockHash,
            block_number AS blockNumber,
            block_confirmations AS blockConfirmations,
            transaction_hash AS transactionHash,
            transaction_hash_basic AS transactionHashBasic,
            address_from AS addressFrom,
            address_from_basic AS addressFromBasic,
            address_amount AS addressAmount,
            address_to AS addressTo,
            address_to_basic AS addressToBasic,
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
            bse_order_data AS bseOrderData,
            transaction_filter_type AS transactionFilterType,
            special_action_needed AS specialActionNeeded
            FROM transactions
            ${where}
            ${order}
            ${limit}
            `
        let res = []
        try {
            res = await Database.query(sql)
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

        return this.getTmpArrayTx(res, params)
    }

    getTransactionsForCsvFile = async (params, source = '?') => {
        let where = []

        if (params.walletHash) {
            where.push(`wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`currency_code='${params.currencyCode}'`)
        }
        if (typeof params.minAmount !== 'undefined' && params.minAmount * 1 >= 0) {
            const tmp = params.minAmount * 1
            where.push(`((address_amount >${tmp} AND address_amount IS NOT NULL) OR (bse_order_id != '' AND bse_order_id IS NOT NULL AND bse_order_id != 'null'))`)
            where.push(`address_to NOT LIKE '% Simple Send%'`)
        }

        where.push(`transaction_hash !=''`)

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params?.noOrder) {
            order = ''
        }

        if (where.length > 0) {
            where = ' WHERE (' + where.join(') AND (') + ')'
        } else {
            where = ''
        }

        const sql = `
            SELECT
            created_at AS createdAt,
            block_confirmations AS blockConfirmations,
            transaction_hash AS transactionHash,
            address_from AS addressFrom,
            address_amount AS addressAmount,
            address_to AS addressTo,
            transaction_fee AS transactionFee,
            transaction_status AS transactionStatus,
            transaction_direction AS transactionDirection
            FROM transactions
            ${where}
            ${order}
            `

        let res = []
        try {
            res = await Database.query(sql)
            if (typeof res.array !== 'undefined') {
                res = res.array
            }
        } catch (e) {
            Log.errDaemon('DS/Transaction getTransactionsForCsvFile error ' + sql, e)
        }

        if (!res || res.length === 0) {
            return false
        }

        return this.getTmpArrayTx(res, params)
    }

    getTmpArrayTx = async (array, params) => {
        const shownTx = {}
        const txArray = []
        let tx
        const toRemove = []
        try {
            for (tx of array) {
                if (tx.transactionHash !== '' && typeof shownTx[tx.transactionHash] !== 'undefined') {
                    Log.daemon('Transaction getTransactions will remove ' + tx.id)
                    toRemove.push(tx.id)
                    continue
                }
                if (tx.bseOrderId !== '' && typeof shownTx['bse_' + tx.bseOrderId] !== 'undefined') {
                    if (shownTx['bse_' + tx.bseOrderId].hash === '') {
                        Log.daemon('Transaction getTransactions will remove old ' + tx.bseOrderId)
                        toRemove.push(shownTx['bse_' + tx.bseOrderId].id)
                    } else {
                        Log.daemon('Transaction getTransactions will remove ' + tx.bseOrderId)
                        toRemove.push(tx.id)
                    }
                    continue
                }

                if (tx.transactionHash) {
                    shownTx[tx.transactionHash] = 1
                }
                if (tx.bseOrderId) {
                    shownTx['bse_' + tx.bseOrderId] = { id: tx.id, hash: tx.transactionHash }
                }
                try {
                    tx.addressAmount = BlocksoftUtils.fromENumber(tx.addressAmount)
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('DS/Transaction error ' + e.message + '  while fromENumber ' + tx.addressAmount )
                    }
                }

                if (typeof params.noOld !== 'undefined' || params.noOld) {
                    if ((tx.blockConfirmations > 30 && tx.transactionStatus === 'success') || tx.blockConfirmations > 300) {
                        txArray.push({
                            id: tx.id,
                            transactionHash: tx.transactionHash,
                            transactionsOtherHashes: tx.transactionsOtherHashes,
                            updateSkip: true
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
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('DS/Transaction error ' + e.message + '  while parsing db tx ', tx)
            }
            throw new Error(e.message + '  while parsing db tx ' + JSON.stringify(tx))
        }

        if (toRemove.length > 0) {
            await this.removeTransactions(toRemove)
        }

        // Log.daemon('DS/Transaction getTransactions finished ' + where + ' ' + order)
        return txArray
    }

}

export default new Transaction()
