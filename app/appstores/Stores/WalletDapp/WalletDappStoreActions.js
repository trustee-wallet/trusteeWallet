/**
 * @version 0.50
 */
import store from '@app/store'

const { dispatch } = store

export function setWalletDappCode(dappCode) {
    const oldData = store.getState().walletDappStore.dappCode
    if (oldData === dappCode){
        return false
    }
    return dispatch({
        type: 'SET_WALLET_DAPP_CODE',
        dappCode
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
