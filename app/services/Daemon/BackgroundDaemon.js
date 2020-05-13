/**
 * @version 0.9
 */
import Log from '../Log/Log'
import BackgroundFetch from 'react-native-background-fetch'

import updateAccountBalanceAndTransactionsDaemon from './elements/UpdateAccountBalanceAndTransactionsDaemon'
import appNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'
import DBOpen from '../../appstores/DataSource/DB/DBOpen'
import DBInit from '../../appstores/DataSource/DB/DBInit/DBInit'

class BackgroundDaemon {

    constructor() {
        this.init()
    }

    taskToRegister = async () => {

        console.log('BACKGROUND EVENT INIT')
        Log.daemon('BACKGROUND EVENT INIT')
        await DBOpen.open()
        await DBInit.init()
        await updateAccountBalanceAndTransactionsDaemon.updateAccountBalanceAndTransactions({ force: true, source: 'BACK' })
        await appNewsActions.displayPush()

        console.log('BACKGROUND EVENT FINISH')
        Log.daemon('BACKGROUND EVENT FINISH')

        BackgroundFetch.finish()
    }

    init = () => {

        BackgroundFetch.configure({
            minimumFetchInterval: 1,     // <-- minutes (15 is minimum allowed)
            stopOnTerminate: false,
            enableHeadless: true,
            startOnBoot: true,
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Default
            requiresCharging: false,      // Default
            requiresDeviceIdle: false,    // Default
            requiresBatteryNotLow: false, // Default
            requiresStorageNotLow: false  // Default
        }, this.taskToRegister, (e) => {
            Log.daemon('BackgroundDaemon denied' + e)
        })

        BackgroundFetch.status((status) => {
            switch(status) {
                case BackgroundFetch.STATUS_RESTRICTED:
                    console.log('BackgroundDaemon restricted')
                    Log.daemon('BackgroundDaemon restricted')
                    break
                case BackgroundFetch.STATUS_DENIED:
                    console.log('BackgroundDaemon denied')
                    Log.daemon('BackgroundDaemon denied')
                    break
                case BackgroundFetch.STATUS_AVAILABLE:
                    console.log('BackgroundDaemon is enabled')
                    Log.daemon('BackgroundDaemon is enabled')
                    break
            }
        })
    }

}

export default new BackgroundDaemon()
