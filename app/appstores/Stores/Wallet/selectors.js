import { createSelector } from 'reselect'

export const getWalletsNumber = createSelector(
  [state => state.walletStore.wallets.length],
  (data => data)
)
