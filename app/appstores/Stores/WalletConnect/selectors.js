/**
 * @version 1.0
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
            isConnected: data.isConnected,
            linkSource: data.linkSource,
            walletConnectLink: data.walletConnectLink,
            walletConnectLinkError: data.walletConnectLinkError,
            walletConnections: data.walletConnections
        }
    })
)
