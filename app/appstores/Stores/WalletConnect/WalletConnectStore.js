/**
 * @version 1.0
 */
const INITIAL_STATE = {
    isConnected: false,
    linkSource: false,

    walletConnectLink: false,
    walletConnectLinkError: false,
    walletConnector: false,


    peerId: false,
    peerMeta: false,

    accountAddress: false,
    accountChainId : 1,
    accountCurrencyCode: false,
    accountWalletName: false

}

const walletConnectStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_CONNECT_IS_CONNECTED':
            return {
                ...state,
                isConnected: action.isConnected,
                peerId: action.peerId,
                peerMeta: action.peerMeta
            }
        case 'SET_WALLET_CONNECT':
            return {
                ...state,
                isConnected: action.isConnected,
                linkSource: action.linkSource,

                walletConnectLink: action.walletConnectLink,
                walletConnectLinkError: action.walletConnectLinkError,
                walletConnector: action.walletConnector
            }
        case 'SET_WALLET_CONNECT_ACCOUNT':
            return {
                ...state,
                accountAddress: action.accountAddress,
                accountChainId: action.accountChainId,
                accountCurrencyCode: action.accountCurrencyCode,
                accountWalletName: action.accountWalletName
            }
        default:
            return state
    }
}

export default walletConnectStoreReducer
