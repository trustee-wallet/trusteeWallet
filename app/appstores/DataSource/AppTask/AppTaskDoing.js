/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '../../../services/Log/Log'

export default {

    /**
     * @param {string} appTask.id
     * @returns {Promise<void>}
     */
    setStarted : async (appTask) => {
        const now = Math.round(new Date().getTime() / 1000)
        const sql = `UPDATE app_task SET task_started=${now} WHERE id = ${appTask.id}`
        await Database.query(sql)
    },

    /**
     * @param {string} appTask.taskLog
     * @param {string} appTask.taskFinished
     * @param {string} appTask.id
     * @returns {Promise<void>}
     */
    setFinished : async (appTask) => {
        const now = Math.round(new Date().getTime() / 1000)
        appTask.taskLog = Database.escapeString(new Date().toISOString() + ' ' + appTask.taskLog.substr(0, 1000))
        const sql = `UPDATE app_task SET task_finished=${now}, task_log='${appTask.taskLog}' WHERE id = ${appTask.id}`
        await Database.query(sql)
    },

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.taskStatus
     * @param {string} params.taskName
     * @return {Promise<{id, currencyCode, walletHash, taskGroup, taskName, taskJson, taskStatus, taskLog}[]>}
     */
    getTasksForRun: async (params) => {
        Log.daemon('AppTaskDoing getTasksForRun called')

        const now = Math.round(new Date().getTime() / 1000) - 60 // 1 minute before
        let where = [`(app_task.task_started IS NULL OR app_task.task_started< ${now}) AND app_task.task_finished IS NULL`]

        if (params && params.walletHash) {
            where.push(`app_task.wallet_hash='${params.walletHash}'`)
        }
        if (params && typeof params.taskName !== 'undefined') {
            where.push(`app_task.task_name='${params.taskName}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `
            SELECT
            app_task.id,
            app_task.currency_code AS currencyCode,
            app_task.wallet_hash AS walletHash,
            app_task.task_group AS taskGroup,
            app_task.task_name AS taskName,
            app_task.task_json AS taskJson,
            app_task.task_status AS taskStatus,
            app_task.task_log AS taskLog
            FROM app_task
            ${where}
            ORDER BY app_task.task_started ASC
            LIMIT 1
        `
        let res = []
        try {
            res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('AppTaskDoing getTasksForRun finished as empty')
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                if (!res[i].taskJson || res[i].taskJson === 'false') continue

                const string = Database.unEscapeString(res[i].taskJson)
                try {
                    Log.daemon('AppTaskDoing getTasksForRun will parse ' + string)
                    res[i].taskJson = JSON.parse(string)
                } catch (e) {
                    // noinspection ES6MissingAwait
                    Log.errDaemon('AppTaskDoing getTasksForRun json error ' + string + ' ' + e.message)
                }
            }
            Log.daemon('AppTaskDoing getTasksForRun finished')
        } catch (e) {
            Log.daemon('AppTaskDoing getTasksForRun error ' + sql + ' ' + e.message)
        }
        return res
    }

}
