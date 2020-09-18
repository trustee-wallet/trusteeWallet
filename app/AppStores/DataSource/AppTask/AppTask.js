/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

const tableName = 'app_task'

class AppTask {

    /**
     * @param {string} appTasksList[].walletHash
     * @param {string} appTasksList[].currencyCode
     * @param {string} appTasksList[].taskGroup
     * @param {string} appTasksList[].taskName
     * @param {string} appTasksList[].taskJson
     */
    saveAppTasks = async (appTasksList) => {
        const dbInterface = new DBInterface()
        const now = Math.round(new Date().getTime() / 1000)
        let appTask
        for (appTask of appTasksList) {
            if (typeof appTask.taskJson !== 'undefined' && appTask.taskJson) {
                if (typeof appTask.taskJson !== 'string') {
                    appTask.taskJson = dbInterface.escapeString(JSON.stringify(appTask.taskJson))
                }
            }
            appTask.taskCreated = now
        }
        await dbInterface.setTableName(tableName).setInsertData({insertObjs : appTasksList}).insert()
    }

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @returns {Promise<void>}
     */
    clearTasks = async (params) => {
        Log.daemon('DS/AppTask clear wallet called ' + params.walletHash)
        const dbInterface = new DBInterface()
        const sql = `DELETE FROM app_task WHERE wallet_hash='${params.walletHash}'`
        await dbInterface.setQueryString(sql).query()
        Log.daemon('DS/AppTask clear wallet finished ' + params.walletHash)
    }

    /**
     * @param {Object} params
     * @param {string} params.currencyCode
     * @returns {Promise<void>}
     */
    clearTasksByCurrencyAdd = async (params) => {
        Log.daemon('DS/AppTask clear currency called ' + params.currencyCode)
        const dbInterface = new DBInterface()
        const sql = `DELETE FROM app_task WHERE currency_code='${params.currencyCode}' AND task_name IN ('DAEMON_HAS_FOUND_BALANCE_NOT_ADDED', 'DAEMON_HAS_FOUND_BALANCE')`
        await dbInterface.setQueryString(sql).query()
        Log.daemon('DS/AppTask clear currency finished ' + params.currencyCode)
    }
}

export default new AppTask()
