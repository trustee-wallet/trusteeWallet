import store from '../../store'

const { dispatch } = store

const daemonActions = {
    /**
     * @namespace Flow.updateRates
     */
    setCurrencyRateDaemonData: (rates) => {
        dispatch({
            type: 'SET_CURRENCY_RATE_DAEMON_DATA',
            currencyRateDaemonData: { updated : new Date().getTime(), rates }
        })
    },

    /**
     * @namespace Flow.updateAccountBalance
     */
    setAccountBalanceDaemonData: (accounts) => {
        dispatch({
            type: 'SET_ACCOUNT_BALANCE_DAEMON_DATA',
            accountBalanceDaemonData: { updated : new Date().getTime(), accounts }
        })
    },

    /**
     * @namespace Flow.updateAccountTransactions
     */
    setAccountTransactionsDaemonData: (accounts) => {
        dispatch({
            type: 'SET_ACCOUNT_TRANSACTIONS_DAEMON_DATA',
            accountTransactionsDaemonData: { updated : new Date().getTime(), accounts }
        })
    },

    /**
     * @namespace Flow.updateExchangeOrders
     */
    setExchangeOrdersData: (param) => {
        dispatch({
            type: 'SET_EXCHANGE_ORDERS_DATA',
            exchangeOrders: param.exchangeOrders
        })
    },

    /**
     * @namespace Flow.clearExchangeOrders
     */
    clearExchangeOrdersData: () => {
        dispatch({
            type: 'CLEAR_EXCHANGE_ORDERS_DATA'
        })
    }

}

export default daemonActions
