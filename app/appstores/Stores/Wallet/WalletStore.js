/**
 * @version 0.43
 */
const INITIAL_STATE = {
    wallets: [],
    walletsGeneralData: {
        totalBalance: 0,
        localCurrencySymbol: '$'
    }
}

const walletStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_LIST':
            return {
                ...state,
                wallets: action.wallets
            }
        case 'SET_WALLET_GENERAL_DATA' :
            return {
                ...state,
                walletsGeneralData: action.walletsGeneralData
            }
        default:
            return state
    }
}

export default walletStoreReducer
