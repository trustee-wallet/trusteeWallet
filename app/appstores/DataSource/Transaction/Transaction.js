import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'

class Transaction {

    /**
     * @param {object} transaction
     * @param {string} transaction.currency_code
     * @param {string} transaction.wallet_hash
     * @param {string} transaction.account_id
     * @param {string} transaction.transaction_hash
     * @param {string} transaction.transaction_status
     * @param {string} transaction.transaction_direction
     * @param {int} transaction.block_confirmations
     * @param {string} transaction.address_to
     * @param {string} transaction.address_from
     * @param {string} transaction.address_amount
     * @param {string} transaction.transaction_fee
     * @param {string} transaction.created_at: new Date().toISOString(),
     * @param {string} transaction.updated_at: new Date().toISOString()
     */
    saveTransaction = async (transaction, updateId = false) => {

        Log.daemon('DS/Transaction saveTransaction called', transaction.transaction_hash)

        const dbInterface = new DBInterface()

        dbInterface.setTableName('transactions')

        if (!transaction.updated_at) {
            transaction.updated_at = new Date().toISOString()
        }
        if (!transaction.transaction_direction) {
            transaction.transaction_direction = 'outcome'
        }

        let copy = JSON.parse(JSON.stringify(transaction))
        if(typeof copy.transaction_json != 'undefined') {
            copy.transaction_json = dbInterface.escapeString(JSON.stringify(copy.transaction_json))
        }

        if (updateId) {
            if (copy.address_to === '') {
                delete copy.address_to
            }
            if (copy.address_from === '') {
                delete copy.address_from
            }
            await dbInterface.setUpdateData({ key: { id: updateId }, updateObj: copy}).update()
            Log.daemon('DS/Transaction saveTransaction finished updated')
            return true
        }

        // sometimes db could be doubled so....
        let sql = `SELECT id FROM transactions WHERE currency_code='${transaction.currency_code}'
                        AND account_id=${transaction.account_id} 
                        AND transaction_hash='${transaction.transaction_hash}' LIMIT 1`
        let res = await dbInterface.setQueryString(sql).query()
        if (res.array.length === 0) {
            if (!transaction.created_at) {
                transaction.created_at = new Date().toISOString()
            }
            await dbInterface.setInsertData({ insertObjs: [copy] }).insert()
            Log.daemon('DS/Transaction saveTransaction finished inserted')
        } else {
            Log.daemon('DS/Transaction saveTransaction finished skipped')
        }


    }

    clearTransactions = async () => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Transaction clearTransactions called')

        let sql = ` DELETE FROM transactions`

        let res = []

        try {
            res = await dbInterface.setQueryString(sql).query()
        } catch (e) {
            Log.errDaemon('DS/Transaction clearTransactions error ' + sql, e)
        }

        Log.daemon('DS/Transaction clearTransactions finished ')

        return res
    }

    getTransactions = async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Transaction getTransactions called')

        let where = []
        if (params.wallet_hash) {
            where.push(`wallet_hash='${params.wallet_hash}'`)
        }
        if (params.currency_code) {
            where.push(`currency_code='${params.currency_code}'`)
        }
        if (params.account_id) {
            where.push(`account_id='${params.account_id}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let order = ' ORDER BY created_at DESC, id DESC'
        if (params.no_order) {
            order = ''
        }

        let sql = ` 
            SELECT id, created_at, updated_at, block_time, block_hash, block_number,  block_confirmations,
             transaction_hash, address_from, address_amount, address_to, transaction_fee,
             transaction_status, transaction_direction,
             account_id, wallet_hash, currency_code, transaction_of_trustee_wallet, transaction_json
            FROM transactions 
            ${where}
            ${order}
            `
        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
        } catch (e) {
            Log.errDaemon('DS/Transaction getTransactions error ' + sql, e)
        }

        let shownTx = {}
        let txArray = []
        for(let tx of res.array) {
            if (typeof(shownTx[tx.transaction_hash]) !== 'undefined') continue
            shownTx[tx.transaction_hash] = 1
            tx.address_amount = BlocksoftUtils.fromENumber(tx.address_amount)
            if (typeof (tx.transaction_json) != 'undefined') {
                tx.transaction_json = JSON.parse(tx.transaction_json)
            }
            txArray.push(tx)
        }

        Log.daemon('DS/Transaction getTransactions finished ' + where + ' ' + order)

        res.array = txArray
        return res
    }

}

export default new Transaction()
