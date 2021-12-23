/**
 * @version 0.50
 */

 const INITIAL_STATE = {
    dappCode : false,
    dappName : false,
    dappUrl : false,
    incognito : true,
    walletConnectLink : false
}

const walletDappStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_DAPP':
            return {
                ... state,
                ... action.dapp
            }
        case 'SET_WALLET_DAPP_INCOGNITO':
            return {
                ... state,
                incognito : action.incognito
            }
        case 'SET_WALLET_DAPP_WALLET_CONNECT_LINK':
            return {
                ... state,
                walletConnectLink : action.walletConnectLink
            }
        default:
            return state
    }
}

export default walletDappStoreReducer
