import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'

const tableName = 'currency'

export default {

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {Promise<void>}
     */
    updateCurrency: async (data) => {

        Log.daemon('DS/Currency updateCurrency called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setUpdateData(data).update()

        Log.daemon('DS/Currency updateCurrency finished')

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
            res = await dbInterface.setQueryString(`SELECT currency_code, sum(balance) AS currencyBalanceAmount FROM account_balance WHERE wallet_hash = '${walletHash}' GROUP BY currency_code`).query()

            if (!res || !res.array.length) {
                throw new Error('nothing summed')
            }

            Log.daemon('DS/Currency getCurrencyBalanceAmount finished')
        } catch (e) {
            let data = await dbInterface.setQueryString(`SELECT currency_code, balance FROM account_balance WHERE wallet_hash = '${walletHash}'`).query()
            Log.errDaemon('DS/Currency getCurrencyBalanceAmount error (full data inside)', e, data)
        }

        return res
    }

}
