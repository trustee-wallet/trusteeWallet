const INITIAL_STATE = {
    currencyRateDaemonData: {
        updated: new Date().getTime(),
        rates: []
    },
    accountBalanceDaemonData: {
        updated: new Date().getTime(),
        accounts: []
    },
    accountTransactionsDaemonData: {
        updated: new Date().getTime(),
        accounts: []
    },
    walletFiatBalanceAmount: 0
};

const daemonReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        /**
         * @namespace Flow.updateRates
         */
        case 'SET_CURRENCY_RATE_DAEMON_DATA': {
            return {
                ...state,
                currencyRateDaemonData: action.currencyRateDaemonData,
            };
        }
        /**
         * @namespace Flow.updateAccountBalance
         */
        case 'SET_ACCOUNT_BALANCE_DAEMON_DATA': {
            return {
                ...state,
                accountBalanceDaemonData: action.accountBalanceDaemonData,
            };
        }
        /**
         * @namespace Flow.updateAccountTransactions
         */
        case 'SET_ACCOUNT_TRANSACTIONS_DAEMON_DATA': {
            return {
                ...state,
                accountTransactionsDaemonData: action.accountTransactionsDaemonData,
            };
        }
        case 'SET_WALLET_FIAT_BALANCE_AMOUNT': {
            return {
                ...state,
                walletFiatBalanceAmount: action.walletFiatBalanceAmount,
            };
        }
        default:
            break
    }

    return state;
};

export default daemonReducer;
