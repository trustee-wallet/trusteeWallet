import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'account_balance'

export default {

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} data.key
     * @return {Promise<void>}
     */
    updateAccountBalance: async (data) => {

        Log.daemon('DS/AccountBalance updateAccountBalance called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setUpdateData(data).update()

        Log.daemon( 'DS/AccountBalance updateAccountBalance finished' )

    },

    /**
     * @param {Object} data
     * @param {Object[]} data.insertObjs
     * @return {Promise<void>}
     */
    insertAccountBalance: async (data) => {

        Log.daemon('DS/AccountBalance insertAccountBalance called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.daemon('DS/AccountBalance insertAccountBalance finished')

    }
}
