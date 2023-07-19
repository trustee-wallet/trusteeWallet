/**
 * @version 2.0
 */
const INITIAL_STATE = {
    isConnected: false,
    linkSource: false,
    walletConnectLink: false,
    walletConnectLinkError: false,
    walletConnector: false,
    walletConnections: []
}

const walletConnectStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_CONNECT':
            return {
                ...state,
                isConnected: action.isConnected,
                linkSource: action.linkSource,
                walletConnectLink: action.walletConnectLink,
                walletConnectLinkError: action.walletConnectLinkError,
                walletConnector: action.walletConnector,
                walletConnections: action.walletConnections
            }
        case 'SET_WALLET_CONNECTIONS':
            return {
                ...state,
                isConnected: action.isConnected,
                walletConnections: action.walletConnections
            }
        default:
            return state
    }
}

export default walletConnectStoreReducer
