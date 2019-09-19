import { Text } from 'react-native'
if (Text.defaultProps == null) Text.defaultProps = {}
Text.defaultProps.allowFontScaling = false

import Orientation from 'react-native-orientation'

import '../../SubcribeIndex'

import store from '../../../store'

import walletDS from '../../DataSource/Wallet/Wallet'

import Log from '../../../services/Log/Log'

import {
    setCurrencies,
    setAvailableWallets,
    setInitState,
    setSelectedWallet,
    proceedGenerateWallet,
    setCards
} from '../MainStoreActions'
import settingsActions from '../SettingsActions'
import AuthActions from '../AuthActions'

import DBOpen from '../../DataSource/DB/DBOpen'

import DBInit from '../../DataSource/DB/DBInit/DBInit'

import LockScreenIdleTime from '../../../services/LockScreenIdleTime'

const { dispatch, getState } = store


import updateCurrencyRateDaemon from '../../../services/Daemon/classes/UpdateCurrencyRate'
import updateAccountTransactionsDaemon from '../../../services/Daemon/classes/UpdateAccountTransactions'
import updateAccountBalanceDaemon from '../../../services/Daemon/classes/UpdateAccountBalance'
import updateExchangeOrdersDaemon from '../../../services/Daemon/classes/UpdateExchangeOrders'

import daemonActions from '../DaemonActions.js'
import OtherActions from '../OtherActions'

import DBMigrateCritical from '../../DataSource/DB/DBMigrateCritical/DBMigrateCritical'

import config from '../../../config/config'
import Cashback from '../../../services/Cashback/Cashback'
import FiatRatesActions from '../FiatRatesActions'


class App {

    init = async () => {

        const { init } = getState().mainStore

        if(init === true) {
            dispatch(setInitState(true))
            return
        }

        Orientation.lockToPortrait()

        Log.log('ACT/App init application called')

        await DBOpen.open()

        await DBMigrateCritical.run()

        await DBInit.init()

        await AuthActions.init()

        await settingsActions.getSettings()

        await FiatRatesActions.init()

        const { array: wallets } = await walletDS.getWallets()

        if (!wallets[0]) {
            await proceedGenerateWallet()
        }

        // if (!await cryptoWallets.checkWalletsExists()) {
        //     await proceedGenerateWallet()
        // }

        await this.refreshWalletsStore()

        dispatch(setInitState(true))

        OtherActions.licenceTermsCheck()

        Log.log('ACT/App init application finished')

        const { daemon } = config

        /**
         * @namespace Flow.updateRates
         */
        updateCurrencyRateDaemon.updateEventHandler = async (rates) => {
            daemonActions.setCurrencyRateDaemonData(rates)
        }

        /**
         * @namespace Flow.updateAccountBalance
         */
        updateAccountBalanceDaemon.updateEventHandler = async (accounts) => {
            daemonActions.setAccountBalanceDaemonData(accounts)
        }

        /**
         * @namespace Flow.updateAccountTransactions
         */
        updateAccountTransactionsDaemon.updateEventHandler = async (accounts) => {
            daemonActions.setAccountTransactionsDaemonData(accounts)
        }

        /**
         * @namespace Flow.updateExchangeOrders
         */
        updateExchangeOrdersDaemon.updateEventHandler = async (exchangeOrders) => {
            daemonActions.setExchangeOrdersData({ exchangeOrders })
        }

        updateAccountTransactionsDaemon.setTime(daemon.updateTimes.updateAccountTransactions).start()
        updateAccountBalanceDaemon.setTime(daemon.updateTimes.updateAccountBalance).start()
        updateCurrencyRateDaemon.setTime(daemon.updateTimes.updateCurrencyRate).start()
        updateExchangeOrdersDaemon.setTime(daemon.updateTimes.updateExchangeOrders).start()


        LockScreenIdleTime.init()

        setCards()
    }

    refreshWalletsStore = async () => {

        Log.log('ACT/App appRefreshWalletsStates called')

        daemonActions.clearExchangeOrdersData()

        await setAvailableWallets()

        await setSelectedWallet()

        await setCurrencies()

        Cashback.init()

        Log.log('ACT/App appRefreshWalletsStates finished')

    }

}

export default new App()
