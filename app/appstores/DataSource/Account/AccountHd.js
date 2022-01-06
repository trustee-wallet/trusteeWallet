/**
 * @version 0.11
 */
import Database from '@app/appstores/DataSource/Database'
import Log from '@app/services/Log/Log'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'


export default {

    /**
     * @param params.newAddress
     * @param params.oldAddress
     * @param params.currencyCode
     * @param params.basicCurrencyCode
     * @param params.walletHash
     * @returns {Promise<void>}
     */
    setMainAddress: async (params) => {
        if (params.newAddress === params.oldAddress) {
            return true
        }

        Log.daemon('DS/AccountHD setMainAddress called ', params)

        const now = new Date().toISOString()
        const selectSql = `SELECT address, derivation_index, derivation_path, derivation_type, is_main FROM account WHERE address IN ('${params.newAddress}', '${params.oldAddress}') AND currency_code='${params.currencyCode}'`
        let res = await Database.query(selectSql)
        if (res.array && res.array.length > 1) {
            const sql = ` UPDATE account SET is_main=1, derivation_type='main', changes_log='${now} CHANGED MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.newAddress}'`
            await Database.query(sql)
            const sql2 = ` UPDATE account SET is_main=0, derivation_type='no_scan', changes_log='${now} CHANGED NOT MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.oldAddress}'`
            await Database.query(sql2)
            Log.daemon('DS/AccountHD setMainAddress updated', params)
            return true
        }

        res = await Database.query(`SELECT  address, derivation_index, derivation_path, derivation_type, is_main, currency_code FROM account WHERE address='${params.newAddress}' AND currency_code IN ('${params.basicCurrencyCode}')`)
        Log.daemon('res2', JSON.parse(JSON.stringify(res)))
        if (res.array && res.array.length > 0) {
            res = res.array[0]
        } else {
            const xpub = await Database.query(`SELECT wallet_pub_value AS xpub FROM wallet_pub WHERE wallet_hash='${params.walletHash}' AND wallet_pub_type='btc.44'`)
            Log.daemon('xpub', JSON.parse(JSON.stringify(xpub)))
            if (!xpub || !xpub.array || xpub.array.length < 1) {
                throw new Error('no Xpub')
            } else {
                let found = false
                const link = 'https://btc1.trezor.io/api/v2/xpub/' + xpub.array[0].xpub + '?gap=9999'
                Log.daemon('DS/AccountHD link to load ' + link)
                const addresses = await BlocksoftAxios.getWithoutBraking(link)
                if (!addresses || !addresses.data || !addresses.data.tokens) {
                    throw new Error('no Xpub addresses loaded')
                }
                Log.daemon('DS/AccountHD link loaded ' + link, addresses.data.tokens)
                for (const token of addresses.data.tokens) {
                    if (token.name === params.newAddress) {
                        found = token
                    }
                }
                if (!found) {
                    throw new Error('no Xpub address found in loaded data')
                }
                res = {
                    address: found.name,
                    path: Database.escapeString(found.path),
                    derivation_index: '0',
                    derivation_type: 'main'
                }
                Log.daemon('DS/ACcountHD found res for address', JSON.stringify({ found, res }))
            }
        }

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
        Log.daemon('DS/AccountHD setMainAddress to insert', JSON.stringify(insert))

        await Database.setTableName('account').setInsertData({ insertObjs: [insert] }).insert()

        const sql = ` UPDATE account SET is_main=0, changes_log='${now} CHANGED NOT MAIN ${params.oldAddress} => ${params.newAddress} ' || changes_log WHERE currency_code='${params.currencyCode}' AND address='${params.oldAddress}'`
        await Database.query(sql)

        Log.daemon('DS/AccountHD setMainAddress inserted', params)
    },

    /**
     * @param params
     * @param source
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountsMaxForScanPub: async (params, source = '') => {
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
            const res = await Database.query(sql, true)
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
                    const addresses = await Database.query(sql2)
                    if (!addresses || !addresses.array || addresses.array.length === 0) {
                        return total
                    }

                    let address
                    for (address of addresses.array) {
                        let path = Database.unEscapeString(address.derivationPath)
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
                            await Database.query(sql3)
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

        const res = await Database.query(sql)
        if (!res || !res.array || !res.array.length) {
             Log.daemon('DS/AccountHD getAccountForChange finished as empty')
            return false
        }
         Log.daemon('DS/AccountHD getAccountForChange finished', res.array[0])
        return res.array[0].address
    },

    countUsed: async (params) => {
        const sql = `SELECT COUNT(*) AS cn FROM account WHERE already_shown=1 AND wallet_hash='${params.walletHash}' AND currency_code='${params.currencyCode}'`
        const res = await Database.query(sql)
        if (!res || typeof res.array === 'undefined' || !res.array || typeof res.array[0] === 'undefined' || !res.array[0]) {
            return 0
        }
        return res.array[0].cn
    },

    countGap: async (params) => {
        let sql = `SELECT id, derivation_index, derivation_path, already_shown FROM account WHERE wallet_hash='${params.walletHash}' AND currency_code='${params.currencyCode}'`
        if (params.address.indexOf('bc1') === 0) {
            sql += ` AND address LIKE 'bc1%' AND derivation_path LIKE 'm/84quote/0quote/0quote/0/%'`
        } else {
            sql += ` AND address LIKE '1%' AND derivation_path LIKE 'm/84quote/0quote/0quote/0/%'`
        }
        const res = await Database.query(sql)
        if (!res || typeof res.array === 'undefined' || !res.array || typeof res.array[0] === 'undefined' || !res.array[0]) {
            return 0
        }
        let maxIndexManualUsed = 0
        let maxIndexUsed = 0
        let maxNotUsed = 0


        for (const row of res.array) {
            const tmp = row.derivation_path.split('/')
            if (typeof tmp[5] === 'undefined') continue
            const max = tmp[5] * 1
            row.already_shown = row.already_shown * 1
            if (row.already_shown === 2) {
                if (max > maxIndexManualUsed) {
                    maxIndexManualUsed = max
                }
            } else if (row.already_shown === 1) {
                if (max > maxIndexUsed) {
                    maxIndexUsed = max
                }
            } else if (row.already_shown === 0) {
                if (max > maxNotUsed) {
                    maxNotUsed = max
                }
            }
            if (row.derivation_index * 1 !== max) {
                await Database.query(`UPDATE account SET derivation_index=${max} WHERE id=${row.id}`)
            }
        }
        Log.log(`DS/AccountHD countGap maxNotUsed ${maxNotUsed} maxIndexUsed ${maxIndexUsed} maxIndexManualUsed ${maxIndexManualUsed}`)
        return {gap : maxIndexManualUsed - maxIndexUsed, maxIndexUsed}
    },

    backUsed: async (params) => {
        let sql = `UPDATE account SET already_shown=0 WHERE already_shown=2 AND wallet_hash='${params.walletHash}'`
        if (typeof params.maxIndexUsed !== 'undefined') {
            sql += ' AND derivation_index>' + params.maxIndexUsed
        }
        const res = await Database.query(sql, true)
        if (!res || typeof res.rowsAffected === 'undefined') {
            return 0
        }
        return res.rowsAffected
    },

    getAddresses: async (params) => {
        const withBalances = typeof params.withBalances !== 'undefined' && params.withBalances

        let where = []
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`account.currency_code IN ('${params.currencyCode}')`)
        }
        if (typeof params.onlyLegacy !== 'undefined') {
            where.push(`account.address LIKE '1%'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let order = ''
        if (params.reverse) {
            order = 'ORDER BY account.id DESC'
        }

        let limit = ''
        if (typeof params.limitPerPage !== 'undefined') {
            limit = ' LIMIT ' + params.limitPerPage
        }
        if (typeof params.limitFrom !== 'undefined') {
            limit += ' OFFSET ' + params.limitFrom
        }

        const sql = `
            SELECT
            account.id,
            account.currency_code AS currencyCode,
            account.wallet_hash AS walletHash,
            account.already_shown AS alreadyShown,
            account.address,
            account.name AS addressName,
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_error AS balanceScanError,
            account_balance.balance_scan_log AS balanceScanLog            
            FROM account
            LEFT JOIN account_balance ON account_balance.account_id = account.id
            ${where}
            ${order}
            ${limit}
        `

        const indexedRes = {}
        try {
            let res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('DS/AccountHD getAddresses finished as empty')
                return false
            }
            if (typeof params.limit !== 'undefined') {
                if (params.limit === 1) {
                    return res.array[0].address
                }
            }

            res = res.array
            
            res = res.map(e => e.addressName.includes("CREATED") ? {...e, addressName: ''} : e)

            let tmp
            for (tmp of res) {
                if (withBalances) {
                    indexedRes[tmp.address] = tmp
                } else {
                    indexedRes[tmp.address] = tmp.alreadyShown
                }
            }
        } catch (e) {
            Log.daemon('DS/AccountHD getAddresses error ' + sql + ' ' + e.message)
        }
        return indexedRes
    }


}
