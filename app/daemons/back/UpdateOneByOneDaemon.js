/**
 * @version 0.11
 */
import Update from '../Update'

import UpdateCurrencyRateDaemon from './UpdateCurrencyRateDaemon'
import UpdateAccountBalanceAndTransactions from './UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from './UpdateAccountBalanceAndTransactionsHD'
import UpdateAppNewsDaemon from './UpdateAppNewsDaemon'
import UpdateAppTasksDaemon from './UpdateAppTasksDaemon'
import UpdateCardsDaemon from './UpdateCardsDaemon'
import UpdateTradeOrdersDaemon from './UpdateTradeOrdersDaemon'
import UpdateCashBackDataDaemon from './UpdateCashBackDataDaemon'
import { AsyncStorage } from 'react-native'

import Log from '../../services/Log/Log'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'

const STEPS_ORDER = [

    'UPDATE_APP_TASKS_HD_DAEMON',

    'UPDATE_RATES_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',
    'UPDATE_NEWS_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_HD_DAEMON',

    'UPDATE_RATES_DAEMON',
    'UPDATE_TRADE_ORDERS',
    'UPDATE_NEWS_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',

    'UPDATE_RATES_DAEMON',
    'UPDATE_CASHBACK_DATA',
    'UPDATE_NEWS_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',

    'UPDATE_RATES_DAEMON',
    'UPDATE_APP_TASKS_DAEMON',
    'UPDATE_NEWS_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON_ALL',

    'UPDATE_RATES_DAEMON',
    'UPDATE_CARDS_DAEMON',
    'UPDATE_NEWS_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',


]

let CACHE_PAUSE = 0

const CACHE_TIMES = {}

let CACHE_STOPPED = false

const CACHE_VALID_TIME = {
    'PAUSE' : 60000, // 60 seconds
    'UPDATE_TRADE_ORDERS': 30000, // 30 seconds
    'UPDATE_CASHBACK_DATA': 300000, // 5 minutes
    'UPDATE_APP_TASKS_HD_DAEMON': 30000, // 30 seconds
    'UPDATE_APP_TASKS_DAEMON': 300000, // 5 minutes
    'UPDATE_CARD_DAEMON': 60000, // 1 minute
    'UPDATE_RATES_DAEMON': 10000, // 10 second
    'UPDATE_NEWS_DAEMON': 600000, // 10 minutes
    'UPDATE_ACCOUNT_BALANCES_DAEMON': 10000, // 10 sec
    'UPDATE_ACCOUNT_BALANCES_DAEMON_ALL': 100000, // 100 sec
    'UPDATE_ACCOUNT_BALANCES_HD_DAEMON': 30000 // 30 sec
}

class UpdateOneByOneDaemon extends Update {

    _currentStep = 0

    constructor(props) {
        super(props)
        this.updateFunction = this.updateOneByOneDaemon
        this._canUpdate = true
    }

    init = async () => {
        let tmp = await AsyncStorage.getItem('backDaemonStep')
        tmp = tmp * 1
        if (tmp > 0) {
            this._currentStep = tmp
        }
    }

    stop = () => {
        CACHE_STOPPED = true
    }

    unstop = () => {
        CACHE_STOPPED = false
    }

    pause = () => {
        CACHE_PAUSE = new Date().getTime()
    }

    updateOneByOneDaemon = async (params, level = 0) => {
        if (CACHE_STOPPED) return false

        const tmpAuthHash = await cryptoWalletsDS.getSelectedWallet()
        if (!tmpAuthHash) {
            return false
        }

        const source = params.source || 'FRONT'
        if (!this._canUpdate) {
            return false
        }
        const now = new Date().getTime()
        if (CACHE_PAUSE > 0 && now - CACHE_PAUSE < CACHE_VALID_TIME.PAUSE) {
            return false
        }
        this._canUpdate = false

        try {
            this._currentStep++
            if (this._currentStep >= STEPS_ORDER.length) {
                this._currentStep = 0
            }
            const step = STEPS_ORDER[this._currentStep]
            // console.log('STEP', step)
            await AsyncStorage.setItem('backDaemonStep', this._currentStep + '')
            if (typeof CACHE_TIMES[step] !== 'undefined' && now - CACHE_TIMES[step] < CACHE_VALID_TIME[step]) {
                // console.log(new Date().toISOString() + ' ' + this._currentStep + ' skipped ' + step)
                this._canUpdate = true
                if (level < 10) {
                    await this.updateOneByOneDaemon(params, level + 1)
                }
                return
            }
            // console.log(new Date().toISOString() + ' ' + this._currentStep + ' step in ' + step)
            CACHE_TIMES[step] = now
            switch (step) {
                case 'UPDATE_TRADE_ORDERS' :
                    await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ source })
                    break
                case 'UPDATE_CASHBACK_DATA' :
                    if (source === 'BACK') return
                    await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ source })
                    break
                case 'UPDATE_APP_TASKS_HD_DAEMON':
                    await UpdateAppTasksDaemon.updateAppTasksDaemon({ taskName: 'DISCOVER_HD' })
                    break
                case 'UPDATE_APP_TASKS_DAEMON' :
                    await UpdateAppTasksDaemon.updateAppTasksDaemon({})
                    break
                case 'UPDATE_CARD_DAEMON' :
                    if (source === 'BACK') return
                    await UpdateCardsDaemon.updateCardsDaemon()
                    break
                case 'UPDATE_RATES_DAEMON':
                    await UpdateCurrencyRateDaemon.updateCurrencyRate({source})
                    break
                case 'UPDATE_NEWS_DAEMON' :
                    await UpdateAppNewsDaemon.updateAppNewsDaemon()
                    break
                case 'UPDATE_ACCOUNT_BALANCES_DAEMON':
                    await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ source })
                    break
                case 'UPDATE_ACCOUNT_BALANCES_DAEMON_ALL':
                    await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ source, allWallets : true })
                    break
                case 'UPDATE_ACCOUNT_BALANCES_HD_DAEMON':
                    await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({ source })
                    break
                default:
                    // do nothing
                    break
            }
        } catch (e) {
            Log.errDaemon('UpdateOneByOne error ' + e.message)
        }

        this._canUpdate = true
    }
}

export default new UpdateOneByOneDaemon()
