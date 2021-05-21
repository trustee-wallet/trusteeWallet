/**
 * @version 0.43
 */

 const INITIAL_STATE = {
    isConnected: false
}

const walletConnectStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_CONNECT_IS_CONNECTED':
            return {
                ...state,
                isConnected: action.isConnected
            }
        default:
            return state
    }
}

export default walletConnectStoreReducer
