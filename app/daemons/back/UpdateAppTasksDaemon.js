/**
 * @version 0.11
 * @todo remove as deprecated if will be not shown
 */
import Log from '../../services/Log/Log'

import appTaskDoingDS from '../../appstores/DataSource/AppTask/AppTaskDoing'

import AppTasksDiscoverHD from './apptasks/AppTasksDiscoverHD'
import AppTasksDiscoverBalancesHidden from './apptasks/AppTasksDiscoverBalancesHidden'
import AppTasksDiscoverBalancesNotAdded from './apptasks/AppTasksDiscoverBalancesNotAdded'


class UpdateAppTasksDaemon {

    /**
     * @param {string} params.taskName
     * @return {Promise<void>}
     */
    updateAppTasksDaemon = async (params) => {
        return false
        Log.daemon('UpdateAppTaskDaemon called')

        const appTasks = await appTaskDoingDS.getTasksForRun(params)
        if (!appTasks) {
            return false
        }
        let appTask
        for (appTask of appTasks) {
            try {
                Log.daemon('UpdateAppTaskDaemon started #' + appTask.id + ' ' + appTask.taskName, appTask)
                await appTaskDoingDS.setStarted(appTask)
                let log
                switch (appTask.taskName) {
                    case 'DISCOVER_HD':
                        log = await AppTasksDiscoverHD.run(appTask)
                        break
                    case 'DISCOVER_BALANCES_HIDDEN':
                        log = await AppTasksDiscoverBalancesHidden.run(appTask)
                        break
                    case 'DISCOVER_BALANCES_NOT_ADDED':
                        log = await AppTasksDiscoverBalancesNotAdded.run(appTask)
                        break
                    default:
                        Log.errDaemon('UpdateAppTask unknown name ' + appTask.taskName, appTask)
                        break
                }
                if (log) {
                    appTask.taskLog = log
                }
                Log.daemon('UpdateAppTaskDaemon finished #' + appTask.id + ' ' + appTask.taskName + ' Log ' + log, appTask)
                await appTaskDoingDS.setFinished(appTask)
            } catch (e) {
                Log.errDaemon('UpdateAppTaskDaemon finished #' + appTask.id + ' ' + appTask.taskName + ' error ' + e.message, appTask)
            }
        }

        Log.daemon('UpdateAppTaskDaemon finished')
    }
}

export default new UpdateAppTasksDaemon
