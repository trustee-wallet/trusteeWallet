import DBInterface from '../DB/DBInterface'

import Log from '../../../services/Log/Log'

const tableName = 'custom_currency'

export default {

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {Promise<void>}
     */
    updateCustomCurrency: async (data) => {

        Log.daemon('DS/CustomCurrency updateCustomCurrency called ', data)

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setUpdateData(data).update()

        Log.daemon('DS/CustomCurrency updateCustomCurrency finished')

    },

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

    getCustomCurrencies: async () => {

        Log.daemon('DS/CustomCurrency getCustomCurrencies called')

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM ${tableName}`).query()

        Log.daemon('DS/CustomCurrency getCustomCurrencies finished')

        return res

    }

}