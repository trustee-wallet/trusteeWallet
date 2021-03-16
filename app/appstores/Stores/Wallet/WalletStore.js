/**
 * @version 0.9
 */
const INITIAL_STATE = {
    wallets: []
}

const walletStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_LIST':
            return {
                ...state,
                wallets: action.wallets
            }
        default:
            return state
    }
}

export default walletStoreReducer
