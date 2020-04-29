/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'


export default {

    /**
     * @param params
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountsMaxForScanPub: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsMaxForScanPub called')

        let where = [`account.derivation_type='main'`]

        where.push(`account.wallet_pub_id='${params.walletPubId}'`)
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT SUM(CASE WHEN account.already_shown IS NULL OR account.already_shown=0 THEN 1 ELSE 0 END) AS accountsTotal,
            COUNT(account.id) AS accountsIncludingUsed, MAX(derivation_index) AS accountsDerivationIndex
            FROM account 
            ${where}
        `

        let total = { accountsTotal: 0, accountsIncludingUsed: 0, accountsDerivationIndex: -1 }
        try {
            const res = await dbInterface.setQueryString(sql).query(true)
            if (!res || !res.array || !res.array.length) {
                Log.daemon('DS/Account getAccountsForMaxScanPub finished as empty')
                return total
            } else {
                total = res.array[0]
            }
            Log.daemon('DS/Account getAccountsForMaxScanPub finished')
        } catch (e) {
            Log.daemon('DS/Account getAccountsMaxForScanPub error ' + sql + ' ' + e.message)
        }

        return total
    },

    /**
     * @param params
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountForChange: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountForChange called')

        let where = [`account.derivation_type='change'`]
        where.push(`(account.already_shown IS NULL OR account.already_shown=0)`)
        where.push(`account.wallet_pub_id='${params.walletPubId}'`)
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT address FROM account 
            ${where}
            LIMIT 1
        `

        const res = await dbInterface.setQueryString(sql).query()
        if (!res || !res.array || !res.array.length) {
            Log.daemon('DS/Account getAccountForChange finished as empty')
            return false
        }
        Log.daemon('DS/Account getAccountForChange finished', res.array[0])
        return res.array[0].address
    },

    countUsed: async (params) => {
        const dbInterface = new DBInterface()

        const sql = `SELECT COUNT(*) AS cn FROM account WHERE already_shown=1 AND wallet_hash='${params.walletHash}' AND currency_code='${params.currencyCode}'`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || typeof res.array === 'undefined' || !res.array || typeof res.array[0] === 'undefined' || !res.array[0]) {
            return 0
        }
        return res.array[0].cn
    },

    backUsed: async (params) => {
        const dbInterface = new DBInterface()

        const sql = `UPDATE account SET already_shown=0 WHERE already_shown=2 AND wallet_hash='${params.walletHash}' AND currency_code='${params.currencyCode}'`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || typeof res.rowsAffected === 'undefined') {
            return 0
        }
        return res.rowsAffected
    }

}
