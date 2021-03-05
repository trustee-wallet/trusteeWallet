/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '../../../services/Log/Log'

const tableName = 'card'

export default {

    /**
     * @param {string} params.isPending
     * @returns {Promise<boolean|*>}
     */
    getCards: async (params) => {
        let where = []
        if (params) {
            if (typeof params.isPending !== 'undefined' && params.isPending) {
                where.push(`LOWER(card_verification_json) LIKE '%pending%'`)
            }
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
                card_details_json AS cardDetailsJson
                FROM card ${where}`).query()
        if (!res || typeof res.array === 'undefined' || res.array.length === 0) {
            Log.log('DS/Card finished as empty')
            return false
        }
        return res.array
    },

    updateCard: async (data) => {
        if (typeof data.updateObj.cardVerificationJson !== 'undefined') {
            data.updateObj.cardVerificationJson = Database.escapeString(data.updateObj.cardVerificationJson)
        }
        await Database.setTableName(tableName).setUpdateData(data).update()
        Log.log('DS/Card updateCard finished')
    },

    saveCard: async (data) => {
        await Database.setTableName(tableName).setInsertData(data).insert()
        Log.log('DS/Card saveCard finished')
    },

    deleteCard: async (cardID) => {
        await Database.setQueryString(`DELETE FROM card WHERE id=${cardID}`).query()
        Log.log('DS/Card deleteCard finished')
    }
}
