/**
 * @version 0.9
 */
const INITIAL_STATE = {
    init: null,
    selectedWallet: {},
    selectedCryptoCurrency: {},
    selectedBasicCurrency : {},
    selectedAccount: {},
    loaderVisibility: false,
    currentScreen : {}
}

const mainStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_SELECTED_WALLET':
            return new Object({
                ...state,
                selectedWallet: action.wallet
            })
        case 'SET_INIT_STATE':
            return new Object({
                ...state,
                init: action.init
            })
        case 'SET_INIT_ERROR':
            return new Object({
                ...state,
                initError: action.initError
            })
        case 'SET_SELECTED_ACCOUNT':
            return new Object({
                ...state,
                selectedAccount: action.selectedAccount
            })
        case 'SET_SELECTED_CRYPTO_CURRENCY':
            return new Object({
                ...state,
                selectedCryptoCurrency: action.selectedCryptoCurrency
            })
        case 'SET_SELECTED_BASIC_CURRENCY':
            return new Object({
                ...state,
                selectedBasicCurrency: action.selectedBasicCurrency
            })
        case 'SET_NAV_CURRENT_SCREEN':
            return new Object({
                ...state,
                currentScreen: action.screen
            })
        case 'SET_LOADER_STATUS':
            return new Object({
                ...state,
                loaderVisibility: action.visible
            })
        default:
            return state
    }
}

export default mainStoreReducer
