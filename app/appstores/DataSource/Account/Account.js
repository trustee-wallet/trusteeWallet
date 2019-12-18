import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import currencyDS from '../Currency/Currency'

const tableName = 'account'

export default {

    discoverAccounts: async (walletHash, currencyCode = null) => {
        const dbInterface = new DBInterface()

        Log.daemon('DS/Account discoverAddresses called', walletHash)
        let mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash)
        if (!mnemonic) {
            throw new Error('mnemonic not found')
        }

        if (currencyCode === null) {
            currencyCode = await currencyDS.getCurrenciesCodesActivated()
        }

        /**
         * addresses list unique = type+index or path
         *
         * @type {string} addresses['BTC'][0].path
         * @type {index} addresses[][].index // number in derivation
         * @type {string} addresses[][].type //main is 'main', others - to think
         * @type {string} addresses[][].address //save in db
         * @type {string} addresses[][].privateKey //do not save in db
         */
        let accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree: false, fromIndex : 0,  toIndex : 1, currencyCode, walletHash })
        Log.daemon('DS/Account discoverAddresses finished ', currencyCode)

        let prepare = []

        let savedUnique = {}
        for (let code of currencyCode) {
            for(let account of accounts[code]) {
                let derivation_path = dbInterface.escapeString(account.path)
                let key = BlocksoftKeysStorage.getAddressCacheKey(walletHash, derivation_path, code)
                if (typeof(savedUnique[key]) === 'undefined') {
                    const {array : find} = await dbInterface.setQueryString(`SELECT * FROM ${tableName} WHERE currency_code='${code}' AND address='${account.address}'`).query()
                    if (find.length === 0) {
                        let account_json = ''
                        if (typeof (account.addedData) !== 'undefined') {
                            account_json = dbInterface.escapeString(JSON.stringify(account.addedData))
                        }
                        prepare.push({
                            address: account.address,
                            name: '',
                            derivation_path,
                            derivation_index: account.index,
                            derivation_type: account.type,
                            status: 0,
                            currency_code: code,
                            wallet_hash: walletHash,
                            account_json,
                            transactions_scan_time: 0
                        })
                        BlocksoftKeysStorage.setAddressCache(key, account)
                    } else {
                        Log.log('DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address)
                        Log.log(find)
                    }
                    savedUnique[key] = 1
                } else {
                    Log.log('DS/Account insert accounts not ok / already in cache')
                }
            }
        }

        if (!prepare || prepare.length === 0) {
            throw new Error('DS/Account insert accounts nothing to save')
        }

        Log.daemon('DS/Account insert accounts called')

        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepare }).insert()

        Log.daemon('DS/Account insert accounts finished', prepare)

        return prepare

    },

    /**
     * @param {Object} params
     * @return {Promise<{array:[{id, currencyCode, address, transactionsScanTime, walletHash}]}>}
     */
    getAccountsForScanTransactions: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountsForScanTransactions called')

        let now = Math.round(new Date().getTime() / 1000) - 30 // 30 seconds before 0x
        let where = [`(account.transactions_scan_time IS NULL OR account.transactions_scan_time LIKE '%Z%' OR account.transactions_scan_time < ${now})`]

        // where.push(`account.currency_code='ETH_ROPSTEN' `)

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
        if (typeof params.not_currency_code != 'undefined' && params.not_currency_code) {
            where.push(`account.currency_code!='${params.not_currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let sql = ` 
            SELECT account.id, account.currency_code AS currencyCode, account.address,
            
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime, 
            
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
        let logData = []
        try {

            res = await dbInterface.setQueryString(sql).query()

            if (res && res.array && res.array.length) {
                for (let i = 0, ic = res.array.length; i <ic; i++) {
                    logData.push(res.array[i].currencyCode + ' ' + res.array[i].address)
                    res.array[i].balance = fixBalance(res.array[i])
                    if (res.array[i].accountJSON) {
                        let string = dbInterface.unEscapeString(res.array[i].accountJSON)
                        try {
                            Log.daemon('DS/Account getAccountsForScanTransactions will parse ' + string)
                            res.array[i].accountJSON = JSON.parse(string)
                        } catch (e) {
                            Log.errDaemon('DS/Account getAccountsForScanTransactions json error ' + string + ' ' + e.message)
                        }
                    }
                }
            }

            Log.daemon('DS/Account getAccountsForScanTransactions finished', logData)
        } catch (e) {
            Log.errDaemon('DS/Account getAccountsForScanTransactions error ' + sql, e)
        }

        return res
    },

    /**
     * @param {Object} params
     * @return {Promise<{array:[{id, currencyCode, address, balance, balanceScanTime, walletHash}]}>}
     */
    getAccountsForScan: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemonDiv()

        Log.daemon('DS/Account getAccountsForScan called')

        let now = Math.round(new Date().getTime() / 1000) - 60 // 1 minute before
        let where = [`(account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time < ${now})`]

        // here.push(`account.currency_code='ETH_ROPSTEN' `)
        // where.push(`account.currency_code='TRX' `)
        // where.push(`account.address='0x103f8f95c7539A87968C2F5044c02c5A17066177'`)

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
        if (typeof params.not_currency_code != 'undefined' && params.not_currency_code) {
            where.push(`account.currency_code!='${params.not_currency_code}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        let sql = ` 
            SELECT account.id, account.currency_code AS currencyCode, account.address, 
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime, 
            account.wallet_hash AS walletHash,
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
            if (res && res.array && res.array.length) {
                for (let i = 0, ic = res.array.length; i <ic; i++) {
                    res.array[i].balance = fixBalance(res.array[i])
                    if (res.array[i].accountJSON) {
                        let string = dbInterface.unEscapeString(res.array[i].accountJSON)
                        try {
                            Log.daemon('DS/Account getAccountsForScan will parse ' + string)
                            res.array[i].accountJSON = JSON.parse(string)
                        } catch (e) {
                            Log.errDaemon('DS/Account getAccountsForScan json error ' + string + ' ' + e.message)
                        }
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

        Log.daemonDiv()

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

    getAccountData: async (walletHash, currencyCode) => {

        const dbInterface = new DBInterface()

        Log.daemonDiv()

        Log.daemon('DS/Account getAccountData called')

        const res = await dbInterface.setQueryString(`SELECT * FROM account, account_balance WHERE account.wallet_hash = '${walletHash}' AND  account.currency_code = '${currencyCode}' AND account_balance.account_id = account.id`).query()

        if (res && res.array && res.array.length) {
            for (let i = 0, ic = res.array.length; i <ic; i++) {
                res.array[i].balance = fixBalance(res.array[i])
                res.array[i].balanceProvider = res.array[i].balance_provider ? res.array[i].balance_provider : 'old'
            }
        }
        Log.daemon('DS/Account getAccountData finished')

        return res
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

        await (dbInterface.setTableName(tableName).setUpdateData(data)).update()

        Log.daemon('DS/Account updateAccount finished')

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

    },


}

function fixBalance(obj) {
    let balance
    if (typeof(obj.balanceFix) !== 'undefined') {
        balance = obj.balanceFix
    } else {
        balance = obj.balance_fix
    }
    if (!balance) {
        return '0'
    }
    if (balance.toString().indexOf('e') === -1)
        return balance

    if (typeof(obj.balanceTxt) !== 'undefined') {
        balance = obj.balanceTxt
    } else {
        balance = obj.balance_txt
    }

    return balance
}

