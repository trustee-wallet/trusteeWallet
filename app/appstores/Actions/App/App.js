import { Text } from 'react-native'

import Orientation from 'react-native-orientation'

import '../../SubcribeIndex'

import store from '../../../store'

import walletDS from '../../DataSource/Wallet/Wallet'

import Log from '../../../services/Log/Log'

import {
    setCurrencies,
    setAvailableWallets,
    setInitState,
    setInitError,
    setSelectedWallet,
    setCards
} from '../MainStoreActions'
import settingsActions from '../SettingsActions'
import AuthActions from '../AuthActions'

import DBOpen from '../../DataSource/DB/DBOpen'

import DBInit from '../../DataSource/DB/DBInit/DBInit'

import LockScreenIdleTime from '../../../services/LockScreenIdleTime'

import NavStore from '../../../components/navigation/NavStore'

import updateCurrencyRateDaemon from '../../../services/Daemon/classes/UpdateCurrencyRate'
import updateAccountTransactionsDaemon from '../../../services/Daemon/classes/UpdateAccountTransactions'
import updateAccountBalanceDaemon from '../../../services/Daemon/classes/UpdateAccountBalance'
import updateExchangeOrdersDaemon from '../../../services/Daemon/classes/UpdateExchangeOrders'

import daemonActions from '../DaemonActions.js'

import config from '../../../config/config'
import Cashback from '../../../services/Cashback/Cashback'
import FiatRatesActions from '../FiatRatesActions'
import ExchangeActions from '../ExchangeActions'

import customCurrencyActions from '../CustomCurrencyActions'
import VersionControl from '../../../services/VersionControl'

const { dispatch, getState } = store

if (Text.defaultProps == null) Text.defaultProps = {}
Text.defaultProps.allowFontScaling = false


class App {

    initStatus = 'init started'
    initError = 'empty'

    init = async (navigateToInit = true) => {

        try {

            Orientation.lockToPortrait()

            const { init } = getState().mainStore

            if (init === true) {
                dispatch(setInitState(true))
                return
            }

            this.initStatus = 'Orientation.lockToPortrait()'
            console.log('Orientation.lockToPortrait()')

            Log.log('ACT/App init application called')

            if(navigateToInit){

                await DBOpen.open()

                this.initStatus = 'await DBOpen.open()'

                await DBInit.init()

                this.initStatus = 'await DBInit.init()'
                console.log('await DBInit.init()')

                if (!(await walletDS.hasWallet())) {

                    // await proceedGenerateWallet()

                    this.initStatus = '!(await walletDS.hasWallet())'
                    console.log('!(await walletDS.hasWallet())')

                    Log.log('ACT/App no wallets found')

                    NavStore.reset('WalletCreateScreen')
                    // NavStore.reset('InitScreen')

                    this.initStatus = 'NavStore.reset(\'WalletCreateScreen\')'
                    console.log('NavStore.reset(\'WalletCreateScreen\')')

                    return
                }

                NavStore.reset('InitScreen')

                this.initStatus = 'NavStore.reset(\'InitScreen\')'
                console.log('NavStore.reset(\'InitScreen\')')

                return
            }

            //https://etherscan.io/token/0xd26114cd6EE289AccF82350c8d8487fedB8A0C07
            //https://tronscan.org/#/token20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7

            /*let checked = await customCurrencyActions.checkCustomCurrency({
                tokenType : 'ETH_ERC_20',
                tokenAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
            })
            await customCurrencyActions.addCustomCurrency({
                currencyCode: checked.currencyCode,
                currencyName: checked.currencyName,
                tokenType : checked.tokenType,
                tokenAddress: checked.tokenAddress,
                tokenDecimals: checked.tokenDecimals
            })

            let checkedTrx = await customCurrencyActions.checkCustomCurrency({
                tokenType : 'TRX',
                tokenAddress: '1002578',
            })
            await customCurrencyActions.addCustomCurrency({
                currencyCode: checkedTrx.currencyCode,
                currencyName: checkedTrx.currencyName,
                tokenType : checkedTrx.tokenType,
                tokenAddress: checkedTrx.tokenAddress,
                tokenDecimals: checkedTrx.tokenDecimals
            })

            let checkedTrx2 = await customCurrencyActions.checkCustomCurrency({
                tokenType : 'TRX',
                tokenAddress: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
            })
            await customCurrencyActions.addCustomCurrency({
                currencyCode: checkedTrx2.currencyCode,
                currencyName: checkedTrx2.currencyName,
                tokenType : checkedTrx2.tokenType,
                tokenAddress: checkedTrx2.tokenAddress,
                tokenDecimals: checkedTrx2.tokenDecimals
            })
            */

            await customCurrencyActions.importCustomCurrenciesToDict()

            await AuthActions.init()

            this.initStatus = 'await AuthActions.init()'

            await settingsActions.getSettings()

            this.initStatus = 'await settingsActions.getSettings()'

            await FiatRatesActions.init()

            this.initStatus = 'await FiatRatesActions.init()'

            await this.refreshWalletsStore(true)

            this.initStatus = 'await this.refreshWalletsStore(true)'

            ExchangeActions.init()

            this.initStatus = 'await ExchangeActions.init()'

            dispatch(setInitState(true))

            this.initStatus = 'dispatch(setInitState(true))'

            Log.log('ACT/App init application finished')

            const { daemon } = config

            this.initStatus = 'const { daemon } = config'

            /**
             * @namespace Flow.updateRates
             */
            updateCurrencyRateDaemon.updateEventHandler = async (rates) => {
                daemonActions.setCurrencyRateDaemonData(rates)
            }

            this.initStatus = 'updateCurrencyRateDaemon.updateEventHandler'

            /**
             * @namespace Flow.updateAccountBalance
             */
            updateAccountBalanceDaemon.updateEventHandler = async (accounts) => {
                daemonActions.setAccountBalanceDaemonData(accounts)
            }

            this.initStatus = 'updateAccountBalanceDaemon.updateEventHandler'

            /**
             * @namespace Flow.updateAccountTransactions
             */
            updateAccountTransactionsDaemon.updateEventHandler = async (accounts) => {
                daemonActions.setAccountTransactionsDaemonData(accounts)
            }

            this.initStatus = 'updateAccountTransactionsDaemon.updateEventHandler'

            /**
             * @namespace Flow.updateExchangeOrders
             */
            updateExchangeOrdersDaemon.updateEventHandler = async (exchangeOrders) => {
                daemonActions.setExchangeOrdersData({ exchangeOrders })
            }

            this.initStatus = 'updateExchangeOrdersDaemon.updateEventHandler'
            updateAccountTransactionsDaemon.setTime(daemon.updateTimes.updateAccountTransactions).start()
            updateAccountBalanceDaemon.setTime(daemon.updateTimes.updateAccountBalance).start()
            updateCurrencyRateDaemon.setTime(daemon.updateTimes.updateCurrencyRate).start()
            updateExchangeOrdersDaemon.setTime(daemon.updateTimes.updateExchangeOrders).start()

            this.initStatus = 'updateExchangeOrdersDaemon.updateEventHandler'

            LockScreenIdleTime.init()

            this.initStatus = 'LockScreenIdleTime.init()'

            setCards()

            this.initStatus = 'setCards()'

            VersionControl.init()

        } catch (e) {
            Log.err('ACT/App init application error ' + e.message)
            console.log(e)
            this.initError = e.message
            dispatch(setInitError(e.message))
        }
    }

    refreshWalletsStore = async (firstTimeCall) => {

        Log.log('ACT/App appRefreshWalletsStates called')

        daemonActions.clearExchangeOrdersData()

        await setAvailableWallets()

        await setSelectedWallet()

        await setCurrencies()

        if (firstTimeCall) {
            Log.log('ACT/App appRefreshWalletsStates Cashback.init first time')
            Cashback.init()
        } else {
            Log.log('ACT/App appRefreshWalletsStates Cashback.init')
            Cashback.init()
        }

        Log.log('ACT/App appRefreshWalletsStates finished')

    }

}

export default new App()
