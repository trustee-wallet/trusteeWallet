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
                token_json AS tokenJson
                FROM ${tableName}`).query()

        Log.daemon('DS/CustomCurrency getCustomCurrencies finished')

        if (!res || !res.array || !res.array.length) return false

        return res.array

    }

}
