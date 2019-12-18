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
    updateAccountBalance: async (data, account) => {

        Log.daemon('DS/AccountBalance updateAccountBalance called')

        const dbInterface = new DBInterface()

        const {array : find} = await dbInterface.setQueryString(`SELECT account_id FROM ${tableName} WHERE account_id=${data.key.account_id}`).query()
        if (find.length > 0) {
            await dbInterface.setTableName(tableName).setUpdateData(data).update()
            Log.daemon( 'DS/AccountBalance updateAccountBalance finished' )
        } else {
            data.updateObj.account_id = data.key.account_id
            data.updateObj.status = 0
            data.updateObj.currency_code = account.currencyCode
            data.updateObj.wallet_hash = account.walletHash
            await dbInterface.setTableName(tableName).setInsertData({insertObjs : [data.updateObj]}).insert()
            Log.daemon( 'DS/AccountBalance updateAccountBalance with balanceCreate finished' )
        }


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
