/**
 * @version 0.41
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '@app/services/Log/Log'

const tableName = 'custom_currency'

let CACHE_FOR_API = []

export default {

    /**
     *
     * @param data
     * @param {Array} data.insertObjs
     * @returns {Promise<void>}
     */
    insertCustomCurrency: async (data) => {
        Log.daemon('DS/CustomCurrency insertCustomCurrency called')
        await Database.setTableName(tableName).setInsertData(data).insert()
        Log.daemon('DS/CustomCurrency insertCustomCurrency finished')
    },

    savedCustomCurrenciesForApi : async (dataArray) => {
        const where = dataArray.join(', ')
        await Database.query(` UPDATE  ${tableName} SET is_added_to_api = 1 WHERE (is_added_to_api IS NULL OR is_added_to_api=0) AND id IN (${where})`)
        CACHE_FOR_API = []
        return true
    },

    getCustomCurrenciesForApi : async () => {
        return CACHE_FOR_API
    },

    /**
     * only on init
     * @returns {Promise<[{id, isHidden, currencyCode, currencySymbol, currencyName, tokenType, tokenAddress, tokenDecimals, tokenJson}]>}
     */
    getCustomCurrencies: async () => {
        const res = await Database.query(`
                SELECT
                id, is_hidden AS isHidden,
                currency_code AS currencyCode,
                currency_symbol AS currencySymbol,
                currency_name AS currencyName,

                token_type AS tokenType,
                token_address AS tokenAddress,
                token_decimals AS tokenDecimals,
                token_json AS tokenJson,
                is_added_to_api AS isAdded
                FROM ${tableName}`)

        CACHE_FOR_API = []
        if (!res || !res.array || !res.array.length) {
            return false
        }
        for (const row of res.array) {
            if (!row.isAdded) {
                CACHE_FOR_API.push[row]
            }
        }
        return res.array
    }

}
