/**
 * @version 0.11
 */
import UpdateOneByOneDaemon from './back/UpdateOneByOneDaemon'

import UpdateAccountListDaemon from './view/UpdateAccountListDaemon'
import UpdateCurrencyRateDaemon from './back/UpdateCurrencyRateDaemon'
import UpdateCashBackDataDaemon from './back/UpdateCashBackDataDaemon'

import config from '../config/config'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'

let CACHE_STARTED = false

export default {

    async start () {
        if (CACHE_STARTED) return false
        const { daemon } = config
        UpdateOneByOneDaemon
            .setTime(daemon.updateTimes.oneByOne)
            .start()
        UpdateAccountListDaemon
            .setTime(daemon.updateTimes.view)
            .start()
        CACHE_STARTED = true
    },

    async forceAll(params) {
        if (typeof params.noRatesApi === 'undefined') {
            await UpdateCurrencyRateDaemon.updateCurrencyRate(params)
        }
        await UpdateAccountListDaemon.forceDaemonUpdate(params)
        // await UpdateAppNewsDaemon.updateAppNewsDaemon(params)
        if (typeof params.noCashbackApi === 'undefined') {
            await UpdateCashBackDataDaemon.updateCashBackDataDaemon(params)
        }
        if (typeof params.noCards === 'undefined') {
            await UpdateCardsDaemon.updateCardsDaemon(params)
        }
    }
}
