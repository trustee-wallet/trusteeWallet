/**
 * @version 0.9
 */
import '@app/services/GlobalExceptionHandler/GlobalExceptionHandler'
import { Text } from 'react-native'

import Orientation from 'react-native-orientation'

import walletDS from '../../DataSource/Wallet/Wallet'

import NavStore from '../../../components/navigation/NavStore'

import { setSelectedWallet } from '../../Stores/Main/MainStoreActions'
import { setInitState, setInitError } from '../../Stores/Init/InitStoreActions'
import walletActions from '../../Stores/Wallet/WalletActions'
import currencyActions from '../../Stores/Currency/CurrencyActions'
import settingsActions from '../../Stores/Settings/SettingsActions'
import customCurrencyActions from '../CustomCurrencyActions'

import Database, { cleanupNotNeeded } from '@app/appstores/DataSource/Database'

import Log from '../../../services/Log/Log'
import AppLockScreenIdleTime from '../../../services/AppLockScreenIdleTime/AppLockScreenIdleTime'
import AppVersionControl from '../../../services/AppVersionControl/AppVersionControl'
import AppNotification from '../../../services/AppNotification/AppNotificationListener'

import Daemon from '../../../daemons/Daemon'
import CashBackUtils from '../../Stores/CashBack/CashBackUtils'

import FilePermissions from '../../../services/FileSystem/FilePermissions'
import UpdateAppNewsDaemon from '../../../daemons/back/UpdateAppNewsDaemon'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'


import config from '../../../config/config'
import appNewsInitStore from '@app/appstores/Stores/AppNews/AppNewsInitStore'

if (Text.defaultProps == null) Text.defaultProps = {}
Text.defaultProps.allowFontScaling = false

class App {

    initStatus = 'init started'
    initError = 'empty'
    initHasWallets = false

    init = async (params) => {
        const onMount = typeof params.onMount !== 'undefined' ? params.onMount : true
        const source = typeof params.source !== 'undefined' ? params.source : ''
        try {

            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ACT/App init application called ' + source + ' onMount ' + JSON.stringify(onMount))
            }

            if (onMount) {

                this.initStatus = 'FilePermissions.init'

                await FilePermissions.init()

                this.initStatus = 'FilePermissions.init'

                Orientation.lockToPortrait()

                this.initStatus = 'await Database.start()'

                if (config.debug.appErrors) {
                    console.log(new Date().toISOString() + ' ACT/App init application called started DB')
                }

                await Database.start()

                if (config.debug.appErrors) {
                    console.log(new Date().toISOString() + ' ACT/App init application called finished DB')
                }

                if (!(await walletDS.hasWallet())) {

                    this.initStatus = 'createWallets'

                    Log.log('ACT/App no wallets found')

                    NavStore.reset('WalletCreateScreen')

                    this.initStatus = 'WalletCreateScreen'

                    return
                }
            }

            this.initHasWallets = true

            await AppNotification.init()

            this.initStatus = 'await AppNotification.init()'

            await customCurrencyActions.importCustomCurrenciesToDict()

            this.initStatus = 'await customCurrencyActions.importCustomCurrenciesToDict()'

            await settingsActions.getSettings()

            this.initStatus = 'await settingsActions.getSettings()'

            await this.refreshWalletsStore({ firstTimeCall: 'first', source: 'ACT/App init', noRatesApi: true, noCashbackApi: true })

            this.initStatus = 'await this.refreshWalletsStore(true)'

            AppLockScreenIdleTime.init()

            this.initStatus = 'AppLockScreenIdleTime.init()'

            if (UpdateAppNewsDaemon.isGoToNotifications('AFTER_APP')) {
                NavStore.reset('NotificationsScreen')
            } else {
                UpdateAppNewsDaemon.goToNotifications('INITED_APP')
            }

            setInitState(true)

            this.initStatus = 'dispatch(setInitState(true))'

            Log.log('ACT/App init application finished')

            this.initStatus = 'const { daemon } = config'

            await Daemon.start()

            this.initStatus = 'Daemon.start()'

            await this.refreshWalletsStore({ firstTimeCall: 'second', source: 'ACT/App init' })

            this.initStatus = 'await this.refreshWalletsStore(true)'

            this.initStatus = 'setCards()'

            // console.log(new Date().toISOString() + ' done')

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ACT/App init application error ' + this.initStatus + ' ' + e.message, e)
            }
            Log.err('ACT/App init application error ' + this.initStatus + ' ' + e.message)
            this.initError = e.message
            setInitError(e.message)
            NavStore.goNext('ErrorScreen', { error: e.message })
        }
        try {
            // noinspection ES6MissingAwait
            AppVersionControl.init()
        } catch (e) {
            // do nothing
        }
    }

    /**
     *
     * @param params.firstTimeCall
     * @param params.source
     * @param params.walletHash
     * @returns {Promise<void>}
     */
    refreshWalletsStore = async (params) => {
        const firstTimeCall = typeof params.firstTimeCall !== 'undefined' ? params.firstTimeCall : false
        const source = typeof params.source !== 'undefined' && params.source.trim() !== '' ? params.source : 'noSource'

        if (!this.initHasWallets) {
            await Log.log('ACT/App appRefreshWalletsStates called will do nothing from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall))
            // called after wallet create finish
            return false
        }

        await Log.log('ACT/App appRefreshWalletsStates called from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall))

        await walletActions.setAvailableWallets()

        await setSelectedWallet('ACT/App appRefreshWalletsStates called from ' + source)

        await currencyActions.init()

        if (firstTimeCall === 'first') {
            // first step of init
            await Daemon.forceAll({ ...params, noCashbackApi: true })

        } else if (firstTimeCall === 'second') {
            // second step of init
            await cleanupNotNeeded()

            await appNewsInitStore()
            await UpdateAccountListDaemon.forceDaemonUpdate(params)

            // await UpdateCashBackDataDaemon.updateCashBackDataDaemon({source : 'UpdateCashBackDataDaemon.AppHomeScreen'})

            await CashBackUtils.init({},'ACT/App appRefreshWalletsStates init ' + firstTimeCall)
        } else {
            await Daemon.forceAll(params)

            await CashBackUtils.init({}, 'ACT/App appRefreshWalletsStates init '  + firstTimeCall)
        }

        await Log.log('ACT/App appRefreshWalletsStates called from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall) + ' finished')
    }


}

export default new App()
