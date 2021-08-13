/**
 * @version 0.50
 */
import { createSelector } from 'reselect'

export const getIsBalanceVisible = createSelector(
    [state => state.data],
    (data => +data.isBalanceVisible === 1)
)

export const getIsSegwit = createSelector(
    [state => state.settingsStore.data.btc_legacy_or_segwit === 'segwit'],
    (data => data)
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
            language: data.data.language,
            localCurrency: data.data.local_currency,
            lockScreenStatus: data.keystore.lockScreenStatus,
            touchIDStatus: data.keystore.touchIDStatus,
            askPinCodeWhenSending: data.keystore.askPinCodeWhenSending,
            loggingCode: data.data.loggingCode || 'all',
            scannerCode: data.data.scannerCode || '1m',
            notifsStatus: +data.data.notifsStatus === 1,
            transactionsNotifs: +data.data.transactionsNotifs === 1,
            exchangeRatesNotifs: +data.data.exchangeRatesNotifs === 1,
            newsNotifs: +data.data.newsNotifs === 1,
            isBalanceVisible : +data.data.isBalanceVisible === 1
        }
    })
)
