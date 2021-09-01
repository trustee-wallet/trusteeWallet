/**
 * @version 0.9
 */

const INITIAL_STATE = {
    selectedWallet: {},
    selectedCryptoCurrency: {},
    selectedBasicCurrency: {},
    selectedAccount: {},
    selectedAccountTransactions : {
        transactionsToView : [],
        transactionsLoaded : 0
    },
    loaderVisibility: false,
    blurVisibility: false,
    currentScreen: {}, // TODO: question - do we need this? it seems like unused
    bseLink: null,
    loaderFromBse: false
}

const mainStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_SELECTED_WALLET':
            return {
                ...state,
                selectedWallet: action.wallet
            }
        case 'SET_SELECTED_ACCOUNT':
            return {
                ...state,
                selectedAccount: action.selectedAccount
            }
        case 'SET_SELECTED_ACCOUNT_TRANSACTIONS':
            return {
                ...state,
                selectedAccountTransactions: action.selectedAccountTransactions
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
        case 'SET_SELECTED_WALLET_NAME':
            return {
                ...state,
                selectedWallet: {
                    ...state.selectedWallet,
                    walletName: action.walletName
                }
            }
        case 'SET_BSE_LINK':
            return {
                ...state,
                bseLink: action.bseLink
            }
        case 'SET_LOADER_BSE':
            return {
                ...state,
                loaderFromBse: action.loaderFromBse
            }
        default:
            return state
    }
}

export default mainStoreReducer
