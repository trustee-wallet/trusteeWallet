/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'

export default {

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {boolean} params.force
     * @return {Promise<{id, currencyCode, address, transactionsScanTime, transactionsScanLog, balance, balanceFix, balanceTxt, balanceProvider, balanceScanTime, balanceScanLog, accountJson}[]>}
     */
    getAccountsForScan: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('AccountScanning getAccountsForScan called')

        let where = []
        //where.push(`account.currency_code='ETH_UAX'`)

        if (typeof params.force === 'undefined' || !params.force) {
            const now = Math.round(new Date().getTime() / 1000) - 30 // 1 minute before
            where.push(`(account_balance.balance_scan_time IS NULL OR account_balance.balance_scan_time < ${now} OR account.transactions_scan_time IS NULL OR account.transactions_scan_time < ${now})`)
        }
        where.push(`currency.is_hidden=0`)
        where.push(`(account.currency_code!='BTC' OR wallet.wallet_is_hd NOT IN (1, '1') OR wallet.wallet_is_hd IS NULL)`)
        if (params.walletHash) {
            where.push(`account.wallet_hash='${params.walletHash}'`)
        }
        if (typeof params.currencyCode !== 'undefined' && params.currencyCode) {
            where.push(`account.currency_code='${params.currencyCode}'`)
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
            account.address, 
             
            account.transactions_scan_time AS transactionsScanTime, 
            account.transactions_scan_log AS transactionsScanLog,
            
            account_balance.balance_fix AS balanceFix, 
            account_balance.balance_txt AS balanceTxt,
            account_balance.unconfirmed_fix AS unconfirmedFix, 
            account_balance.unconfirmed_txt AS unconfirmedTxt,
            
            account_balance.balance_provider AS balanceProvider,
            account_balance.balance_scan_time AS balanceScanTime,
            account_balance.balance_scan_log AS balanceScanLog,
            
            account.account_json AS accountJson
            FROM account 
            LEFT JOIN account_balance ON account_balance.account_id=account.id
            LEFT JOIN currency ON currency.currency_code=account.currency_code
            LEFT JOIN wallet ON wallet.wallet_hash=account.wallet_hash
            ${where}
            ORDER BY account_balance.balance_scan_time ASC
            LIMIT 10
        `
        let res = []
        const uniqueAddresses = {}
        const idsToRemove = []
        Log.daemon('AccountScanning getAccountsForScan SQL ', sql)
        try {
            res = await dbInterface.setQueryString(sql).query()
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('AccountScanning getAccountsForScan finished as empty')
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                const key = res[i].address + '_' + res[i].currencyCode
                if (typeof uniqueAddresses[key] !== 'undefined') {
                    idsToRemove.push(res[i].id)
                    continue
                }
                uniqueAddresses[key] = 1
                res[i].balance = BlocksoftFixBalance(res[i], 'balance')
                res[i].unconfirmed = BlocksoftFixBalance(res[i], 'unconfirmed')
                if (!res[i].accountJson || res[i].accountJson === 'false') continue

                const string = dbInterface.unEscapeString(res[i].accountJson)
                try {
                    Log.daemon('AccountScanning getAccountsForScan will parse ' + string)
                    res[i].accountJson = JSON.parse(string)
                } catch (e) {
                    // noinspection ES6MissingAwait
                    Log.errDaemon('AccountScanning getAccountsForScan json error ' + string + ' ' + e.message)
                }
            }
            if (idsToRemove.length > 0) {
                await dbInterface.setQueryString(`DELETE FROM account WHERE id IN (${idsToRemove.join(',')})`).query()
                await dbInterface.setQueryString(`DELETE FROM account_balance WHERE account_id IN (${idsToRemove.join(',')})`).query()
            }
            Log.daemon('AccountScanning getAccountsForScan finished')
        } catch (e) {
            Log.daemon('AccountScanning getAccountsForScan error ' + sql + ' ' + e.message)
        }
        return res
    },

    getAddresses: async (params) => {

        const dbInterface = new DBInterface()

        Log.daemon('AccountScanning getAddresses called')

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
            account.id, 
            account.currency_code AS currencyCode,  
            account.wallet_hash AS walletHash,
            account.already_shown AS alreadyShown,
            account.address
            FROM account          
            ${where}
        `


        const indexedRes = {}
        try {
            let res = await dbInterface.setQueryString(sql).query()
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('AccountScanning getAddresses finished as empty')
                return false
            }
            res = res.array
            let tmp
            for (tmp of res) {
                indexedRes[tmp.address] = tmp.alreadyShown
            }
            Log.daemon('AccountScanning getAddresses inished')
        } catch (e) {
            Log.daemon('AccountScanning getAddresses error ' + sql + ' ' + e.message)
        }
        return indexedRes
    }
}


