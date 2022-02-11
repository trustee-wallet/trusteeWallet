/**
 * @version 0.11
 */
import Update from '../Update'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountPendingTransactions from '@app/daemons/back/UpdateAccountPendingTransactions'
import UpdateAppNewsDaemon from '@app/daemons/back/UpdateAppNewsDaemon'

import Log from '@app/services/Log/Log'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import Database from '@app/appstores/DataSource/Database'

const STEPS_ORDER = [
    'UPDATE_PROXIED',
    'UPDATE_ACCOUNT_PENDING_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',
    'UPDATE_ACCOUNT_PENDING_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_HD_DAEMON',
    'UPDATE_PROXIED',
    'UPDATE_ACCOUNT_PENDING_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',
    'UPDATE_ACCOUNT_PENDING_DAEMON',
    'UPDATE_ACCOUNT_BALANCES_DAEMON',
]

let CACHE_PAUSE = 0

const CACHE_TIMES = {}

let CACHE_STOPPED = false

const CACHE_VALID_TIME = {
    'PAUSE' : 60000, // 60 seconds
    'UPDATE_ACCOUNT_PENDING_DAEMON' : 30000, // 30 seconds
    'UPDATE_PROXIED' : 120000, // 120 seconds
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
        // nothing
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

    unpause = () => {
        CACHE_PAUSE = 0
    }

    updateOneByOneDaemon = async (params, level = 0) => {

        await Database.checkVersion()

        if (CACHE_STOPPED) {
            return false
        }

        const tmpAuthHash = await settingsActions.getSelectedWallet('updateOneByOneDaemon')
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
                case 'UPDATE_PROXIED' :
                    await UpdateAppNewsDaemon.updateAppNewsDaemon({source})
                    break
                case 'UPDATE_ACCOUNT_PENDING_DAEMON':
                    await UpdateAccountPendingTransactions.updateAccountPendingTransactions({source})
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
