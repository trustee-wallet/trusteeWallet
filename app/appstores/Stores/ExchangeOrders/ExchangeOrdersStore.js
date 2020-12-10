/**
 * @version 0.9
 */

const INITIAL_STATE = {
    exchangeOrders: [],
}

const exchangeOrdersStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: action.exchangeOrders
            })
        default:
            return state
    }
}

export default exchangeOrdersStoreReducer
