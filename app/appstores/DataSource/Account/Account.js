import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import currencyDS from '../Currency/Currency'
import walletDS from '../Wallet/Wallet'
import BlocksoftAxios from '../../../../crypto/common/BlocksoftAxios'
import walletPubDS from '../WalletPub/WalletPub'

const tableName = 'account'


export default {

    /**
     * @param {string} params.walletHash
     * @param {string} params.mnemonic
     * @param {string} params.currencyCode[]
     * @param {string} params.walletPubId
     * @param {string} params.fromIndex
     * @param {string} params.toIndex
     * @param {string} params.fullTree
     * @param {string} params.source
     * @param {*} params.derivations
     * @returns {Promise<[]>}
     */
    discoverAccounts: async (params, source = 'BASIC') => {
        const dbInterface = new DBInterface()

        Log.daemon('DS/Account discoverAddresses called ' + JSON.stringify(params))
        let mnemonic
        if (typeof params.mnemonic === 'undefined' || !params.mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash)
        } else {
            mnemonic = params.mnemonic
        }
        if (!mnemonic) {
            throw new Error('mnemonic not found')
        }

        let fromIndex = 0
        let toIndex = 1
        let fullTree = false
        let currencyCode = params.currencyCode
        let derivations = { 'BTC': [], 'BTC_SEGWIT': [] }

        if (!currencyCode) {
            currencyCode = await currencyDS.getCurrenciesCodesActivated()
        }
        if (params.fromIndex) {
            fromIndex = params.fromIndex
        }
        if (params.toIndex) {
            toIndex = params.toIndex
        }
        if (params.fullTree) {
            fullTree = params.fullTree
        }

        if (typeof (params.derivations) !== 'undefined' && params.derivations) {
            derivations = params.derivations
        }


        Log.daemon('DS/Account discoverAddresses actual currencyCode ' + currencyCode)
        /**
         * addresses list unique = type+index or path
         *
         * @type {string} addresses['BTC'][0].path
         * @type {index} addresses[][].index // number in derivation
         * @type {string} addresses[][].type //main is 'main', others - to think
         * @type {string} addresses[][].address //save in db
         * @type {string} addresses[][].privateKey //do not save in db
         */
        const accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree, fromIndex, toIndex, currencyCode, walletHash: params.walletHash, derivations })
        Log.daemon('DS/Account discoverAddresses actual accounts finished')
        const prepare = []
        const savedUnique = {}
        let code, account

        for (code of currencyCode) {
            if (typeof accounts[code] === 'undefined') {
                throw new Error('DS/Account discoverAddresses NO ACCOUNTS FOR ' + code)
            }
            const keyCode = code
            const tmp = accounts[code]
            if (code === 'BTC_SEGWIT') {
                code = 'BTC'
            }
            Log.daemon('DS/Account discoverAddresses ' + source + ' accounts ' + code + ' length ' + tmp.length + ' fromIndex ' + fromIndex + ' firstAddress ' + tmp[0].address + ' ' + tmp[0].path + ' index ' + tmp[0].index)
            for (account of tmp) {
                const derivationPath = dbInterface.escapeString(account.path)
                const key = BlocksoftKeysStorage.getAddressCacheKey(params.walletHash, derivationPath, keyCode)
                if (typeof (savedUnique[key]) === 'undefined') {

                    const findSql = `SELECT id, address, derivation_path, derivation_type, derivation_index, currency_code, wallet_hash, wallet_pub_id
                     FROM ${tableName} 
                     WHERE currency_code='${code}' AND address='${account.address}'`

                    let find = await dbInterface.setQueryString(findSql).query()
                    if (find.array.length === 0) {
                        let accountJson = ''
                        if (typeof (account.addedData) !== 'undefined') {
                            accountJson = dbInterface.escapeString(JSON.stringify(account.addedData))
                        }
                        const tmp = {
                            address: account.address,
                            name: '',
                            derivation_path: derivationPath,
                            derivation_index: account.index,
                            derivation_type: account.type,
                            already_shown: account.alreadyShown ? 1 : 0,
                            status: 0,
                            currency_code: code,
                            wallet_hash: params.walletHash,
                            account_json: accountJson,
                            transactions_scan_time: 0
                        }
                        if (params.walletPubId) {
                            tmp.wallet_pub_id = params.walletPubId
                        }
                        prepare.push(tmp)
                        Log.daemon('DS/Account insert accounts will add ' + account.address + ' index ' + account.index)
                        // console.log('DS/Account insert accounts will add ' + account.address + ' index ' + account.index)
                        BlocksoftKeysStorage.setAddressCache(key, account)
                    } else {
                        find = find.array[0]
                        if (params.walletPubId && find.wallet_pub_id !== params.walletPubId) {
                            await dbInterface.setQueryString(`UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index}, wallet_pub_id=${params.walletPubId} WHERE id=${find.id}`).query()
                            Log.daemon('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // console.log('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else if (find.derivation_index !== account.index || find.derivation_type !== account.type) {
                            await dbInterface.setQueryString(`UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index} WHERE id=${find.id}`).query()
                            Log.daemon('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // console.log('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else {
                            Log.daemon('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // console.log('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        }
                    }
                    savedUnique[key] = 1
                } else {
                    Log.daemon('DS/Account insert accounts not ok / already in cache')
                }
            }
        }

        if (!prepare || prepare.length === 0 || prepare === []) {
            if (params.walletPubId) {
                Log.daemon('DS/Account insert accounts nothing to save')
                return false
            } else {
                throw new Error('DS/Account insert accounts nothing to save')
            }
        }

        Log.daemon('DS/Account insert accounts called ' + prepare.length)

        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepare }).insert()

        Log.daemon('DS/Account insert accounts finished')

        return prepare

    },

    /**
     * @param {string} params.walletHash
     * @returns {Promise<void>}
     */
    clearAccounts: async (params) => {
        const dbInterface = new DBInterface()

        Log.daemon('DS/Account clear accounts called ' + params.walletHash)

        await dbInterface.setQueryString(`DELETE FROM account WHERE wallet_hash='${params.walletHash}'`).query()

        await dbInterface.setQueryString(`DELETE FROM account_balance WHERE wallet_hash='${params.walletHash}'`).query()

        Log.daemon('DS/Account clear accounts finished ' + params.walletHash)
    },

    /**
     * @param {Object} params
     * @return {Promise<{array:[{id, currencyCode, address, transactionsScanTime, walletHash}]}>}
     */
    getAccountsForScanTransactions: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsForScanTransactions called')

        const now = Math.round(new Date().getTime() / 1000) - 30 // 30 seconds before 0x
        let where = [`(account.transactions_scan_time IS NULL OR account.transactions_scan_time LIKE '%Z%' OR account.transactions_scan_time < ${now})`]

        where.push(`currency.is_hidden=0`)
        if (params.derivation_type) {
            where.push(`account.derivation_type='${params.derivation_type}'`)
        }
        if (params.wallet_hash) {
            where.push(`account.wallet_hash='${params.wallet_hash}'`)
        }
        if (params.currency_code) {
            where.push(`account.currency_code='${params.currency_code}'`)
        }
        if (typeof params.not_currency_code !== 'undefined' && params.not_currency_code) {
            where.push(`account.currency_code!='${params.not_currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT account.id, account.currency_code AS currencyCode, account.address,
            
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime, 
            account_balance.balance_scan_log AS balanceScanLog,
            
            account.transactions_scan_time AS transactionsScanTime, 
            account.wallet_hash AS walletHash, 
            account.account_json as accountJson
            FROM account
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            LEFT JOIN currency ON currency.currency_code=account.currency_code
            ${where}
            ORDER BY account.transactions_scan_time ASC
            LIMIT 20        `

        let res = []
        const logData = []
        try {

            res = await dbInterface.setQueryString(sql).query()

            if (!res || !res.array || !res.array.length) {
                return false
            }

            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                logData.push(res[i].currencyCode + ' ' + res[i].address)
                res[i].balance = fixBalance(res[i])
                if (res[i].accountJson && res[i].accountJson !== 'false') {
                    const string = dbInterface.unEscapeString(res[i].accountJson)
                    try {
                        Log.daemon('DS/Account getAccountsForScanTransactions will parse ' + string)
                        res[i].accountJson = JSON.parse(string)
                    } catch (e) {
                        Log.errDaemon('DS/Account getAccountsForScanTransactions json error ' + string + ' ' + e.message)
                    }
                }
            }

            Log.daemon('DS/Account getAccountsForScanTransactions finished', logData)
        } catch (e) {
            Log.errDaemon('DS/Account getAccountsForScanTransactions error ' + sql, e)
        }

        return res
    },

    getAccountsForScanPub: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsForScanPub called')

        let where = []

        if (params.not_already_shown) {
            where.push(`(account.already_shown IS NULL OR account.already_shown=0)`)
        }
        if (params.wallet_pub_id) {
            where.push(`account.wallet_pub_id='${params.wallet_pub_id}'`)
        }
        if (params.derivation_path) {
            where.push(`account.derivation_path LIKE '${params.derivation_path}%'`)
        }
        if (params.wallet_hash) {
            where.push(`account.wallet_hash='${params.wallet_hash}'`)
        }
        if (params.currency_code) {
            where.push(`account.currency_code='${params.currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT account.id, account.currency_code AS currencyCode,  account.wallet_hash AS walletHash, 
            account.wallet_pub_id AS walletPubId, account.already_shown AS alreadyShown,
            account.address, derivation_index AS derivationIndex,
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_log AS balanceScanLog
            FROM account 
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            ${where}
            ORDER BY account_balance.balance_scan_time ASC
        `

        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
            if (!res || !res.array || !res.array.length) {
                Log.daemon('DS/Account getAccountsForScanPub finished empty')
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                res[i].balance = fixBalance(res[i])
            }

            Log.daemon('DS/Account getAccountsForScanPub finished')
        } catch (e) {
            Log.daemon('DS/Account getAccountsForScanPub error ' + sql + ' ' + e.message)
        }

        return res
    },

    /**
     * @param params
     * @returns {Promise<{accountsDerivationIndex: number, accountsTotal: number}>}
     */
    getAccountsMaxForScanPub: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsMaxForScanPub called')

        let where = [`account.derivation_type='main'`]

        where.push(`account.wallet_pub_id='${params.wallet_pub_id}'`)
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
        where.push(`account.wallet_pub_id='${params.wallet_pub_id}'`)
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

    /**
     * @param {Object} params
     * @return {Promise<{array:[{id, currencyCode, address, balance, balanceScanTime, walletHash}]}>}
     */
    getAccountsForScan: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsForScan called')

        const now = Math.round(new Date().getTime() / 1000) - 60 // 1 minute before
        let where = [`(account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time < ${now})`]
        where.push(`currency.is_hidden=0`)
        if (params.derivation_type) {
            where.push(`account.derivation_type='${params.derivation_type}'`)
        }
        if (params.wallet_hash) {
            where.push(`account.wallet_hash='${params.wallet_hash}'`)
        }
        if (params.currency_code) {
            where.push(`account.currency_code='${params.currency_code}'`)
        }
        if (typeof params.not_currency_code !== 'undefined' && params.not_currency_code) {
            where.push(`account.currency_code!='${params.not_currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = ` 
            SELECT account.id, account.currency_code AS currencyCode,  account.wallet_hash AS walletHash,
            account.address, 
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_log AS balanceScanLog,
            account.account_json AS accountJSON
            FROM account 
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            LEFT JOIN currency ON currency.currency_code=account.currency_code
            ${where}
            ORDER BY account_balance.balance_scan_time ASC
            LIMIT 20
        `
        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
            if (!res || !res.array || !res.array.length) {
                Log.daemon('DS/Account getAccountsForScan finished as empty')
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                res[i].balance = fixBalance(res[i])
                if (res[i].accountJSON && res[i].accountJSON !== 'false') {
                    const string = dbInterface.unEscapeString(res[i].accountJSON)
                    try {
                        Log.daemon('DS/Account getAccountsForScan will parse ' + string)
                        res[i].accountJSON = JSON.parse(string)
                    } catch (e) {
                        Log.errDaemon('DS/Account getAccountsForScan json error ' + string + ' ' + e.message)
                    }
                }
            }

            Log.daemon('DS/Account getAccountsForScan finished')
        } catch (e) {
            Log.daemon('DS/Account getAccountsForScan error ' + sql + ' ' + e.message)
        }

        return res
    },

    getAccountsByWalletHash: async (walletHash) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsByWalletHash called')

        const res = await dbInterface.setQueryString(`SELECT * FROM account WHERE account.wallet_hash = '${walletHash}'`).query()

        Log.daemon('DS/Account getAccountsByWalletHash finished')

        return res
    },

    getAccountsByWalletHashAndCurrencyCode: async (walletHash, currencyCode) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account get accounts by wallet hash called')

        const res = await dbInterface.setQueryString(`SELECT * FROM account WHERE account.wallet_hash = '${walletHash}' AND account.currency_code = '${currencyCode}'`).query()

        Log.daemon('DS/Account get accounts by wallet hash finished')

        return res
    },

    /**
     * @param {string} params.not_already_shown
     * @param {string} params.wallet_hash
     * @param {string} params.currency_code
     * @returns {Promise<[]|*[]>}
     */
    getAccountData: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountData called')

        let where = [`account.derivation_type='main'`]

        if (typeof params.not_already_shown !== 'undefined' && params.not_already_shown && params.not_already_shown > 0) {
            where.push(`(account.already_shown IS NULL OR account.already_shown=0)`)
        }
        if (params.wallet_hash) {
            where.push(`account.wallet_hash='${params.wallet_hash}'`)
        }
        if (params.currency_code) {
            where.push(`account.currency_code='${params.currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `SELECT 
            account.id, account_balance.account_id, 
            account.address, account.name, account.derivation_type, account.derivation_path, account.currency_code, account.wallet_hash, account.account_json,
            account_balance.balance_fix, account_balance.balance_txt, account_balance.balance_provider, account_balance.balance_scan_time, account_balance.balance_scan_log, account.already_shown
            FROM account 
            LEFT JOIN account_balance ON account_balance.account_id = account.id
            ${where}
        `

        const res = await dbInterface.setQueryString(sql).query()

        if (!res || !res.array || !res.array.length) {
            return []
        }

        const accounts = []
        let account

        if (params.segwit) {
            const segwit = []
            const legacy = []
            for (account of res.array) {
                account.balance = fixBalance(account)
                account.balanceProvider = account.balance_provider ? account.balance_provider : 'old'
                accounts.push(account)
                if (account.derivation_path.indexOf('m/84') === 0) {
                    segwit.push(account)
                } else {
                    legacy.push(account)
                }
            }
            accounts.segwit = segwit
            accounts.legacy = legacy
        } else {
            for (account of res.array) {
                account.balance = fixBalance(account)
                account.balanceProvider = account.balance_provider ? account.balance_provider : 'old'
                accounts.push(account)
            }
        }

        Log.daemon('DS/Account getAccountData finished')

        return accounts
    },

    /**
     * @param {int} id
     * @return {Promise<{int}>}
     */
    getAccountBalance: async (id) => {

        const dbInterface = new DBInterface()

        Log.daemonDiv()

        Log.daemon('DS/Account getAccountBalance called')

        const res = await dbInterface.setQueryString(`SELECT balance_fix, balance_txt, balance_provider as balanceProvider FROM account_balance WHERE account_balance.account_id = ${id}`).query()

        if (res && res.array && res.array.length) {
            res.array[0].balance = fixBalance(res.array[0])
        }

        Log.daemon('DS/Account getAccountBalance finished')

        return res.array[0] && res.array[0].balance ? res.array[0].balance : 0
    },

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {Promise<void>}
     */
    updateAccount: async (data) => {

        Log.daemonDiv()

        Log.daemon('DS/Account updateAccount called', data)

        const dbInterface = new DBInterface()

        data.updateObj.transactionsScanLog = dbInterface.escapeString(data.updateObj.transactionsScanLog)

        await (dbInterface.setTableName(tableName).setUpdateData(data)).update()

        Log.daemon('DS/Account updateAccount finished')

    },

    countUsed : async (params) => {
        const dbInterface = new DBInterface()

        const sql = `SELECT COUNT(*) AS cn FROM account WHERE already_shown=1 AND wallet_hash='${params.wallet_hash}' AND currency_code='${params.currency_code}'`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || typeof res.array === 'undefined' || !res.array || typeof res.array[0] === 'undefined' || !res.array[0]) {
            return 0
        }
        return res.array[0].cn
    },

    /**
     * @param {integer} keys[]
     * @param {string} keyField
     * @param {string} update
     * @return {Promise<void>}
     */
    massUpdateAccount: async (keys, keyField, update) => {

        Log.daemonDiv()

        Log.daemon('DS/Account massUpdateAccount called ' + update, keys)

        const dbInterface = new DBInterface()

        const sql = `UPDATE ${tableName} SET ${update} WHERE ${keyField} IN ( ` + keys.join(' , ') + `)`

        await dbInterface.setQueryString(sql).query()

        Log.daemon('DS/Account massupdateAccount finished')

    },

    /**
     *
     * @param {Object} data
     * @returns {Promise<void>}
     */
    insertAccounts: async (data) => {

        Log.daemon('DS/Account insertAccounts called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.daemon('DS/Account insertAccounts finished')

    }


}

function fixBalance(obj) {
    let balance
    if (typeof (obj.balanceFix) !== 'undefined') {
        balance = obj.balanceFix
    } else {
        balance = obj.balance_fix
    }
    if (!balance) {
        return '0'
    }
    if (balance.toString().indexOf('e') === -1)
        return balance

    if (typeof (obj.balanceTxt) !== 'undefined') {
        balance = obj.balanceTxt
    } else {
        balance = obj.balance_txt
    }

    return balance
}

