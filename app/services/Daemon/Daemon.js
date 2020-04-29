/**
 * @version 0.9
 */
import updateCurrencyRateDaemon from '../../services/Daemon/elements/UpdateCurrencyRateDaemon'
import updateAccountBalanceAndTransactionsDaemon from  '../../services/Daemon/elements/UpdateAccountBalanceAndTransactionsDaemon'
import updateAccountsDaemon from '../../services/Daemon/elements/UpdateAccountsDaemon'
import updateAppTasksDaemon from '../../services/Daemon/elements/UpdateAppTasksDaemon'
import updateAppNewsDaemon from '../../services/Daemon/elements/UpdateAppNewsDaemon'
import updateTradeOrdersDaemon from '../../services/Daemon/elements/UpdateTradeOrdersDaemon'
import updateCardDaemon from '../../services/Daemon/elements/UpdateCardsDaemon'

import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'

import config from '../../config/config'

class Daemon {

    start = async () => {
        const { daemon } = config

        updateCurrencyRateDaemon
            .setDelay(daemon.delayTimes.updateCurrencyRate)
            .setTime(daemon.updateTimes.updateCurrencyRate)
            .start()

        updateAccountBalanceAndTransactionsDaemon
            .setDelay(daemon.delayTimes.updateAccountBalanceAndTransactions)
            .setTime(daemon.updateTimes.updateAccountBalanceAndTransactions)
            .start()

        updateAccountsDaemon
            .setDelay(daemon.delayTimes.updateAccounts)
            .setTime(daemon.updateTimes.updateAccounts)
            .start()

        updateAppTasksDaemon
            .setDelay(daemon.delayTimes.updateAppTasks)
            .setTime(daemon.updateTimes.updateAppTasks)
            .start()

        updateAppNewsDaemon
            .setDelay(daemon.delayTimes.updateAppNews)
            .setTime(daemon.updateTimes.updateAppNews)
            .start()

        updateTradeOrdersDaemon
            .setDelay(daemon.delayTimes.updateTradeOrders)
            .setTime(daemon.updateTimes.updateTradeOrders)
            .setUpdateEventHandler(ExchangeActions.setExchangeOrderList)
            .start()

        updateCardDaemon
            .setDelay(daemon.delayTimes.updateCard)
            .setTime(daemon.updateTimes.updateCard)
            .start()
    }
}

export default new Daemon
