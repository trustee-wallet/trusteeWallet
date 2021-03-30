/**
 * @version 0.41
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import config from '@app/config/config'

const tableName = 'card'

let CACHE_TOTAL = 0
export default {

    /**
     * @param {string} params.number
     * @returns {Promise<boolean|*>}
     */
    getCards: async (params) => {
        let where = []
        if (params) {
            if (typeof params.number !== 'undefined' && params.number) {
                where.push(`number='${params.number}'`)
            }
        }
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }
        const res = await Database.setQueryString(`
                SELECT
                id,
                card_name AS cardName,
                card_holder AS cardHolder,
                number AS number,
                expiration_date AS expirationDate,
                type AS type,
                country_code AS countryCode,
                currency AS currency,
                card_verification_json AS cardVerificationJson,
                wallet_hash AS walletHash,
                verification_server AS verificationServer,
                card_email AS cardEmail,
                card_details_json AS cardDetailsJson,
                card_status_p2p_json AS cardStatusP2PJson
                FROM card ${where}`).query()
        if (!res || typeof res.array === 'undefined' || res.array.length === 0) {
            Log.log('DS/Card finished as empty')
            return false
        }
        if (where === '') {
            CACHE_TOTAL = res.array.length
        }
        return res.array
    },

    updateCard: async (data) => {
        if (typeof data.updateObj.cardVerificationJson !== 'undefined') {
            data.updateObj.cardVerificationJson = Database.escapeString(data.updateObj.cardVerificationJson)
        }
        await Database.setTableName(tableName).setUpdateData(data).update()
    },

    getCardVerificationJson : async (number) => {
        const res = await Database.setQueryString(`
                SELECT
                card_verification_json AS cardVerificationJson
                FROM card WHERE number='${number}'`).query()
        if (!res || typeof res.array === 'undefined' || res.array.length === 0) {
            console.log('DS/Card data finished as empty')
            return false
        }
        const tmp = Database.unEscapeString(res.array[0].cardVerificationJson)
        if (!tmp) {
            return false
        }
        return JSON.parse(tmp)
    },

    saveCard: async (data) => {
        await Database.setTableName(tableName).setInsertData(data).insert()
        CACHE_TOTAL = CACHE_TOTAL + 1
        MarketingEvent.logEvent('gx_cards_add', { cardNumber : CACHE_TOTAL.toString()}, 'GX')
        Log.log('DS/Card saveCard finished')
    },

    deleteCard: async (cardID) => {
        await Database.setQueryString(`DELETE FROM card WHERE id=${cardID}`).query()
        CACHE_TOTAL = CACHE_TOTAL - 1
        MarketingEvent.logEvent('gx_cards_remove', { cardNumber : CACHE_TOTAL.toString()}, 'GX')
        Log.log('DS/Card deleteCard finished')
    }
}
