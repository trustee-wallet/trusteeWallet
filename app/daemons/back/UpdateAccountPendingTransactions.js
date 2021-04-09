/**
 * @version 0.11
 */
import Log from '@app/services/Log/Log'
import config from '@app/config/config'
import BlocksoftTransactions from '@crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

class UpdateAccountPendingTransactions {

    updateAccountPendingTransactions = async (callParams) => {
        Log.daemon('UpdateAccountPendingTransactions called ' + JSON.stringify(callParams))
        const source = callParams.source || 'FRONT'
        try {
            await (BlocksoftTransactions.getTransactionsPending({account : {currencyCode : 'TRX'}}, 'AccountRunPending from ' + source)) // only trx for now
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountPendingTransactions error ' + source + ' ' + e.message, e)
            }
            Log.errDaemon('UpdateAccountPendingTransactions error ' + source + ' ' + e.message)
        }
    }
}


const singleton = new UpdateAccountPendingTransactions()
export default singleton
