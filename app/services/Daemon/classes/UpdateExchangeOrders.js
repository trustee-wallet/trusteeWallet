import Update from './Update'

import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'

import api from '../../api'


class UpdateExchangeOrders extends Update {


    constructor(props) {
        super(props)
        this.updateFunction = this.updateExchangeOrders
    }


    /**
     * @namespace Flow.updateExchange
     * @return {Promise<void>}
     */
    updateExchangeOrders = async () => {

        Log.daemon('DMN/UpdateExchangeOrders called')

        try {
            const res = await api.getExchangeOrders()

            if(res.data.state === 'success'){
                const { buy, sell } = res.data.data

                MarketingEvent.checkBuyResults(buy)
                //INFO: prepare orders

                const tmpBuyOrders = buy.map(obj => ({ ...obj, type: 'BUY' }))

                const tmpSellOrders = sell.map(obj => ({ ...obj, type: 'SELL' }))

                let exchangeOrders = tmpBuyOrders.concat(tmpSellOrders)

                exchangeOrders = exchangeOrders.sort((a, b) => b.createdAt - a.createdAt)

                this.updateEventHandler(exchangeOrders)

                Log.daemon('DMN/UpdateExchangeOrders success')

            } else {
                Log.errDaemon('DMN/UpdateExchangeOrders error with data ', res.data)
            }
        } catch (e) {
            if (e.message !== 'No cashbackToken') {
                Log.errDaemon('DMN/UpdateExchangeOrders error ', e.message)
            } else {
                Log.daemon('DMN/UpdateExchangeOrders notice ', e.message)
            }
        }
    }

}

export default new UpdateExchangeOrders
