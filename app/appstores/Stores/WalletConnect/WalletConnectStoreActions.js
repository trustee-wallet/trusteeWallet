/**
 * @version 0.45
 */
import store from '@app/store'

const { dispatch } = store

export function setWalletConnectIsConnected(isConnected) {
    const oldData = store.getState().walletConnectStore.isConnected
    if (oldData === isConnected){
        return false
    }
    return dispatch({
        type: 'SET_WALLET_CONNECT_IS_CONNECTED',
        isConnected
    })
}
export function setWalletConnectData(fullLink) {
    const oldData = store.getState().walletConnectStore.fullLink
    if (oldData === fullLink){
        return false
    }
    return dispatch({
        type : 'SET_WALLET_CONNECT_DATA',
        fullLink
    })
}
export function setWalletConnectAccount(address, mainCurrencyCode) {
    const oldData = store.getState().walletConnectStore.address
    const oldCurrencyCode = store.getState().walletConnectStore.mainCurrencyCode
    if (oldData === address && oldCurrencyCode === mainCurrencyCode){
        return false
    }
    return dispatch({
        type : 'SET_WALLET_CONNECT_ACCOUNT',
        address,
        mainCurrencyCode
    })
}

