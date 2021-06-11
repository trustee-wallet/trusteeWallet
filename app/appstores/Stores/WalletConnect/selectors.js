/**
 * @version 0.43
 */
import { createSelector } from 'reselect'

export const getWalletConnectIsConnected = createSelector(
  [state => state.walletConnectStore.isConnected],
  (data => data)
)
