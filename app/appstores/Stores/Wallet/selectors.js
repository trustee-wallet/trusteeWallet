import { createSelector } from 'reselect'

export const getWalletsNumber = createSelector(
  [state => state.walletStore.wallets.length],
  (data => data)
)

export const getWalletsGeneralData = createSelector(
    [state => state.walletStore.walletsGeneralData],
    (data => data)
)

export const getWalletsList = createSelector(
    [state => state.walletStore.wallets],
    (data => data)
)
