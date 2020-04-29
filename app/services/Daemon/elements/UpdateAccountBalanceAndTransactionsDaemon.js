/**
 * @version 0.9
 */
import Update from './Update'
import UpdateAccountBalanceAndTransactions from './UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from './UpdateAccountBalanceAndTransactionsHD'

import Log from '../../Log/Log'

import updateAppTasksDaemon from './UpdateAppTasksDaemon'
import updateAppNewsDaemon from './UpdateAppNewsDaemon'

class UpdateAccountBalanceAndTransactionsDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountBalanceAndTransactions
    }

    updateAccountBalanceAndTransactions = async (params) => {
        if (!this._canUpdate) return

        this._canUpdate = false

        Log.daemon('UpdateAccountBalanceAndTransactionsDaemon started')

        await UpdateAccountBalanceAndTransactionsHD.oneRun(params)

        await UpdateAccountBalanceAndTransactions.oneRun(params)

        Log.daemon('UpdateAccountBalanceAndTransactionsDaemon finished')

        if (updateAppTasksDaemon._isSkipped) {
            await updateAppTasksDaemon.updateAppTasksDaemon()
        }

        if (updateAppNewsDaemon._isSkipped) {
            await updateAppTasksDaemon.updateAppTasksDaemon()
        }

        this._canUpdate = true
    }
}


const singleton = new UpdateAccountBalanceAndTransactionsDaemon()
export default singleton
