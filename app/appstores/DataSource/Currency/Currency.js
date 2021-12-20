/**
 * @version 0.41
 */
import Database from '@app/appstores/DataSource/Database';

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
        const updateObj = {...data.updateObj} // as currencyRateJson escaping is breaking all other features if go upper
        if (typeof updateObj.currencyRateJson !== 'undefined') {
            if (typeof updateObj.currencyRateJson !== 'string') {
                updateObj.currencyRateJson = Database.escapeString(JSON.stringify(updateObj.currencyRateJson))
            }
        }
        const updated = await Database.setTableName(tableName).setUpdateData({ updateObj, key: data.key}).update()

        if (!updated || typeof updated.res === 'undefined' || typeof updated.res[0] === 'undefined') {
            Log.err('DS/Currency updateCurrency error - no rows updated ' + JSON.stringify(data))
            return false
        } else if (updated.res[0].rowsAffected === 0) {
            Log.err('DS/Currency updateCurrency error - no rows updated ' + JSON.stringify(data))
            return true // not break others
        } else if (updated.res[0].rowsAffected > 1) {
            Log.err('DS/Currency updateCurrency error - too much rows updated ' + updated.res[0].rowsAffected)
            return true
        }

        return true

    },

    /**
     *
     * @param data
     * @param {Array} data.insertObjs
     * @returns {Promise<void>}
     */
    insertCurrency: async (data) => {
        try {
            await Database.setTableName(tableName).setInsertData(data).insert()
        } catch (e) {
            // do nothing
        }
    },

    /**
     * @namespace Flow.updateRates
     * @returns {Promise<{currencyCode, currencyRateUsd, currencyRateJson, currencyRateScanTime, priceProvider, priceChangePercentage24h, priceLastUpdate}[]>}
     */
    getCurrencies: async () => {
        const res = await Database.query(`
            SELECT
              is_hidden AS isHidden,
              currency_code AS currencyCode,
              currency_rate_usd AS currencyRateUsd,
              currency_rate_json AS currencyRateJson,
              currency_rate_scan_time AS currencyRateScanTime,
              price_provider AS priceProvider,
              price_change_percentage_24h AS priceChangePercentage24h,
              price_last_updated AS priceLastUpdate
            FROM ${tableName}
        `)

        if (!res || !res.array) {
            return false
        }

        let tmp
        for (tmp of res.array) {
            tmp.currencyRateJson = Database.unEscapeString(tmp.currencyRateJson)
            if (tmp.currencyRateJson) {
                try {
                    tmp.currencyRateJson = JSON.parse(tmp.currencyRateJson)
                } catch (e) {

                }
            }
        }

        return res.array
    },

    /**
     * @returns {Promise<[]>}
     */
    getCurrenciesCodesActivated: async () => {
        const res = await Database.query(`SELECT currency_code AS currencyCode FROM ${tableName}`)

        if (!res || !res.array) {
            return BlocksoftDict.Codes
        }

        const data = []
        let row
        for (row of res.array) {
            if (row.currencyCode === 'NFT' || row.currencyCode === 'CASHBACK') continue
            data.push(row.currencyCode)
        }
        data.push('BTC_SEGWIT')
        data.push('BTC_SEGWIT_COMPATIBLE')
        data.push('LTC_SEGWIT')
        return data
    }
}
