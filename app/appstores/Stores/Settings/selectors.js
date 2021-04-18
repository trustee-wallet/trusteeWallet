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

export const getSettingsScreenData = createSelector(
    [state => state.settingsStore],
    (data => {
        return {
            language : data.data.language,
            localCurrency : data.data.local_currency,
            lockScreenStatus : data.keystore.lockScreenStatus,
            touchIDStatus : data.keystore.touchIDStatus,
            askPinCodeWhenSending : data.keystore.askPinCodeWhenSending,

        }
    })
)
