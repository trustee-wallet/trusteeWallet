/**
 * @version 0.9
 */
import '../../../services/GlobalExceptionHandler/GlobalExceptionHandler'
import { Text } from 'react-native'

import Orientation from 'react-native-orientation'

import store from '../../../store'

import walletDS from '../../DataSource/Wallet/Wallet'

import NavStore from '../../../components/navigation/NavStore'

import { setInitState, setInitError, setSelectedWallet } from '../../Stores/Main/MainStoreActions'
import { setCards } from '../../Stores/Card/CardActions'
import walletActions from '../../Stores/Wallet/WalletActions'
import currencyActions from '../../Stores/Currency/CurrencyActions'
import settingsActions from '../../Stores/Settings/SettingsActions'
import customCurrencyActions from '../CustomCurrencyActions'
import exchangeActions from '../../Stores/Exchange/ExchangeActions'

import DBOpen from '../../DataSource/DB/DBOpen'
import DBInit from '../../DataSource/DB/DBInit/DBInit'

import Log from '../../../services/Log/Log'
import AppLockScreenIdleTime from '../../../services/AppLockScreenIdleTime/AppLockScreenIdleTime'
import AppVersionControl from '../../../services/AppVersionControl/AppVersionControl'
import AppNotification from '../../../services/AppNotification/AppNotificationListener'

import Daemon from '../../../daemons/Daemon'
import UpdateTradeOrdersDaemon from '../../../daemons/back/UpdateTradeOrdersDaemon'
import CashBackActions from '../../Stores/CashBack/CashBackActions'
import CashBackSettings from '../../Stores/CashBack/CashBackSettings'
import CashBackUtils from '../../Stores/CashBack/CashBackUtils'

import FilePermissions from '../../../services/FileSystem/FilePermissions'
import UpdateAppNewsDaemon from '../../../daemons/back/UpdateAppNewsDaemon'
import config from '../../../config/config'
import UpdateAccountBalanceAndTransactions from '../../../daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateOneByOneDaemon from '../../../daemons/back/UpdateOneByOneDaemon'
import UpdateCurrencyListDaemon from '../../../daemons/view/UpdateCurrencyListDaemon'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'
import UpdateCashBackDataDaemon from '../../../daemons/back/UpdateCashBackDataDaemon'

const { dispatch, getState } = store

if (Text.defaultProps == null) Text.defaultProps = {}
Text.defaultProps.allowFontScaling = false


class App {

    initStatus = 'init started'
    initError = 'empty'
    initHasWallets = false

    init = async (params) => {
        const navigateToInit = typeof params.navigateToInit !== 'undefined' ? params.navigateToInit : true
        const source = typeof params.source !== 'undefined' ? params.source : ''
        try {
            // console.log(new Date().toISOString() + ' start ' + source)

            await FilePermissions.init()

            this.initStatus = 'FilePermissions.init'

            Orientation.lockToPortrait()

            const { init } = getState().mainStore

            if (init === true) {
                dispatch(setInitState(true))
                return
            }

            this.initStatus = 'Orientation.lockToPortrait()'

            Log.log('ACT/App init application called ' + source)

            if (navigateToInit) {

                await DBOpen.open()

                this.initStatus = 'await DBOpen.open()'

                await DBInit.init()

                this.initStatus = 'await DBInit.init()'

                if (!(await walletDS.hasWallet())) {

                    this.initStatus = '!(await walletDS.hasWallet())'

                    Log.log('ACT/App no wallets found')

                    NavStore.reset('WalletCreateScreen')

                    this.initStatus = 'NavStore.reset(\'WalletCreateScreen\')'

                    return
                }

                NavStore.reset('InitScreen')

                this.initStatus = 'NavStore.reset(\'InitScreen\')'

                return
            }

            this.initHasWallets = true

            await AppNotification.init()

            this.initStatus = 'await AppNotification.init()'

            await customCurrencyActions.importCustomCurrenciesToDict()

            this.initStatus = 'await customCurrencyActions.importCustomCurrenciesToDict()'

            await settingsActions.getSettings()

            this.initStatus = 'await settingsActions.getSettings()'

            await this.refreshWalletsStore({firstTimeCall : 'first', source : 'ACT/App init', noRatesApi : true, noCashbackApi : true})

            this.initStatus = 'await this.refreshWalletsStore(true)'

            AppLockScreenIdleTime.init()

            this.initStatus = 'AppLockScreenIdleTime.init()'

            if (UpdateAppNewsDaemon.isGoToNotifications('AFTER_APP')) {
                NavStore.reset('NotificationsScreen')
            } else {
                UpdateAppNewsDaemon.goToNotifications('INITED_APP')
            }

            dispatch(setInitState(true))

            this.initStatus = 'dispatch(setInitState(true))'

            Log.log('ACT/App init application finished')

            this.initStatus = 'const { daemon } = config'

            await Daemon.start()

            this.initStatus = 'Daemon.start()'

            await this.refreshWalletsStore({firstTimeCall : 'second', source : 'ACT/App init'})

            this.initStatus = 'await this.refreshWalletsStore(true)'

            // noinspection ES6MissingAwait
            setCards()

            this.initStatus = 'setCards()'

            // console.log(new Date().toISOString() + ' done')

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ACT/App init application error ' + this.initStatus + ' ' + e.message, e)
            }
            Log.err('ACT/App init application error ' + this.initStatus + ' ' + e.message)
            this.initError = e.message
            dispatch(setInitError(e.message))
            NavStore.goNext('ErrorScreen', {error : e.message})
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
        const source =  typeof params.source !== 'undefined' && params.source.trim() !== '' ? params.source : 'noSource'

        if (!this.initHasWallets) {
            await Log.log('ACT/App appRefreshWalletsStates called will do nothing from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall))
            // called after wallet create finish
            return false
        }

        await Log.log('ACT/App appRefreshWalletsStates called from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall))

        await walletActions.setAvailableWallets()

        await setSelectedWallet('ACT/App appRefreshWalletsStates called from ' + source)

        await currencyActions.init()

        await CashBackSettings.init()

        if (firstTimeCall === 'first') {
            // first step of init
            await Daemon.forceAll({...params, noCashbackApi : true})

        } else if (firstTimeCall === 'second') {
            // second step of init
            await exchangeActions.init()

            await UpdateAccountListDaemon.forceDaemonUpdate(params)

            await UpdateCashBackDataDaemon.updateCashBackDataDaemon()

            await CashBackUtils.init()

            await CashBackActions.setPublicLink()
        } else {
            // reload from wallet import etc
            await CashBackSettings.init()

            await Daemon.forceAll(params)

            await CashBackUtils.init()

            await CashBackActions.setPublicLink()
        }

        await Log.log('ACT/App appRefreshWalletsStates called from ' + source + ' firstTimeCall ' + JSON.stringify(firstTimeCall) + ' finished')
    }



}

export default new App()
