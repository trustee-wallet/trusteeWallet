/**
 * @version 0.11
 * @deprecated
 */
import Log from '../services/Log/Log'
import BackgroundFetch from 'react-native-background-fetch'

import appNewsActions from '../appstores/Stores/AppNews/AppNewsActions'
import DBOpen from '../appstores/DataSource/DB/DBOpen'
import DBInit from '../appstores/DataSource/DB/DBInit/DBInit'
import UpdateOneByOneDaemon from './back/UpdateOneByOneDaemon'
import FilePermissions from '../services/FileSystem/FilePermissions'

let CACHE_RUNNING = false
class BackgroundDaemon {

    constructor() {
        // this.init()
    }


    taskToRegister = async () => {

        CACHE_RUNNING = true

        // console.log('BACKGROUND EVENT INIT')
        Log.daemon('BACKGROUND EVENT INIT')
        await FilePermissions.init()
        await DBOpen.open()
        await DBInit.init()
        await UpdateOneByOneDaemon.init()
        await UpdateOneByOneDaemon.updateOneByOneDaemon({source : 'BACK'})

        // console.log('BACKGROUND EVENT FINISH')
        Log.daemon('BACKGROUND EVENT FINISH')

        BackgroundFetch.finish()

        CACHE_RUNNING = false
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
                    // console.log('BackgroundDaemon restricted')
                    Log.daemon('BackgroundDaemon restricted')
                    break
                case BackgroundFetch.STATUS_DENIED:
                    // console.log('BackgroundDaemon denied')
                    Log.daemon('BackgroundDaemon denied')
                    break
                case BackgroundFetch.STATUS_AVAILABLE:
                    // console.log('BackgroundDaemon is enabled')
                    Log.daemon('BackgroundDaemon is enabled')
                    break
            }
        })
    }

}

const single = new BackgroundDaemon()
export default single
