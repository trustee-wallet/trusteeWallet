/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '@app/services/Log/Log'
import BlocksoftFixBalance from '@crypto/common/BlocksoftFixBalance'
import store from '@app/store'

class AccountScanning {

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.currencyFamily
     * @param {boolean} params.force
     * @return {Promise<{id, currencyCode, address, transactionsScanTime, transactionsScanLog, balance, balanceFix, balanceTxt, balanceProvider, balanceScanTime, balanceScanLog, accountJson}[]>}
     */
    async getAccountsForScan (params) {
        let where = []
        let limit = 3

        if (typeof params.force === 'undefined' || !params.force) {
            const now = Math.round(new Date().getTime() / 1000) - 30 // 1 minute before
            where.push(`(account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time < ${now} OR account.transactions_scan_time IS NULL OR account.transactions_scan_time < ${now})`)
        } else {
            limit = 20
        }
        where.push(`account.derivation_type!='no_scan'`)
        if (typeof params.currencyCode !== 'undefined' && params.currencyCode) {
            where.push(`account.currency_code IN ('${params.currencyCode}')`)
            where.push(`account.is_main=1`)
            limit = 10
            if (params.currencyCode === 'BTC') {
                where.push(`(account.derivation_path = 'm/49quote/0quote/0/1/0' OR wallet.wallet_hash NOT IN (SELECT wallet_hash FROM wallet_pub))`)
            }
        } else {
            const currencies = store.getState().currencyStore.cryptoCurrencies
            const codes = []
            for (const tmp of currencies) {
                if (!tmp.maskedHidden) {
                    codes.push(`'${tmp.currencyCode}'`)
                }
            }
            where.push('account.currency_code IN ('  + codes.join(',') + ')')
            where.push(`(account.currency_code!='BTC' OR account.derivation_path = 'm/49quote/0quote/0/1/0' OR wallet.wallet_hash NOT IN (SELECT wallet_hash FROM wallet_pub))`)
        }
        if (typeof params.currencyFamily !== 'undefined' && params.currencyFamily) {
            where.push(`(account.currency_code LIKE '${params.currencyFamily}_%' OR account.currency_code='${params.currencyFamily}')`)
            limit = 20
        }
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
            if (limit === 2) {
                const countNotSync = await Database.query(`SELECT COUNT(*) AS cn
                 FROM account_balance
                 LEFT JOIN currency ON currency.currency_code=account_balance.currency_code
                 WHERE account_balance.wallet_hash='${params.walletHash}' AND (account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time=0)
                 AND currency.is_hidden=0`)
                if (countNotSync && countNotSync.array && typeof countNotSync.array[0] !== 'undefined' && typeof countNotSync.array[0].cn !== 'undefined') {
                    if (countNotSync.array[0].cn > 1) {
                        where.push(`(account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time =0 )`)
                        limit = 20
                    }
                }
            }
        }


        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }
        const sql = `
            SELECT
            account.id,
            account.currency_code AS currencyCode,
            account.wallet_hash AS walletHash,
            wallet.wallet_is_hd AS walletIsHd,
            account.address,
            account.derivation_path AS derivationPath,
            account.derivation_index AS derivationIndex,
            account.transactions_scan_time AS transactionsScanTime,
            account.transactions_scan_log AS transactionsScanLog,

            account_balance.balance_fix AS balanceFix,
            account_balance.balance_txt AS balanceTxt,
            account_balance.unconfirmed_fix AS unconfirmedFix,
            account_balance.unconfirmed_txt AS unconfirmedTxt,
            account_balance.balance_staked_txt AS balanceStaked,

            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_error AS balanceScanError,
            account_balance.balance_scan_log AS balanceScanLog,
            account_balance.balance_scan_block AS balanceScanBlock,

            account.account_json AS accountJson,
            currency.is_hidden AS isHidden
            FROM account
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            LEFT JOIN currency ON currency.currency_code=account.currency_code
            LEFT JOIN wallet ON wallet.wallet_hash=account.wallet_hash
            ${where}
            ORDER BY account_balance.balance_scan_time ASC, account.currency_code ASC
            LIMIT ${limit}
        `

        let res = []
        const uniqueAddresses = {}
        const idsToRemove = []
        try {
            res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                const currencyCode = res[i].currencyCode
                if (limit === 2 && (typeof params.currencyFamily === 'undefined' || !params.currencyFamily)) {
                    if (currencyCode === 'TRX' || currencyCode.indexOf('TRX_') === 0) {
                        params.currencyFamily = 'TRX'
                        return await this.getAccountsForScan(params)
                    } else if ((currencyCode === 'ETH' || currencyCode.indexOf('ETH_') === 0) && currencyCode !== 'ETH_ROPSTEN' && currencyCode !== 'ETH_RINKEBY' && currencyCode !== 'ETH_UAX') {
                        params.currencyFamily = 'ETH'
                        return await this.getAccountsForScan(params)
                    } else if (currencyCode === 'SOL' || currencyCode.indexOf('SOL_') === 0 ) {
                        params.currencyFamily = 'SOL'
                        return await this.getAccountsForScan(params)
                    }
                }
                const key = res[i].address + '_' + currencyCode
                if (typeof uniqueAddresses[key] !== 'undefined') {
                    await Database.query(`UPDATE transactions SET account_id=${uniqueAddresses[key]} WHERE account_id=${res[i].id}`)
                    idsToRemove.push(res[i].id)
                    continue
                }
                uniqueAddresses[key] = res[i].id

                res[i].balance = BlocksoftFixBalance(res[i], 'balance')
                res[i].unconfirmed = BlocksoftFixBalance(res[i], 'unconfirmed')
                res[i].balanceScanBlock = typeof res[i].balanceScanBlock !== 'undefined' ? (res[i].balanceScanBlock * 1) : 0
                res[i].balanceScanLog = res[i].balanceScanLog || ''
                res[i].walletIsHd = res[i].walletIsHd || false
                if (!res[i].accountJson || res[i].accountJson === 'false') continue

                const string = Database.unEscapeString(res[i].accountJson)
                try {
                    res[i].accountJson = JSON.parse(string)
                } catch (e) {
                    // noinspection ES6MissingAwait
                    Log.errDaemon('AccountScanning getAccountsForScan json error ' + res[i].id + ' ' + e.message)
                }
            }
            if (idsToRemove.length > 0) {
                Log.daemon('AccountScanning getAccountsForScan not removed', uniqueAddresses)

                await Database.query(`DELETE FROM account WHERE id IN (${idsToRemove.join(',')})`)
                await Database.query(`DELETE FROM account_balance WHERE account_id IN (${idsToRemove.join(',')})`)
            }
        } catch (e) {
            Log.daemon('AccountScanning getAccountsForScan error ' + e.message, sql)
        }
        return res
    }

    async getAddresses (params) {
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
        `

        const indexedRes = {}
        try {
            let res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
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
            Log.daemon('AccountScanning getAddresses error ' + sql + ' ' + e.message)
        }
        return indexedRes
    }

}

export default new AccountScanning()


