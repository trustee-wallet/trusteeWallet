/**
 * @version 0.43
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
