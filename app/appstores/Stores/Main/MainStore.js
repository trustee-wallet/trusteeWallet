/**
 * @version 0.9
 */

 const INITIAL_STATE = {
    init: null,
    selectedWallet: {},
    selectedCryptoCurrency: {},
    selectedBasicCurrency: {},
    selectedAccount: {},
    loaderVisibility: false,
    blurVisibility: false,
    currentScreen: {} // TODO: question - do we need this? it seems like unused
}

const mainStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_SELECTED_WALLET':
            return {
                ...state,
                selectedWallet: action.wallet
            }
        case 'SET_INIT_STATE':
            return {
                ...state,
                init: action.init
            }
        case 'SET_INIT_ERROR':
            return {
                ...state,
                initError: action.initError
            }
        case 'SET_SELECTED_ACCOUNT':
            return {
                ...state,
                selectedAccount: action.selectedAccount
            }
        case 'SET_SELECTED_CRYPTO_CURRENCY':
            return {
                ...state,
                selectedCryptoCurrency: action.selectedCryptoCurrency
            }
        case 'SET_SELECTED_BASIC_CURRENCY':
            return {
                ...state,
                selectedBasicCurrency: action.selectedBasicCurrency
            }
        case 'SET_NAV_CURRENT_SCREEN':
            return {
                ...state,
                currentScreen: action.screen
            }
        case 'SET_LOADER_STATUS':
            return {
                ...state,
                loaderVisibility: action.visible
            }
        case 'SET_BLUR_STATUS':
            return {
                ...state,
                blurVisibility: action.visible
            }
        default:
            return state
    }
}

export default mainStoreReducer
