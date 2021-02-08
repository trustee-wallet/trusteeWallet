/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

const tableName = 'custom_currency'

export default {

    /**
     *
     * @param data
     * @param {Array} data.insertObjs
     * @returns {Promise<void>}
     */
    insertCustomCurrency: async (data) => {

        Log.daemon('DS/CustomCurrency insertCustomCurrency called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.daemon('DS/CustomCurrency insertCustomCurrency finished')

    },

    savedCustomCurrenciesForApi : async (dataArray) => {
        const dbInterface = new DBInterface()
        const where = dataArray.join(', ')
        return dbInterface.setQueryString(` UPDATE  ${tableName} SET is_added_to_api = 1 WHERE (is_added_to_api IS NULL OR is_added_to_api=0) AND id IN (${where})`).query()
    },

    getCustomCurrenciesForApi : async () => {

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
                SELECT 
                id,
                currency_code AS currencyCode,
                currency_symbol AS currencySymbol,
                currency_name AS currencyName,
                token_type AS tokenType,
                token_address AS tokenAddress
                FROM ${tableName} WHERE (is_added_to_api IS NULL OR is_added_to_api=0)`).query()

        if (!res || !res.array || !res.array.length) return false

        return res.array
    },

    /**
     * @returns {Promise<[{id, isHidden, currencyCode, currencySymbol, currencyName, tokenType, tokenAddress, tokenDecimals, tokenJson}]>}
     */
    getCustomCurrencies: async () => {

        Log.daemon('DS/CustomCurrency getCustomCurrencies called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
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
                FROM ${tableName}`).query()

        Log.daemon('DS/CustomCurrency getCustomCurrencies finished')

        if (!res || !res.array || !res.array.length) return false

        return res.array

    }

}
