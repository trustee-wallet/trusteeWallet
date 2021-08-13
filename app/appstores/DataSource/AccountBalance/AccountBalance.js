/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
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
        if (data.updateObj.balanceScanLog.length > 1000) {
            data.updateObj.balanceScanLog = data.updateObj.balanceScanLog.substr(0, 1000)
        }
        data.updateObj.balanceScanLog = Database.escapeString(data.updateObj.balanceScanLog)
        const {array : find} = await Database.query(`SELECT account_id FROM ${tableName} WHERE account_id=${account.id}`)
        if (find.length > 0) {
            data.key = {accountId : account.id}
            await Database.setTableName(tableName).setUpdateData(data).update()
        } else {
            data.updateObj.accountId = account.id
            data.updateObj.status = 0
            data.updateObj.currencyCode = account.currencyCode
            data.updateObj.walletHash = account.walletHash
            await Database.setTableName(tableName).setInsertData({insertObjs : [data.updateObj]}).insert()
            Log.daemon( 'DS/AccountBalance updateAccountBalance with balanceCreate finished' )
        }
    },

    /**
     * @param {Object} data
     * @param {Object[]} data.insertObjs
     * @return {Promise<void>}
     */
    insertAccountBalance: async (data) => {
        await Database.setTableName(tableName).setInsertData(data).insert()
    }
}
