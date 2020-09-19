/**
 * @version 0.11
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'


export default {

    /**
     * @param params.newAddress
     * @param params.oldAddress
     * @param params.currencyCode
     * @param params.walletHash
     * @returns {Promise<void>}
     */
    setMainAddress: async (params) => {
        if (params.newAddress === params.oldAddress) {
            return true
        }
        const dbInterface = new DBInterface()

        Log.daemon('DS/AccountHD setMainAddress called ', params)

        const now = new Date().toISOString()

        let res = await dbInterface.setQueryString(`SELECT * FROM account WHERE address='${params.newAddress}' AND currency_code='${params.currencyCode}'`).query()
        if (res.array && res.array.length > 1) {
            const sql = ` UPDATE account SET is_main=1, changes_log='${now} CHANGED MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.newAddress}'`
            await dbInterface.setQueryString(sql).query()
            const sql2 = ` UPDATE account SET is_main=0, changes_log='${now} CHANGED NOT MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.oldAddress}'`
            await dbInterface.setQueryString(sql2).query()

            Log.daemon('DS/AccountHD setMainAddress updated', params)
        } else {
            res = await dbInterface.setQueryString(`SELECT * FROM account WHERE address='${params.newAddress}' AND currency_code='BTC'`).query()
            res = res.array[0]

            const insert = {
                address: res.address,
                currency_code: params.currencyCode,
                derivation_index: res.derivation_index,
                derivation_path: res.derivation_path,
                derivation_type: res.derivation_type,
                is_main: 1,
                changes_log: `${now} CHANGED MAIN ${params.oldAddress} => ${params.newAddress} `,
                name: `CREATED by SET MAIN at ${now}`,
                status: 0,
                wallet_hash: params.walletHash
            }

            await dbInterface.setTableName('account').setInsertData({ insertObjs: [insert] }).insert()

            const sql = ` UPDATE account SET is_main=0, changes_log='${now} CHANGED NOT MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.oldAddress}'`
            await dbInterface.setQueryString(sql).query()

            Log.daemon('DS/AccountHD setMainAddress inserted', params)

        }

    },

    /**
     * @param params
     * @param source
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountsMaxForScanPub: async (params, source = '') => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/AccountHD getAccountsMaxForScanPub ' + source + ' called')

        let where = [`account.derivation_type='main'`]

        where.push(`account.wallet_pub_id='${params.walletPubId}'`)
        where.push(`account.currency_code='${params.currencyCode}'`)
        where = ' WHERE ' + where.join(' AND ')


        const sql = ` 
            SELECT SUM(CASE WHEN account.already_shown IS NULL OR account.already_shown=0 THEN 1 ELSE 0 END) AS accountsTotal,
            COUNT(account.id) AS accountsIncludingUsed, MAX(derivation_index) AS accountsDerivationIndex
            FROM account 
            ${where}
        `
        //
        // SELECT SUM(CASE WHEN account.already_shown IS NULL OR account.already_shown=0 THEN 1 ELSE 0 END) AS accountsTotal, COUNT(account.id) AS accountsIncludingUsed, MAX(derivation_index) AS accountsDerivationIndex FROM account WHERE account.derivation_type='main' AND account.wallet_pub_id='1'
        Log.daemon('DS/AccountHD getAccountsMaxForScanPub ' + source + ' ' + where)

        let total = { accountsTotal: 0, accountsIncludingUsed: 0, accountsDerivationIndex: -1 }
        try {
            const res = await dbInterface.setQueryString(sql).query(true)
            if (!res || !res.array || !res.array.length) {
                Log.daemon('DS/AccountHD getAccountsMaxForScanPub finished as empty')
                return total
            } else {
                total = res.array[0]
                if (total.accountsDerivationIndex === 0) {
                    Log.daemon('DS/AccountHD _reindexAddresses ' + source + ' ' + where, total)
                    const sql2 = `
                        SELECT id, derivation_path AS derivationPath, derivation_index AS derivationIndex FROM account
                        ${where}
                    `
                    const addresses = await dbInterface.setQueryString(sql2).query()
                    if (!addresses || !addresses.array || addresses.array.length === 0) {
                        return total
                    }

                    let address
                    for (address of addresses.array) {
                        let path = dbInterface.unEscapeString(address.derivationPath)
                        path = path.split('/')
                        const ic = path.length
                        if (ic.length < 2) {
                            Log.daemon('DS/AccountHD getAccountsMaxForScanPub strange address ', address)
                            continue
                        }
                        let max = 0
                        for (let i = 2; i < ic; i++) {
                            const current = path[i].replace(`'`, '')
                            if (current > max) {
                                max = current
                            }
                        }
                        if (max > 0) {
                            const sql3 = `UPDATE account SET derivation_index=${max} WHERE id=${address.id}`
                            await dbInterface.setQueryString(sql3).query()
                            Log.daemon('DS/AccountHD getAccountsMaxForScanPub updated address ', sql3)
                        }
                    }
                }
            }
            Log.daemon('DS/AccountHD getAccountsMaxForScanPub finished ' + JSON.stringify(total))
        } catch (e) {
            Log.daemon('DS/AccountHD getAccountsMaxForScanPub error ' + sql + ' ' + e.message)
        }

        return total
    },


    /**
     * @param params
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountForChange: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/AccountHD getAccountForChange called')

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
            Log.daemon('DS/AccountHD getAccountForChange finished as empty')
            return false
        }
        Log.daemon('DS/AccountHD getAccountForChange finished', res.array[0])
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
