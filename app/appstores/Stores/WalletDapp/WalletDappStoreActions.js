/**
 * @version 0.50
 */
import store from '@app/store'

const { dispatch } = store

export function setWalletDapp(dapp) {
    const oldData = store.getState().walletDappStore.dappCode
    if (oldData === dapp.dappCode){
        return false
    }
    return dispatch({
        type: 'SET_WALLET_DAPP',
        dapp
    })
}

export function setWalletDappIncognito(incognito) {
    const oldData = store.getState().walletDappStore.incognito
    if (oldData === incognito){
        return false
    }
    return dispatch({
        type: 'SET_WALLET_DAPP_INCOGNITO',
        incognito
    })
}

export function setWalletDappWalletConnectLink(walletConnectLink) {
    const oldData = store.getState().walletDappStore.walletConnectLink
    if (oldData === walletConnectLink){
        return false
    }
    return dispatch({
        type: 'SET_WALLET_DAPP_WALLET_CONNECT_LINK',
        walletConnectLink
    })
}
