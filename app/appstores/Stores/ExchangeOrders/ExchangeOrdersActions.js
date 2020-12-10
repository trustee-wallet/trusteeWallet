/**
 * @version 0.30
 */
import store from '../../../store'

const { dispatch } = store

export default new class ExchangeOrdersActions {

    setExchangeOrderList = exchangeOrderList => {
        dispatch({
            type: 'SET_EXCHANGE_ORDERS_DATA',
            walletHash : exchangeOrderList.walletHash,
            exchangeOrders: exchangeOrderList.tradeOrders
        })
    }
}

