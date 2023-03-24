/**
 * @version 0.11
 */
import Log from '@app/services/Log/Log'
import config from '@app/config/config'
import BlocksoftTransactions from '@crypto/actions/BlocksoftTransactions/BlocksoftTransactions'

class UpdateAccountPendingTransactions {

    updateAccountPendingTransactions = async (callParams = {}) => {
        const source = callParams.source || 'FRONT'
        let result = false
        try {
            result = await (BlocksoftTransactions.getTransactionsPending({account : {currencyCode : 'TRX'}}, 'AccountRunPending from ' + source)) // only trx for now
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateAccountPendingTransactions error ' + source + ' ' + e.message, e)
            }
            Log.errDaemon('UpdateAccountPendingTransactions error ' + source + ' ' + e.message)
        }
        return result
    }
}


const singleton = new UpdateAccountPendingTransactions()
export default singleton
