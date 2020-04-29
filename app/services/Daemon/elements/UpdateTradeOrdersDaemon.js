/**
 * @version 0.9
 */
import Update from './Update'

import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'

import Api from '../../Api/Api'

import SettingsDS from '../../../appstores/DataSource/Settings/Settings'


const CACHE_VALID_TIME = 20000 // 2 minute
let CACHE_LAST_TIME = false

class UpdateTradeOrders extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateTradeOrders
        this.tryCounter = 0
    }

    updateTradeOrders = async (params) => {
        Log.daemon('UpdateTradeOrders called ' + JSON.stringify(params))
        if (typeof params.source !== 'undefined' && params.source === 'ACCOUNT_OPEN' && CACHE_LAST_TIME) {
            const now = new Date().getTime()
            const diff = now - CACHE_LAST_TIME
            if (diff < CACHE_VALID_TIME) {
                Log.daemon('UpdateTradeOrders skipped by diff ' + diff)
                return false
            }
        }

        const settingsDS = new SettingsDS()
        let tmpTradeOrders
        try {
            tmpTradeOrders = await settingsDS.getSetting('bseOrders')

            if(typeof tmpTradeOrders !== 'undefined' && tmpTradeOrders) {
                let tradeOrders = JSON.parse(tmpTradeOrders.paramValue)
                tradeOrders = tradeOrders.ordersList
                this.updateEventHandler(tradeOrders)
            }
        } catch (e) {
            Log.errDaemon('UpdateTradeOrders orders from db error ' + e.message, tmpTradeOrders)
        }

        try {
            let tradeOrdersToMarketingEvent = []
            let tmpTradeOrders = await Api.getExchangeOrders()

            if(typeof tmpTradeOrders !== 'undefined' && typeof tmpTradeOrders.data !== 'undefined' && tmpTradeOrders && tmpTradeOrders.data.length > 0) {
                tmpTradeOrders = tmpTradeOrders.data

                tradeOrdersToMarketingEvent = tmpTradeOrders.filter(item => item.exchangeWayType === 'BUY')
                MarketingEvent.checkBuyResults(tradeOrdersToMarketingEvent)

                tmpTradeOrders = tmpTradeOrders.sort((item1, item2) => item2.createdAt - item1.createdAt)
                tmpTradeOrders = tmpTradeOrders.slice(0, 19)

                this.updateEventHandler(tmpTradeOrders)

                tmpTradeOrders = JSON.stringify({ordersList: tmpTradeOrders})
                await settingsDS.setSettings('bseOrders', tmpTradeOrders)

                Log.daemon('UpdateTradeOrders success')
            }
            this.tryCounter = 0

        } catch (e) {
            if (Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.daemon('UpdateExchangeOrders network try ' + this.tryCounter + ' ' + e.message)
            } else if (e.message === 'No cashbackToken') {
                Log.daemon('UpdateExchangeOrders notice ' + e.message)
            } else {
                Log.errDaemon('UpdateExchangeOrders error ' + e.message)
            }
        }
        CACHE_LAST_TIME = new Date().getTime()
    }
}

export default new UpdateTradeOrders
