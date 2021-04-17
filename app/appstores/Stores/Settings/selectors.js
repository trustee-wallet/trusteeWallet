import { createSelector } from 'reselect'

export const getIsBalanceVisible = createSelector(
  [state => state.data],
  (data => data.isBalanceVisible)
)

export const getIsTouchIDStatus = createSelector(
    [state => state.settingsStore.keystore.touchIDStatus],
    (data => data)
)

export const getLockScreenStatus = createSelector(
    [state => state.settingsStore.keystore.lockScreenStatus],
    (data => data)
)
