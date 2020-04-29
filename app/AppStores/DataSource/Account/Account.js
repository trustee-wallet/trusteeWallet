/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import currencyDS from '../Currency/Currency'

import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'

const tableName = 'account'
const SAVED_UNIQUE = {}

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
     * @returns {Promise<{id, address, derivationPath, derivationType, derivationIndex, currencyCode, walletHash, walletPubId}[]>}
     */
    discoverAccounts: async (params, source = 'BASIC') => {
        const dbInterface = new DBInterface()

        Log.daemon('DS/Account discoverAddresses called')
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
            if (!currencyCode) {
                currencyCode = []
                let index
                for (index in derivations) {
                    if (index === 'walletPubId') {
                        continue
                    }
                    if (derivations[index].length > 0) {
                        currencyCode.push(index)
                    }
                }
            }
        } else if (!currencyCode) {
            currencyCode = await currencyDS.getCurrenciesCodesActivated()
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
        const accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree, fromIndex, toIndex, currencyCode, walletHash: params.walletHash, derivations }, source)
        Log.daemon('DS/Account discoverAddresses actual accounts finished')

        const prepare = []
        const all = []
        let code, account

        const tmpName = dbInterface.escapeString('CREATED by ' + source + ' at ' + new Date().toISOString())

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

                let accountJson = ''
                if (typeof (account.addedData) !== 'undefined') {
                    accountJson = dbInterface.escapeString(JSON.stringify(account.addedData))
                }
                const tmp = {
                    address: account.address,
                    name: tmpName,
                    derivationPath: derivationPath,
                    derivationIndex: account.index,
                    derivationType: account.type,
                    alreadyShown: account.alreadyShown ? 1 : 0,
                    status: 0,
                    currencyCode: code,
                    walletHash: params.walletHash,
                    walletPubId: 0,
                    accountJson: accountJson,
                    transactionsScanTime: 0
                }
                if (typeof account.walletPubId !== 'undefined') {
                    tmp.walletPubId = account.walletPubId
                    params.walletPubId = tmp.walletPubId
                } else if (typeof params.walletPubId !== 'undefined') {
                    tmp.walletPubId = params.walletPubId
                }

                all.push(tmp)
                if (typeof (SAVED_UNIQUE[key]) === 'undefined') {
                    const findSql = `
                        SELECT
                            id, address, 
                            derivation_path AS derivationPath, 
                            derivation_type AS derivationType, 
                            derivation_index AS derivationIndex, 
                            currency_code AS currencyCode, 
                            wallet_hash AS walletHash, 
                            wallet_pub_id AS walletPubId
                        FROM ${tableName} 
                        WHERE currency_code='${code}' AND address='${account.address}'`

                    let find = await dbInterface.setQueryString(findSql).query()
                    if (find.array.length === 0) {
                        prepare.push(tmp)
                        Log.daemon('DS/Account insert accounts will add ' + account.address + ' index ' + account.index + ' pubId ' + tmp.walletPubId)
                        // noinspection ES6MissingAwait
                        BlocksoftKeysStorage.setAddressCache(key, account)
                    } else {
                        find = find.array[0]
                        if (account.walletPubId && find.walletPubId !== account.walletPubId) {
                            await dbInterface.setQueryString(`UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index}, wallet_pub_id=${account.walletPubId} WHERE id=${find.id}`).query()
                            Log.daemon('DS/Account insert accounts update walletPubId 1 ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else if (typeof params.walletPubId !== 'undefined' && find.walletPubId !== params.walletPubId) {
                            await dbInterface.setQueryString(`UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index}, wallet_pub_id=${params.walletPubId} WHERE id=${find.id}`).query()
                            Log.daemon('DS/Account insert accounts update walletPubId 2 ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else if (find.derivationIndex !== account.index || find.derivationType !== account.type) {
                            await dbInterface.setQueryString(`UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index} WHERE id=${find.id}`).query()
                            Log.daemon('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else {
                            Log.daemon('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        }
                    }
                    SAVED_UNIQUE[key] = 1
                } else {
                    Log.daemon('DS/Account insert account ' + key + ' not ok / already in cache')
                }
            }
        }

        if (!prepare || prepare.length === 0 || prepare === []) {
            Log.daemon('DS/Account insert accounts nothing to save')
            return all
        }

        Log.daemon('DS/Account insert accounts called ' + prepare.length)

        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: prepare }).insert()

        Log.daemon('DS/Account insert accounts finished')

        return prepare

    },

    insertAccountByPrivateKey: async (account) => {
        const dbInterface = new DBInterface()
        const derivationPath = dbInterface.escapeString(account.path)
        const key = BlocksoftKeysStorage.getAddressCacheKey(account.walletHash, derivationPath, account.currencyCode)
        if (!(typeof (SAVED_UNIQUE[key]) === 'undefined')) {
            Log.daemon('DS/Account insert account by privateKey already in cache')
            return false
        }
        const currencyCode = account.currencyCode === 'BTC_SEGWIT' ? 'BTC' : account.currencyCode
        const findSql = `
                SELECT
                    id, address,
                    derivation_path AS derivationPath,
                    derivation_type AS derivationType,
                    derivation_index AS derivationIndex,
                    currency_code AS currencyCode,
                    wallet_hash AS walletHash,
                    wallet_pub_id AS walletPubId
                    FROM ${tableName}
                    WHERE currency_code='${account.currencyCode}' AND address='${account.address}'`
        const find = await dbInterface.setQueryString(findSql).query()
        if (find.array.length !== 0) {
            SAVED_UNIQUE[key] = 1
            Log.daemon('DS/Account insert account by privateKey already in db ' + account.currencyCode + ' ' + account.address + ' index ' + account.index + ' find', find)
            return false
        }

        const tmp = {
            address: account.address,
            name: '',
            derivationPath: derivationPath,
            derivationIndex: account.index,
            derivationType: 'main',
            status: 0,
            currencyCode: currencyCode,
            walletHash: account.walletHash,
            transactionsScanTime: 0
        }
        await dbInterface.setTableName(tableName).setInsertData({ insertObjs: [tmp] }).insert()

        const find2 = await dbInterface.setQueryString(findSql).query()
        if (!find2 || find2.array.length === 0) {
            Log.log('!!!DS/Account insert account by privateKey not found after insert')
        } else {
            const tmp2 = {
                balanceFix: 0,
                balanceScanTime: 0,
                balanceScanLog: '',
                status: 0,
                currencyCode: currencyCode,
                walletHash: account.walletHash,
                accountId: find2.array[0].id
            }
            await dbInterface.setTableName('account_balance').setInsertData({ insertObjs: [tmp2] }).insert()
        }
        SAVED_UNIQUE[key] = 1
        Log.daemon('DS/Account insert account by privateKey add ' + account.address + ' index ' + account.index)
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
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @returns {Promise<{id, address, name, derivationType, derivationPath, currencyCode, walletHash, accountJson, alreadyShown}[]>}
     */
    getAccounts: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccounts called')

        let where = []

        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`account.currency_code='${params.currencyCode}'`)
        }
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `
        SELECT
            account.id, account.address, account.name,
            account.derivation_type AS derivationType,
            account.derivation_path AS derivationPath,
            account.currency_code AS currencyCode,
            account.wallet_hash AS walletHash,
            account.account_json AS accountJson,
            account.already_shown AS alreadyShown
        FROM account ${where}`

        let res = []
        try {
            res = await dbInterface.setQueryString(sql).query()
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('DS/Account getAccounts finished as empty')
                return false
            }
            res = res.array
            Log.daemon('DS/Account getAccounts finished')
        } catch (e) {
            Log.daemon('DS/Account getAccounts error ' + sql + ' ' + e.message)
        }
        return res
    },

    /**
     * @param {string} params.notAlreadyShown
     * @param {string} params.notWalletHashes[]
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.splitSegwit
     * @returns {Promise<{id, address, name, accountId, derivationType, derivationPath, currencyCode, walletHash, accountJson, balanceFix, balanceTxt, balanceProvider, balanceScanTime, balanceScanLog, alreadyShown}[]>}
     */
    getAccountData: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAccountData called')

        let where = [`account.derivation_type='main'`]

        if (typeof params.notAlreadyShown !== 'undefined' && params.notAlreadyShown && params.notAlreadyShown > 0) {
            where.push(`(account.already_shown IS NULL OR account.already_shown=0)`)
        }
        if (typeof params.notWalletHashes !== 'undefined' && params.notWalletHashes.length > 0) {
            where.push(`(account.wallet_hash NOT IN ('${params.notWalletHashes.join(`','`)}') OR account.currency_code != 'BTC' OR (account.already_shown IS NULL OR account.already_shown=0)) ` )
        }
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`account.currency_code='${params.currencyCode}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `SELECT
            account.id, account.address, account.name,
            account_balance.account_id AS accountId,
            account.derivation_type AS derivationType,
            account.derivation_path AS derivationPath,
            account.currency_code AS currencyCode,
            account.wallet_hash AS walletHash,
            account.account_json AS accountJson,
            account_balance.balance_fix AS balanceFix,
            account_balance.balance_txt AS balanceTxt,
            account_balance.unconfirmed_fix AS unconfirmedFix,
            account_balance.unconfirmed_txt AS unconfirmedTxt,
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_log AS balanceScanLog,
            account.already_shown AS alreadyShown
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

        const uniqueAddresses = {}
        const idsToRemove = []
        if (typeof params.splitSegwit !== 'undefined' && params.splitSegwit) {
            const segwit = []
            const legacy = []
            for (account of res.array) {
                if (typeof uniqueAddresses[account.currencyCode] === 'undefined') {
                    uniqueAddresses[account.currencyCode] = {}
                } else if (typeof (uniqueAddresses[account.currencyCode][account.address]) !== 'undefined') {
                    Log.daemon('DS/Account getAccountData unique check will remove ', account)
                    idsToRemove.push(account.id)
                    continue
                }
                uniqueAddresses[account.currencyCode][account.address] = 1
                account.balance = BlocksoftFixBalance(account, 'balance')
                account.unconfirmed = BlocksoftFixBalance(account, 'unconfirmed')
                account.balanceProvider = account.balanceProvider || 'old'
                accounts.push(account)
                if (account.derivationPath.indexOf('m/84') === 0) {
                    segwit.push(account)
                } else {
                    legacy.push(account)
                }
            }
            accounts.segwit = segwit
            accounts.legacy = legacy
        } else {
            for (account of res.array) {
                if (typeof uniqueAddresses[account.currencyCode] === 'undefined') {
                    uniqueAddresses[account.currencyCode] = {}
                } else if (typeof (uniqueAddresses[account.currencyCode][account.address]) !== 'undefined') {
                    Log.daemon('DS/Account getAccountData unique check will remove ', account)
                    idsToRemove.push(account.id)
                    continue
                }
                uniqueAddresses[account.currencyCode][account.address] = 1
                account.balance = BlocksoftFixBalance(account, 'balance')
                account.unconfirmed = BlocksoftFixBalance(account, 'unconfirmed')
                account.balanceProvider = account.balanceProvider || 'old'
                accounts.push(account)
            }
        }

        if (idsToRemove.length > 0) {
            Log.daemon('DS/Account getAccountData unique check finished, found ' + idsToRemove.join(','))
            await dbInterface.setQueryString(`DELETE FROM account WHERE id IN (${idsToRemove.join(',')})`).query()
            await dbInterface.setQueryString(`DELETE FROM account_balance WHERE account_id IN (${idsToRemove.join(',')})`).query()
        }

        Log.daemon('DS/Account getAccountData finished')

        return accounts
    },

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     */
    getAddressesList: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('DS/Account getAddressesList called')

        let where = [`account.derivation_type='main'`]
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`account.currency_code='${params.currencyCode}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `SELECT
            account.id, account.address,
            account.already_shown AS alreadyShown,
            account.derivation_index AS derivationIndex
            FROM account
            ${where}
        `

        const res = await dbInterface.setQueryString(sql).query()

        if (!res || !res.array || !res.array.length) {
            return []
        }

        Log.daemon('DS/Account getAddressesList finished')

        return res.array
    },

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @param {Object} account
     * @param {string} account.id
     * @param {string} account.currencyCode
     * @param {string} account.walletHash
     * @return {Promise<void>}
     */
    updateAccount: async (data, account = false) => {

        Log.daemon('DS/Account updateAccount called', data)

        const dbInterface = new DBInterface()

        if (typeof data.updateObj.transactionsScanLog !== 'undefined') {
            data.updateObj.transactionsScanLog = dbInterface.escapeString(data.updateObj.transactionsScanLog)
        }

        if (typeof account !== 'undefined') {
            data.key = { id: account.id }
        }

        await (dbInterface.setTableName(tableName).setUpdateData(data)).update()

        Log.daemon('DS/Account updateAccount finished')

    },

    /**
     * @param {string} where
     * @param {string} update
     * @return {Promise<void>}
     */
    massUpdateAccount: async (where, update) => {

        Log.daemon('DS/Account massUpdateAccount called ' + update + ' where ' + where)

        const dbInterface = new DBInterface()

        const sql = `UPDATE ${tableName} SET ${update} WHERE (${where})`

        await dbInterface.setQueryString(sql).query()

        Log.daemon('DS/Account massUpdateAccount finished')

    }

}
