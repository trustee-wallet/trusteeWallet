/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'card'

export default {

    /**
     * @param {string} params.isPending
     * @returns {Promise<boolean|*>}
     */
    getCards: async (params) => {
        const dbInterface = new DBInterface()
        let where = []
        if (params && typeof params.isPending !== 'undefined' && params.isPending) {
            where.push(`card_verification_json LIKE '%pending%`)
        }
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }
        const res = await dbInterface.setQueryString(`
                SELECT 
                id,
                card_name AS cardName,
                card_holder AS cardHolder,
                number AS number,
                expiration_date AS expirationDate,
                type AS type,
                country_code AS countryCode,
                currency AS currency,
                card_verification_json AS cardVerificationJson
                FROM card ${where}`).query()
        if (!res || typeof res.array === 'undefined' || res.array.length === 0) {
            Log.log('DS/Card finished as empty')
            return false
        }
        return res.array
    },

    updateCard: async (data) => {
        const dbInterface = new DBInterface()
        if (typeof data.updateObj.cardVerificationJson !== 'undefined') {
            data.updateObj.cardVerificationJson = dbInterface.escapeString(data.updateObj.cardVerificationJson)
        }
        await dbInterface.setTableName(tableName).setUpdateData(data).update()
        Log.log('DS/Card updateCard finished')
    },

    saveCard: async (data) => {
        const dbInterface = new DBInterface()
        await dbInterface.setTableName(tableName).setInsertData(data).insert()
        Log.log('DS/Card saveCard finished')
    },

    deleteCard: async (cardID) => {
        const dbInterface = new DBInterface()
        await dbInterface.setQueryString(`DELETE FROM card WHERE id=${cardID}`).query()
        Log.log('DS/Card deleteCard finished')
    }
}
