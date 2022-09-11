/**
 * @version 1.0
 */
import store from '@app/store'

const { dispatch } = store

export function setWalletDapp(dapp) {
    const oldData = store.getState().walletDappStore.dappCode
    if (oldData === dapp.dappCode) {
        return false
    }
    return dispatch({
        type: 'SET_WALLET_DAPP',
        dapp
    })
}