/**
 * @version 0.50
 */

 const INITIAL_STATE = {
    dappCode : false,
    incognito : true
}

const walletDappStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_WALLET_DAPP_CODE':
            return {
                ... state,
                dappCode : action.dappCode || false
            }
        case 'SET_WALLET_DAPP_INCOGNITO':
            return {
                ... state,
                incognito : action.incognito
            }
        default:
            return state
    }
}

export default walletDappStoreReducer
