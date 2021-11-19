/**
 * @version 0.45
 */
import { createSelector } from 'reselect'

export const getWalletConnectIsConnected = createSelector(
  [state => state.walletConnectStore.isConnected],
  (data => data)
)


export const getWalletConnectData = createSelector(
    [state => state.walletConnectStore],
    (data => {
        return {
            isConnected : data.isConnected,
            fullLink: data.fullLink,
            address: data.address,
            mainCurrencyCode: data.mainCurrencyCode,
            walletName: data.walletName
        }
    })
)
