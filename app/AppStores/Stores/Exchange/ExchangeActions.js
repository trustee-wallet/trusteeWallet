/**
 * @version 0.9
 * @misha maybe other actions also make as classes ? to unify
 */
import store from '../../../store'

import Api from '../../../services/Api/Api'
import Log from '../../../services/Log/Log'

const { dispatch } = store


export function setExchangeData(data) {
    dispatch({
        type: 'SET_EXCHANGE_DATA',
        data: data
    })
}

export default new class ExchangeActions {

    init = async () => {
        try {
            const res = await Api.getExchangeData()

            const tradeApiConfig = res.data.exchangeWays.buy.concat(res.data.exchangeWays.sell)
            const exchangeApiConfig = res.data.exchangeWays.exchange

            dispatch({
                type: 'SET_TRADE_API_CONFIG',
                tradeApiConfig: { exchangeWays: tradeApiConfig }
            })
            dispatch({
                type: 'SET_EXCHANGE_API_CONFIG',
                exchangeApiConfig
            })
        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('ACT/Exchange InitialScreen error 1 ' + e.message)
            } else {
                Log.err('ACT/Exchange InitialScreen error 11 ' + e.message)
            }
        }
    }

    handleSetTradeType = tradeTypeObj => {
        dispatch({
            type: 'SET_TRADE_TYPE',
            tradeType: tradeTypeObj.tradeType
        })
    }

    setExchangeOrderList = exchangeOrderList => {
        dispatch({
            type: 'SET_EXCHANGE_ORDERS_DATA',
            exchangeOrders: exchangeOrderList
        })
    }
}

