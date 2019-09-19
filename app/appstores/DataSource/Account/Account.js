import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import currencyDS from '../Currency/Currency'

const tableName = 'account'

export default {

    discoverAccounts: async (walletHash) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account discoverAddresses called', walletHash)
        let mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash)
        if (!mnemonic) {
            throw new Error('mnemonic not found')
        }

        let currencyCode = await currencyDS.getCurrenciesCodesActivated()
        /**
         * addresses list unique = type+index or path
         *
         * @type {string} addresses['BTC'][0].path
         * @type {index} addresses[][].index // number in derivation
         * @type {string} addresses[][].type //main is 'main', others - to think
         * @type {string} addresses[][].address //save in db
         * @type {string} addresses[][].privateKey //do not save in db
         */
        let accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree: false, fromIndex : 0,  toIndex : 1, currencyCode })
        Log.daemon('DS/Account discoverAddresses finished')

        let prepare = []

        for (let code of currencyCode) {
            for(let account of accounts[code]) {
                prepare.push({
                    address: account.address,
                    name: '',
                    //TODO: fix this
                    derivation_path: account.path.replace(/[']/g, "quote"),
                    derivation_index: account.index,
                    derivation_type: account.type,
                    status: 0,
                    currency_code: code,
                    wallet_hash: walletHash,
                    account_json: '',
                    transactions_scan_time: 0
                })
            }
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

        let now = Math.round(new Date().getTime() / 1000) - 120 // 60 seconds before 0x
        let where = [`(account.transactions_scan_time IS NULL OR account.transactions_scan_time LIKE '%Z%' OR account.transactions_scan_time < ${now})`]

        if (params.derivation_type) {
            where.push(`account.derivation_type='${params.derivation_type}'`)
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

        let sql = ` 
            SELECT account.id, account.currency_code AS currencyCode, account.address,
            account.transactions_scan_time AS transactionsScanTime, account.wallet_hash AS walletHash
            FROM account 
            ${where}
            ORDER BY account.transactions_scan_time ASC
            LIMIT 20        `

        let res = []
        let logData = []
        try {

            res = await dbInterface.setQueryString(sql).query()
            if (res.array.length > 0) {
                for (let one of res.array) {
                    logData.push(one.currencyCode + ' ' + one.address)
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

        // where.push(`account.currency_code='ETH_ROPSTEN_KSU_TOKEN' `)
        // where.push(`account.address='0x103f8f95c7539A87968C2F5044c02c5A17066177'`)
        if (params.derivation_type) {
            where.push(`account.derivation_type='${params.derivation_type}'`)
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

        let sql = ` 
            SELECT account.id, account.currency_code AS currencyCode, account.address,
            account_balance.balance, account_balance.balance_scan_time AS balanceScanTime, account_balance.wallet_hash AS walletHash
            FROM account 
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            ${where}
            ORDER BY account_balance.balance_scan_time ASC
            LIMIT 20
        `
        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
            Log.daemon('DS/Account getAccountsForScan finished')
        } catch (e) {
            Log.daemon('DS/Account getAccountsForScan error ' + sql, e)
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

        const res = await dbInterface.setQueryString(`SELECT balance FROM account_balance WHERE account_balance.account_id = ${id}`).query()

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
