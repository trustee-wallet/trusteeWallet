import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'card'

export default {

    getCards: async () => {

        const dbInterface = new DBInterface()

        Log.log('DS/Card getCards called')

        const res = await dbInterface.setQueryString('SELECT * FROM card').query()

        Log.log('DS/Card getCards finished')

        return res
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
