/**
 * @version 0.30
 */

const INITIAL_STATE = {
    exchangeOrders: [],
    walletHash : ''
}

const exchangeOrdersStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: action.exchangeOrders,
                walletHash : action.walletHash
            })
        default:
            return state
    }
}

export default exchangeOrdersStoreReducer
