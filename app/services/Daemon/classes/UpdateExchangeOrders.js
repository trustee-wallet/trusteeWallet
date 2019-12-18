import Update from './Update'

import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'

import api from '../../api'


class UpdateExchangeOrders extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateExchangeOrders
        this.tryCounter = 0
    }


    /**
     * @namespace Flow.updateExchange
     * @return {Promise<void>}
     */
    updateExchangeOrders = async () => {

        Log.daemon('DMN/UpdateExchangeOrders called')

        try {
            const res = await api.getExchangeOrders()

            //console.log('updateExchangeOrders')
            //console.log(res)

            let exchangeOrders = res.data

            if ( exchangeOrders) {

                //INFO: prepare orders

                exchangeOrders = exchangeOrders.sort((a, b) => b.createdAt - a.createdAt)

                const toMarketingEvent = exchangeOrders.filter(item => item.exchangeWayType === 'BUY')

                MarketingEvent.checkBuyResults(toMarketingEvent)

                this.updateEventHandler(exchangeOrders)

                Log.daemon('DMN/UpdateExchangeOrders success')

                this.tryCounter = 0
            }

        } catch (e) {
            if (Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.daemon('DMN/UpdateExchangeOrders network try ' + this.tryCounter + ' ' + e.message)
            } else if (e.message !== 'No cashbackToken') {
                Log.errDaemon('DMN/UpdateExchangeOrders error ' + e.message)
            } else {
                Log.daemon('DMN/UpdateExchangeOrders notice ' + e.message)
            }
        }
    }

}

export default new UpdateExchangeOrders
