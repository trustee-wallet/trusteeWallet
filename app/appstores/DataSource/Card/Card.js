/**
 * @version 0.41
 */
import Database from '@app/appstores/DataSource/Database'
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
            if (typeof params.walletHash !== 'undefined' && params.walletHash) {
                where.push(`(wallet_hash='${params.walletHash}' OR wallet_hash='null' OR wallet_hash='NULL' OR wallet_hash='' OR wallet_hash IS NULL)`)
            }
            if (typeof params.withRemoved === 'undefined') {
                where.push(`number!='REMOVED'`)
            }
        } else {
            where.push(`number!='REMOVED'`)
        }
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }
        const res = await Database.setQueryString(`
                SELECT
                id,
                card_to_send_status AS cardToSendStatus,
                card_to_send_id AS cardToSendId,
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
                card_check_status AS cardCheckStatus
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
        try {
            if (typeof data.updateObj.cardToSendStatus === 'undefined' || !data.updateObj.cardToSendStatus) {
                data.updateObj.cardToSendStatus = Math.round(new Date().getTime() / 1000)
            }
            if (typeof data.updateObj.cardVerificationJson !== 'undefined') {
                data.updateObj.cardVerificationJson = Database.escapeString(data.updateObj.cardVerificationJson)
            }
            await Database.setTableName(tableName).setUpdateData(data).update()
        } catch (e) {
            throw new Error(e.message + ' while updateCard ' + JSON.stringify(data.updateObj))
        }
    },

    getCardVerificationJson: async (number) => {
        const res = await Database.setQueryString(`
                SELECT
                card_verification_json AS cardVerificationJson
                FROM card WHERE number='${number}'`).query()
        if (!res || typeof res.array === 'undefined' || res.array.length === 0) {
            return false
        }
        const tmp = Database.unEscapeString(res.array[0].cardVerificationJson)
        if (!tmp) {
            return false
        }
        return JSON.parse(tmp)
    },

    saveCard: async (data) => {
        try {
            if (typeof data.cardToSendStatus === 'undefined' || !data.cardToSendStatus) {
                data.cardToSendStatus = Math.round(new Date().getTime() / 1000)
            }
            await Database.setTableName(tableName).setInsertData(data).insert()
            CACHE_TOTAL = CACHE_TOTAL + 1
            MarketingEvent.logEvent('gx_cards_add', { cardNumber: CACHE_TOTAL.toString() }, 'GX')
            Log.log('DS/Card saveCard finished')
        } catch (e) {
            throw new Error(e.message + ' while saveCard ' + JSON.stringify(data))
        }
    },

    deleteCard: async (cardID) => {
        const sql = `UPDATE card
            SET number='REMOVED', card_name='REMOVED', card_to_send_status='${Math.round(new Date().getTime() / 1000)}'
            WHERE id=${cardID}
            `
        await Database.setQueryString(sql).query()
        CACHE_TOTAL = CACHE_TOTAL - 1
        MarketingEvent.logEvent('gx_cards_remove', { cardNumber: CACHE_TOTAL.toString() }, 'GX')
        Log.log('DS/Card deleteCard finished')
    },

    clearCards: async (data) => {
        await Database.setQueryString(`DELETE FROM card WHERE card_create_wallet_hash='${data.walletHash}'`).query()
    }
}
