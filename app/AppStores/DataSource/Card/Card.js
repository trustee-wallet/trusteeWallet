/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'card'

export default {

    getCards: async () => {

        const dbInterface = new DBInterface()

        Log.log('DS/Card getCards called')

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
                FROM card`).query()

        Log.log('DS/Card getCards finished')

        if (!res || typeof res.array === 'undefined' || res.array.length === 0) return false
        return res.array
    },

    updateCard: async (data) => {

        Log.log('DS/Card updateCard called')

        const dbInterface = new DBInterface()

        if (typeof data.updateObj.cardVerificationJson !== 'undefined') {
            data.updateObj.cardVerificationJson = dbInterface.escapeString(data.updateObj.cardVerificationJson)
        }

        await dbInterface.setTableName(tableName).setUpdateData(data).update()

        Log.log('DS/Card finished')
    },

    saveCard: async (data) => {

        Log.log('DS/Card saveCard called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.log('DS/Card saveCard finished')

    },

    deleteCard: async (cardID) => {
        Log.log('DS/Card deleteCard called')

        const dbInterface = new DBInterface()

        await dbInterface.setQueryString(`DELETE FROM card WHERE id=${cardID}`).query()

        Log.log('DS/Card deleteCard finished')
    }
}
