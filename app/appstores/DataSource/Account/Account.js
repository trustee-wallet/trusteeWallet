/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import currencyDS from '../Currency/Currency'

import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'

const tableName = 'account'
let SAVED_UNIQUE = {}

class Account {

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
     * @returns {Promise<{accounts : {id, address, derivationPath, derivationType, derivationIndex, currencyCode, walletHash, walletPubId}[], newSaved}>}
     */
    discoverAccounts = async (params, source = 'BASIC') => {
        Log.daemon('DS/Account discoverAddresses called')
        let mnemonic
        if (typeof params.mnemonic === 'undefined' || !params.mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash, 'Account.discoverAccounts')
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
        let derivations = { 'BTC': [], 'BTC_SEGWIT': [], 'BTC_SEGWIT_COMPATIBLE' : [] }

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

        const tmpName = Database.escapeString('CREATED by ' + source + ' at ' + new Date().toISOString())

        for (code of currencyCode) {
            if (typeof accounts[code] === 'undefined') {
                throw new Error('DS/Account discoverAddresses NO ACCOUNTS FOR ' + code)
            }
            const keyCode = code
            const tmp = accounts[code]
            if (code === 'BTC_SEGWIT' || code === 'BTC_SEGWIT_COMPATIBLE') {
                code = 'BTC'
            }
            Log.daemon('DS/Account discoverAddresses ' + source + ' accounts ' + code + ' length ' + tmp.length + ' fromIndex ' + fromIndex + ' firstAddress ' + tmp[0].address + ' ' + tmp[0].path + ' index ' + tmp[0].index)
            for (account of tmp) {
                const derivationPath = Database.escapeString(account.path)
                const key = BlocksoftKeysStorage.getAddressCacheKey(params.walletHash, derivationPath, keyCode)

                let accountJson = ''
                if (typeof (account.addedData) !== 'undefined') {
                    accountJson = Database.escapeString(JSON.stringify(account.addedData))
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

                    let find = await Database.setQueryString(findSql).query()
                    if (find.array.length === 0) {
                        prepare.push(tmp)
                        Log.daemon('DS/Account insert accounts will add ' + code + ' ' + account.address + ' index ' + account.index + ' pubId ' + tmp.walletPubId)
                        // noinspection ES6MissingAwait
                        BlocksoftKeysStorage.setAddressCache(key, account)
                    } else {
                        find = find.array[0]
                        if (account.walletPubId && find.walletPubId !== account.walletPubId) {
                            const sql5 = `UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index}, wallet_pub_id=${account.walletPubId} WHERE id=${find.id}`
                            Log.daemon(sql5)
                            await Database.setQueryString(sql5).query()
                            Log.daemon('DS/Account insert accounts update walletPubId 1 ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else if (typeof params.walletPubId !== 'undefined' && find.walletPubId !== params.walletPubId) {
                            const sql5 = `UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index}, wallet_pub_id=${params.walletPubId} WHERE id=${find.id}`
                            Log.daemon(sql5)
                            await Database.setQueryString(sql5).query()
                            Log.daemon('DS/Account insert accounts update walletPubId 2 ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update walletPubId ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else if (find.derivationIndex !== account.index || find.derivationType !== account.type) {
                            const sql5 = `UPDATE ${tableName} SET derivation_type='${account.type}', derivation_index=${account.index} WHERE id=${find.id}`
                            Log.daemon(sql5)
                            await Database.setQueryString(sql5).query()
                            Log.daemon('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                            // Log.daemon('DS/Account insert accounts update type/index ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        } else {
                            Log.daemon('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find, account)
                            // Log.daemon('!!!!!!!!!!!!DS/Account insert accounts not ok / already in db ' + code + ' ' + account.address + ' index ' + account.index + ' find', find)
                        }
                    }
                    SAVED_UNIQUE[key] = 1
                } else {
                    Log.daemon('DS/Account insert account ' + key + ' not ok / already in cache', SAVED_UNIQUE[key])
                }
            }
        }

        if (!prepare || prepare.length === 0 || prepare === []) {
            Log.daemon('DS/Account insert accounts nothing to save')
            return {accounts : all, newSaved: 0}
        }

        Log.daemon('DS/Account insert accounts called ' + prepare.length)

        await Database.setTableName(tableName).setInsertData({ insertObjs: prepare }).insert()

        if (prepare && prepare.length > 0) {
            for (account of prepare) {
                const code = account.currency_code || account.currencyCode
                Log.daemon('DS/Account insert accounts recheck called ' + code + ' ' + account.address + ' rechecking ')
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
                        WHERE currency_code='${account.currency_code}' AND address='${account.address}'`

                const find = await Database.setQueryString(findSql).query()
                if (!find || !find.array || !find.array.length) {
                    Log.daemon('DS/Account insert accounts recheck called ' + code + ' ' + account.address + ' not found')
                    SAVED_UNIQUE = {}
                } else {
                    Log.daemon('DS/Account insert accounts recheck called ' + code + ' ' + account.address + ' found')
                }
            }
        }

        Log.daemon('DS/Account insert accounts finished')

        return {accounts : prepare, newSaved: prepare.length}

    }

    insertAccountByPrivateKey = async (account) => {
        const derivationPath = Database.escapeString(account.derivationPath)
        const tmpName = Database.escapeString('CREATED by InsertByPrivateKey at ' + new Date().toISOString())

        const key = BlocksoftKeysStorage.getAddressCacheKey(account.walletHash, derivationPath, account.currencyCode)
        if (!(typeof (SAVED_UNIQUE[key]) === 'undefined')) {
            Log.daemon('DS/Account insert account by privateKey already in cache')
            return false
        }
        let currencyCode =  account.currencyCode
        if (account.currencyCode === 'BTC_SEGWIT' || account.currencyCode === 'BTC_SEGWIT_COMPATIBLE') {
            currencyCode = 'BTC'
        }
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
                    WHERE currency_code IN ('${currencyCode}', '${account.currencyCode}') AND address='${account.address}'`
        const find = await Database.setQueryString(findSql).query()
        if (find.array.length !== 0) {
            if (find.array[0].walletHash !== account.walletHash) {
                await Database.setQueryString(`UPDATE ${tableName} SET wallet_hash='${account.walletHash}' WHERE id=${find.array[0].id}`).query()
            }
            if (find.array[0].currencyCode !== currencyCode) {
                await Database.setQueryString(`UPDATE ${tableName} SET currency_code='${currencyCode}' WHERE id=${find.array[0].id}`).query()
            }
            SAVED_UNIQUE[key] = 1
            Log.daemon('DS/Account insert account by privateKey already in db ' + account.currencyCode + ' ' + account.address + ' index ' + account.index + ' find', find)
            return false
        }

        const tmp = {
            address: account.address,
            name: tmpName,
            derivationPath: derivationPath,
            derivationIndex: account.index,
            derivationType: 'main',
            status: 0,
            currencyCode: currencyCode,
            walletHash: account.walletHash,
            transactionsScanTime: 0
        }
        await Database.setTableName(tableName).setInsertData({ insertObjs: [tmp] }).insert()

        const find2 = await Database.setQueryString(findSql).query()
        if (!find2 || find2.array.length === 0) {
            Log.log('!!!DS/Account insert account by privateKey not found after insert error ' + findSql, tmp)
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
            await Database.setTableName('account_balance').setInsertData({ insertObjs: [tmp2] }).insert()
            SAVED_UNIQUE[key] = 1
        }
        Log.daemon('DS/Account insert account by privateKey add ' + account.address + ' index ' + account.index)
    }


    /**
     * @param {string} params.walletHash
     * @returns {Promise<void>}
     */
    clearAccounts = async (params) => {
        Log.daemon('DS/Account clear accounts called ' + params.walletHash)

        await Database.setQueryString(`DELETE FROM account WHERE wallet_hash='${params.walletHash}'`).query()

        await Database.setQueryString(`DELETE FROM account_balance WHERE wallet_hash='${params.walletHash}'`).query()

        Log.daemon('DS/Account clear accounts finished ' + params.walletHash)
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @returns {Promise<{id, address, name, derivationType, derivationPath, currencyCode, walletHash, accountJson, alreadyShown}[]>}
     */
    getAccounts = async (params) => {
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
            res = await Database.setQueryString(sql).query()
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('DS/Account getAccounts finished as empty')
                return false
            }
            res = res.array
        } catch (e) {
            Log.daemon('DS/Account getAccounts error ' + sql + ' ' + e.message)
        }
        return res
    }

    /**
     * @param {string} params.notAlreadyShown
     * @param {string} params.notWalletHashes[]
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.splitSegwit
     * @param {string} params.derivationPath
     * @returns {Promise<{id, address, name, accountId, derivationType, derivationPath, currencyCode, walletHash, accountJson, balanceFix, balanceTxt, balanceProvider, balanceScanTime, balanceScanLog, alreadyShown}[]>}
     */
    getAccountData = async (params) => {
        let where = [`account.derivation_type='main'`]

        if (typeof params.notAlreadyShown !== 'undefined' && params.notAlreadyShown && params.notAlreadyShown > 0) {
            where.push(`(account.already_shown IS NULL OR account.already_shown=0)`)
        }
        if (typeof params.notWalletHashes !== 'undefined' && params.notWalletHashes.length > 0) {
            where.push(`(account.wallet_hash NOT IN ('${params.notWalletHashes.join(`','`)}') OR account.currency_code != 'BTC' OR (account.already_shown IS NULL OR account.already_shown=0)) ` )
        }
        if (typeof params.derivationPath !== 'undefined' && params.derivationPath) {
            where.push(`account.derivation_path='${params.derivationPath}'`)
        }
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (params.currencyCode) {
            where.push(`account.currency_code='${params.currencyCode}'`)
        }
        if (params.address) {
            where.push(`account.address='${params.address}'`)
        }
        where.push(`account.is_main=1`)

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
            account_balance.balance_scan_error AS balanceScanError,
            account_balance.balance_scan_log AS balanceScanLog,
            account.already_shown AS alreadyShown,
            account.is_main AS isMain
            FROM account
            LEFT JOIN account_balance ON account_balance.account_id = account.id
            ${where}
            ORDER BY account.id
        `

        const res = await Database.setQueryString(sql).query()

        if (!res || !res.array || !res.array.length) {
            return []
        }

        const accounts = []
        let account

        const uniqueAddresses = {}
        const idsToRemove = []
        try {
            if (typeof params.splitSegwit !== 'undefined' && params.splitSegwit) {
                const segwit = []
                const legacy = []
                for (account of res.array) {
                    account = this._prepAccount(account)
                    const key = account.currencyCode + '_' + account.walletHash
                    if (typeof uniqueAddresses[key] === 'undefined') {
                        uniqueAddresses[key] = { 1: 1 }
                    } else if (typeof (uniqueAddresses[key][account.address]) !== 'undefined') {
                        Log.daemon('DS/Account getAccountData ' + key + ' unique check 1 will remove', {
                            account,
                            inDb: uniqueAddresses[key]
                        })
                        idsToRemove.push(account.id)
                        continue
                    }
                    uniqueAddresses[key][account.address] = 1
                    account.balance = BlocksoftFixBalance(account, 'balance')
                    account.unconfirmed = BlocksoftFixBalance(account, 'unconfirmed')
                    account.balanceProvider = account.balanceProvider || 'old'
                    accounts.push(account)
                    const first = account.address.substr(0,1)
                    if (first === 'b') {
                        segwit.push(account)
                    } else if (first === '1') {
                        legacy.push(account)
                    }
                    // no compatible !!!!
                }
                accounts.segwit = segwit
                accounts.legacy = legacy
            } else {
                for (account of res.array) {
                    account = this._prepAccount(account)
                    const key = account.currencyCode + '_' + account.walletHash
                    if (typeof uniqueAddresses[key] === 'undefined') {
                        uniqueAddresses[key] = { 1: 1 }
                    } else if (typeof uniqueAddresses[key][account.address] !== 'undefined') {
                        Log.daemon('DS/Account getAccountData  ' + key + ' unique check 2 will remove', {
                            account,
                            inDb: uniqueAddresses[key]
                        })
                        await Database.setQueryString(`UPDATE transactions SET account_id=${uniqueAddresses[key][account.address]} WHERE account_id=${account.id}`).query()
                        idsToRemove.push(account.id)
                        continue
                    }
                    uniqueAddresses[key][account.address] = account.id
                    account.balance = BlocksoftFixBalance(account, 'balance')
                    account.unconfirmed = BlocksoftFixBalance(account, 'unconfirmed')
                    account.balanceProvider = account.balanceProvider || 'old'
                    accounts.push(account)
                }
            }
        } catch (e) {
            e.message = ' onAccountSelect ' + e.message
            throw e
        }

        if (idsToRemove.length > 0) {
            Log.daemon('DS/Account getAccountData unique check finished, found ' + idsToRemove.join(','))
            Log.daemon('DS/Account getAccountData should not removed', uniqueAddresses)
            await Database.setQueryString(`DELETE FROM account WHERE id IN (${idsToRemove.join(',')})`).query()
            await Database.setQueryString(`DELETE FROM account_balance WHERE account_id IN (${idsToRemove.join(',')})`).query()
        }

        return accounts
    }

    _prepAccount = (account) => {
        if (typeof account.accountJson !== 'undefined' && typeof account.accountJson !== 'object') {
            if (!account.accountJson || account.accountJson === 'false') {
                account.accountJson = false
            } else {
                try {
                    const tmp = JSON.parse(account.accountJson)
                    account.accountJson = tmp
                } catch (e) {
                    // do nothing
                }
            }
        }
        return account
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     */
    getAddressesList = async (params) => {
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

        const res = await Database.setQueryString(sql).query()

        if (!res || !res.array || !res.array.length) {
            return []
        }

        return res.array
    }

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
    updateAccount = async (data, account = false) => {
        if (typeof data.updateObj.transactionsScanLog !== 'undefined') {
            if (data.updateObj.transactionsScanLog.length > 1000) {
                data.updateObj.transactionsScanLog = data.updateObj.transactionsScanLog.substr(0, 1000)
            }
            data.updateObj.transactionsScanLog = Database.escapeString(data.updateObj.transactionsScanLog)
        }

        if (typeof account !== 'undefined') {
            data.key = { id: account.id }
        }

        await (Database.setTableName(tableName).setUpdateData(data)).update()

    }

    /**
     * @param {string} where
     * @param {string} update
     * @return {Promise<void>}
     */
    massUpdateAccount = async (where, update) => {
        const sql = `UPDATE ${tableName} SET ${update} WHERE (${where})`

        await Database.setQueryString(sql).query()
    }

}

export default new Account()
