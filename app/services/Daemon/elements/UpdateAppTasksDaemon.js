/**
 * @version 0.9
 */
import Update from './Update'

import Log from '../../Log/Log'

import appTaskDoingDS from '../../../appstores/DataSource/AppTask/AppTaskDoing'

import AppTasksDiscoverHD from './apptasks/AppTasksDiscoverHD'
import AppTasksDiscoverBalancesHidden from './apptasks/AppTasksDiscoverBalancesHidden'
import AppTasksDiscoverBalancesNotAdded from './apptasks/AppTasksDiscoverBalancesNotAdded'
import updateAccountBalanceAndTransactionsDaemon from './UpdateAccountBalanceAndTransactionsDaemon'


class UpdateAppTasksDaemon extends Update {

    _canUpdate = true
    _isSkipped = false

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAppTasksDaemon
    }

    /**
     * @namespace Flow.updateAppTasks
     * @return {Promise<void>}
     */
    updateAppTasksDaemon = async () => {
        if (!updateAccountBalanceAndTransactionsDaemon._canUpdate) {
            this._isSkipped = true
            Log.daemon('UpdateAppTask skipped as already running tx scanning')
            return
        }
        if (!this._canUpdate) {
            Log.daemon('UpdateAppTask skipped as already running')
            return
        }
        this._canUpdate = false
        this._isSkipped = false

        Log.daemon('UpdateAppTask called')

        const appTasks = await appTaskDoingDS.getTasksForRun()
        if (!appTasks) {
            this._canUpdate = true
            return false
        }
        let appTask
        for (appTask of appTasks) {
            try {
                Log.daemon('UpdateAppTask started #' + appTask.id + ' ' + appTask.taskName, appTask)
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
                Log.daemon('UpdateAppTask finished #' + appTask.id + ' ' + appTask.taskName + ' Log ' + log, appTask)
                await appTaskDoingDS.setFinished(appTask)
            } catch (e) {
                Log.errDaemon('UpdateAppTask finished #' + appTask.id + ' ' + appTask.taskName + ' error ' + e.message, appTask)
            }
        }

        Log.daemon('UpdateAppTask finished')

        this._canUpdate = true
    }
}

export default new UpdateAppTasksDaemon
