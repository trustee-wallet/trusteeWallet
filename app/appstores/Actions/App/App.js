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
import authActions from '../../Stores/Auth/AuthActions'
import customCurrencyActions from '../CustomCurrencyActions'
import exchangeActions from '../../Stores/Exchange/ExchangeActions'

import DBOpen from '../../DataSource/DB/DBOpen'
import DBInit from '../../DataSource/DB/DBInit/DBInit'

import Log from '../../../services/Log/Log'
import Cashback from '../../../services/Cashback/Cashback'
import AppLockScreenIdleTime from '../../../services/AppLockScreenIdleTime/AppLockScreenIdleTime'
import AppVersionControl from '../../../services/AppVersionControl/AppVersionControl'
import AppNotification from '../../../services/AppNotification/AppNotificationListener'

import Daemon from '../../../services/Daemon/Daemon'
import updateAccountsDaemon from '../../../services/Daemon/elements/UpdateAccountsDaemon'
import updateAppNewsDaemon from '../../../services/Daemon/elements/UpdateAppNewsDaemon'
import appNewsActions from '../../Stores/AppNews/AppNewsActions'

const { dispatch, getState } = store

if (Text.defaultProps == null) Text.defaultProps = {}
Text.defaultProps.allowFontScaling = false


class App {

    initStatus = 'init started'
    initError = 'empty'

    init = async (navigateToInit = true) => {

        try {

            AppNotification.init()

            Orientation.lockToPortrait()

            const { init } = getState().mainStore

            if (init === true) {
                dispatch(setInitState(true))
                return
            }

            this.initStatus = 'Orientation.lockToPortrait()'

            Log.log('ACT/App init application called')

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

            await customCurrencyActions.importCustomCurrenciesToDict()

            await authActions.init()

            this.initStatus = 'await authActions.init()'

            await settingsActions.getSettings()

            this.initStatus = 'await settingsActions.getSettings()'

            await this.refreshWalletsStore(true)

            this.initStatus = 'await this.refreshWalletsStore(true)'

            exchangeActions.init()

            this.initStatus = 'await ExchangeActions.init()'

            dispatch(setInitState(true))

            this.initStatus = 'dispatch(setInitState(true))'

            Log.log('ACT/App init application finished')

            this.initStatus = 'const { daemon } = config'

            Daemon.start()

            this.initStatus = 'updateExchangeOrdersDaemon.updateEventHandler'

            AppLockScreenIdleTime.init()

            this.initStatus = 'AppLockScreenIdleTime.init()'

            // noinspection ES6MissingAwait
            setCards()

            this.initStatus = 'setCards()'

        } catch (e) {
            Log.err('ACT/App init application error ' + this.initStatus + ' ' + e.message)
            console.log(e)
            this.initError = e.message
            dispatch(setInitError(e.message))
        }
        try {
            // noinspection ES6MissingAwait
            AppVersionControl.init()
        } catch (e) {
            // do nothing
        }
    }

    refreshWalletsStore = async (firstTimeCall) => {

        Log.log('ACT/App appRefreshWalletsStates called')

        // @misha plz consider move to Exchange actions daemonActions.clearExchangeOrdersData()

        await walletActions.setAvailableWallets()

        await setSelectedWallet()

        await currencyActions.init()

        await updateAccountsDaemon.forceDaemonUpdate()

        updateAppNewsDaemon.forceDaemonUpdate()

        appNewsActions.displayPush()

        Log.log('ACT/App appRefreshWalletsStates CashBack.init ' + (firstTimeCall ? ' first time ' : ''))

        Cashback.init()

        Log.log('ACT/App appRefreshWalletsStates finished')

    }

}

export default new App()
