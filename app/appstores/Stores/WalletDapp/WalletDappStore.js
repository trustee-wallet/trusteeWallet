/**
 * @version 1.0
 */
const INITIAL_STATE = {
    dappCode: false,
    dappName: false,
    dappUrl: false
}

const walletDappStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_DAPP':
            return {
                ...state,
                ...action.dapp
            }
        default:
            return state
    }
}

export default walletDappStoreReducer
