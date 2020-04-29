/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'account_balance'

export default {

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} account
     * @param {string} account.id
     * @param {string} account.currencyCode
     * @param {string} account.walletHash
     * @return {Promise<void>}
     */
    updateAccountBalance: async (data, account) => {

        Log.daemon('DS/AccountBalance updateAccountBalance called')

        const dbInterface = new DBInterface()

        data.updateObj.balanceScanLog = dbInterface.escapeString(data.updateObj.balanceScanLog)
        const {array : find} = await dbInterface.setQueryString(`SELECT account_id FROM ${tableName} WHERE account_id=${account.id}`).query()
        if (find.length > 0) {
            data.key = {accountId : account.id}
            await dbInterface.setTableName(tableName).setUpdateData(data).update()
            Log.daemon( 'DS/AccountBalance updateAccountBalance finished' )
        } else {
            data.updateObj.accountId = account.id
            data.updateObj.status = 0
            data.updateObj.currencyCode = account.currencyCode
            data.updateObj.walletHash = account.walletHash
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
