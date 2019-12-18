const INITIAL_STATE = {
    init: null,
    wallets: [],
    cards: [],
    accounts: [],
    currencies: [],
    selectedWallet: {},
    selectedCurrency: {},
    selectedCryptoCurrency: {},
    selectedAccount: {},
    network: false,
    loaderVisibility: false,
    fiatRates: []
};

const mainStoreReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_WALLET_LIST':
            return new Object({
                ...state,
                wallets: action.wallets,
            });
        case 'SET_ACCOUNTS':
            return new Object({
                ...state,
                accounts: action.accounts,
            });
        case 'SET_CARDS':
            return new Object({
                ...state,
                cards: action.cards,
            });
        case 'SET_SELECTED_WALLET':
            return new Object({
                ...state,
                selectedWallet: action.wallet
            });
        case 'SET_INIT_STATE':
            return new Object({
                ...state,
                init: action.init
            });
        case 'SET_INIT_ERROR':
            return new Object({
                ...state,
                initError: action.initError
            });
        case 'SET_CURRENCIES':
            return new Object({
                ...state,
                currencies: action.currencies
            });
        case 'SET_SELECTED_ACCOUNT':
            return new Object({
                ...state,
                selectedAccount: action.selectedAccount
            });
        case 'SET_SELECTED_CRYPTOCURRENCY':
            return new Object({
                ...state,
                selectedCryptoCurrency: action.selectedCryptoCurrency
            });
        case 'SET_NETWORK_STATUS':
            return new Object({
                ...state,
                network: action.network
            });
        case 'SET_LOADER_STATUS':
            return new Object({
                ...state,
                loaderVisibility: action.visible
            });
        default:
            return state;
    }
};

export default mainStoreReducer;