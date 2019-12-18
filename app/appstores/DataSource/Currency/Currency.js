import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'

const tableName = 'currency'
const tableNameHistory = 'currency_history'

const msIn24Hours = 86400000 // 1000*60*60*24

export default {

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {Promise<void>}
     */
    updateCurrency: async (data) => {

        Log.daemon('DS/Currency updateCurrency called ', data)

        const dbInterface = new DBInterface()

        let updated = await dbInterface.setTableName(tableName).setUpdateData(data).update()

        if (!updated || typeof (updated.res[0]) === 'undefined' || updated.res[0].rowsAffected === 0) {
            Log.err('DS/Currency updateCurrency error - no rows updated ' + JSON.stringify(data))
            return false
        } else if (updated.res[0].rowsAffected > 1) {
            Log.err('DS/Currency updateCurrency error - too much rows updated ' + updated.res[0].rowsAffected)
            return false
        }

        Log.daemon('DS/Currency updateCurrency finished')
        return true

    },

    /**
     *
     * @param data
     * @param {Array} data.insertObjs
     * @returns {Promise<void>}
     */
    insertCurrency: async (data) => {

        Log.daemon('DS/Currency insertCurrency called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.daemon('DS/Currency insertCurrency finished')

    },

    /**
     *
     * @param data
     * @param {Array} data.insertObjs
     * @returns {Promise<void>}
     */
    insertCurrencyHistory: async (data) => {

        Log.daemon('DS/Currency insertCurrencyHistory called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableNameHistory).setInsertData(data).insert()

        Log.daemon('DS/Currency insertCurrencyHistory finished')

    },

    getHistory : async () => {

        Log.daemon('DS/Currency getHistory called')

        const dbInterface = new DBInterface()

        let now = new Date().getTime()

        let tmp1 = now - msIn24Hours
        let tmp2 = tmp1 - msIn24Hours

        const res = await dbInterface.setQueryString(`
            SELECT MAX(currency_rate_usd) AS mx, MIN(currency_rate_usd) AS mn, currency_code FROM currency_history 
            WHERE currency_rate_scan_time>${tmp2} 
            AND currency_rate_scan_time<${tmp1}
            GROUP BY currency_code
        `).query()

        if (!res.array || !res.array.length) {
            Log.daemon('DS/Currency getHistory finished with empty result')
        }
        let prepared = {}
        for(let row of res.array) {
            prepared[row.currency_code] = (row.mx + row.mn) / 2
        }
        Log.daemon('DS/Currency getHistory finished')

        return prepared
    },

    /**
     * @namespace Flow.updateRates
     */
    getCurrencies: async () => {

        Log.daemon('DS/Currency getCurrencies called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM ${tableName}`).query()

        Log.daemon('DS/Currency getCurrencies finished')

        return res

    },

    getCurrenciesCodesActivated: async () => {

        Log.daemon('DS/Currency getCurrenciesCodesActivated called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT currency_code AS currencyCode FROM ${tableName}`).query()

        Log.daemon('DS/Currency getCurrenciesCodesActivated finished')

        if(!res || !res.array) {
            return BlocksoftDict.Codes
        }

        let data = []
        for(let row of res.array) {
            data.push(row.currencyCode)
        }
        return data

    },

    /**
     * @namespace Flow.updateRates
     */
    getCurrenciesForScanRates: async () => {

        Log.daemon('DS/Currency getCurrenciesForScanRates called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT currency_code AS currencyCode, currency_rate_scan_time AS currencyRateScanTime FROM ${tableName}`).query()

        Log.daemon('DS/Currency getCurrenciesForScanRates finished')

        return res && res.array ? res.array : false

    },

    /**
     * @namespace Flow.updateAccountBalance
     */
    getCurrencyBalanceAmount: async (walletHash) => {

        Log.daemon('DS/Currency getCurrencyBalanceAmount called')

        const dbInterface = new DBInterface()

        let res
        try {

            res = await dbInterface.setQueryString(`SELECT currency_code, sum(balance_fix) AS currencyBalanceAmount
            FROM account_balance
            WHERE wallet_hash = '${walletHash}'
            AND id IN (
                SELECT MIN(id) AS minId FROM account_balance  
                WHERE wallet_hash = '${walletHash}' 
                AND account_id IN (SELECT MIN(id) AS minId FROM account WHERE wallet_hash = '${walletHash}' GROUP BY currency_code, address)
                GROUP BY currency_code, account_id
            )
            GROUP BY currency_code`).query()

            if (!res || !res.array.length) {
                throw new Error('nothing summed')
            }

            for (let i = 0, ic = res.array.length; i <ic; i++) {
                let currencyBalanceAmount = res.array[i].currencyBalanceAmount
                res.array[i].currencyBalanceAmountOld = currencyBalanceAmount
                res.array[i].currencyBalanceAmount = BlocksoftUtils.fromENumber(currencyBalanceAmount)
            }

            Log.daemon('DS/Currency getCurrencyBalanceAmount finished')

        } catch (e) {
            let data = await dbInterface.setQueryString(`SELECT * FROM account_balance`).query()
            Log.daemon('account_balance', data)

            let data2 = await dbInterface.setQueryString(`SELECT * FROM account`).query()
            Log.daemon('account', data2)

            Log.daemon('DS/Currency getCurrencyBalanceAmount error (full data inside + account) ' + e.message)
        }
        return res
    }

}
