/**
 * @version 0.45
 */

 const INITIAL_STATE = {
    isConnected: false,
    fullLink: false,
    address: false,
    mainCurrencyCode : false
}

const walletConnectStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_CONNECT_IS_CONNECTED':
            return {
                ...state,
                isConnected: action.isConnected,
            }
        case 'SET_WALLET_CONNECT_DATA':
            return {
                ... state,
                fullLink : action.fullLink || false
            }
        case 'SET_WALLET_CONNECT_ACCOUNT':
            return {
                ... state,
                address : action.address || false,
                mainCurrencyCode: action.mainCurrencyCode || false
            }
        default:
            return state
    }
}

export default walletConnectStoreReducer
