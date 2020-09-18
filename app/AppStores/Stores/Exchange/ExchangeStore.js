/**
 * @version 0.9
 */

const INITIAL_STATE = {
    accountList: [],
    cryptocurrencyList: [],
    exchangeType: '',
    exchangeOrders: [],
    data: {},
    tradeType: '',
    tradePrevCC: 'BTC',
    tradePrevFC: false,
    tradePrevID: false,
    tradePrevCardID : false,
    exchangeInCC : false,
    exchangeOutCC: false,
    advEmail : '',
    advWallet : '',
    perfectWallet : '',
    payeerWallet : '',
    tradeApiConfig: {},
    exchangeApiConfig: []
}

const exchangeStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_TRADE_API_CONFIG':
            return new Object({
                ...state,
                tradeApiConfig: action.tradeApiConfig
            })
        case 'SET_TRADE_PREV':
            return new Object({
                ...state,
                tradePrevCC: action.tradePrevCC,
                tradePrevFC: action.tradePrevFC,
                tradePrevID: action.tradePrevID,
                tradePrevCardID : action.tradePrevCardID,
                exchangeInCC : action.exchangeInCC,
                exchangeOutCC : action.exchangeOutCC,
                advEmail : action.advEmail,
                advWallet : action.advWallet,
                perfectWallet : action.perfectWallet,
                payeerWallet : action.payeerWallet
            })
        case 'SET_EXCHANGE_API_CONFIG':
            return new Object({
                ...state,
                exchangeApiConfig: action.exchangeApiConfig
            })
        case 'SET_EXCHANGE_DATA':
            return new Object({
                ...state,
                data: action.data
            })
        case 'SET_EXCHANGE_TYPE':
            return new Object({
                ...state,
                exchangeType: action.exchangeType
            })
        case 'SET_TRADE_TYPE':
            return new Object({
                ...state,
                tradeType: action.tradeType
            })
        case 'SET_EXCHANGE_ACCOUNT_LIST':
            return new Object({
                ...state,
                accountList: action.accountList
            })
        case 'SET_EXCHANGE_CRYPTOCURRENCY_LIST':
            return new Object({
                ...state,
                cryptocurrencyList: action.cryptocurrencyList
            })
        case 'SET_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: action.exchangeOrders
            })
        case 'CLEAR_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: []
            })
        default:
            return state
    }
}

export default exchangeStoreReducer
