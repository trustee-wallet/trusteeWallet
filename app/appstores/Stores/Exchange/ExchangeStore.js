const INITIAL_STATE = {
    accountList: [],
    cryptocurrencyList: [],
    exchangeType: '',
    exchangeOrders: [],
    data: {}
};

const exchangeReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_EXCHANGE_DATA':
            return new Object({
                ...state,
                data: action.data,
            });
        case 'SET_EXCHANGE_TYPE':
            return new Object({
                ...state,
                exchangeType: action.exchangeType,
            });
        case 'SET_EXCHANGE_ACCOUNT_LIST':
            return new Object({
                ...state,
                accountList: action.accountList,
            });
        case 'SET_EXCHANGE_CRYPTOCURRENCY_LIST':
            return new Object({
                ...state,
                cryptocurrencyList: action.cryptocurrencyList,
            });
        case 'SET_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: action.exchangeOrders,
            });
        case 'CLEAR_EXCHANGE_ORDERS_DATA':
            return new Object({
                ...state,
                exchangeOrders: [],
            });
        default:
            return state;
    }
};

export default exchangeReducer;