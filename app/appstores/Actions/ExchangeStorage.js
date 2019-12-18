import store from '../../store';

const { dispatch } = store;


export function setExchangeData(data) {
    dispatch({
        type: 'SET_EXCHANGE_DATA',
        data: data
    });
}


export function setExchangeAccountList(data) {
    dispatch({
        type: 'SET_EXCHANGE_ACCOUNT_LIST',
        accountList: data.accountList
    });
}

export function setExchangeCryptocurrenciesList(data) {
    dispatch({
        type: 'SET_EXCHANGE_CRYPTOCURRENCY_LIST',
        cryptocurrencyList: data.cryptocurrencyList
    });
}