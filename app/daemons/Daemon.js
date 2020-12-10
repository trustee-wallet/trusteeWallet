/**
 * @version 0.11
 */
import UpdateOneByOneDaemon from './back/UpdateOneByOneDaemon'

import UpdateAccountListDaemon from './view/UpdateAccountListDaemon'
import UpdateAppNewsListDaemon from './view/UpdateAppNewsListDaemon'
import UpdateCurrencyRateDaemon from './back/UpdateCurrencyRateDaemon'
import UpdateCurrencyListDaemon from './view/UpdateCurrencyListDaemon'

import config from '../config/config'
import UpdateAppNewsDaemon from './back/UpdateAppNewsDaemon'
import UpdateTradeOrdersDaemon from './back/UpdateTradeOrdersDaemon'

class Daemon {

    start = async () => {
        const { daemon } = config
        UpdateOneByOneDaemon
            .setTime(daemon.updateTimes.oneByOne)
            .start()
        UpdateCurrencyListDaemon
            .setTime(daemon.updateTimes.view)
            .start()
        UpdateAccountListDaemon
            .setTime(daemon.updateTimes.view)
            .start()
        UpdateAppNewsListDaemon
            .setTime(daemon.updateTimes.view)
            .start()
    }

    forceAll = async (params) => {
        if (typeof params.noRatesApi === 'undefined') {
            await UpdateCurrencyRateDaemon.updateCurrencyRate(params)
        }
        await UpdateCurrencyListDaemon.updateCurrencyListDaemon(params)
        await UpdateAccountListDaemon.forceDaemonUpdate(params)
        await UpdateAppNewsDaemon.updateAppNewsDaemon(params)
        await UpdateAppNewsListDaemon.updateAppNewsListDaemon(params)
        await UpdateTradeOrdersDaemon.fromDB()
    }
}

export default new Daemon
