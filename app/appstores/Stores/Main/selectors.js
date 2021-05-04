import { createSelector } from 'reselect'

export const getIsLoaderVisible = createSelector(
  [state => state.mainStore.loaderVisibility],
  (data => data)
)

export const getIsBlurVisible = createSelector(
    [state => state.mainStore.blurVisibility],
    (data => data)
)

export const getSelectedWalletData = createSelector(
    [state => state.mainStore.selectedWallet],
    (data => {
        return {
            walletHash : data.walletHash,
            walletName : data.walletName,
            walletNumber : data.walletNumber,
            walletIsHd : data.walletIsHd === 1,
            walletIsHideTransactionForFee : data.walletIsHideTransactionForFee !== null && data.walletIsHideTransactionForFee * 1 === 1
        }
    })
)

export const getSelectedCryptoCurrencyData = createSelector(
    [state => state.mainStore.selectedCryptoCurrency],
    (data => {
        return {
            currencyCode : data.currencyCode,
            currencySymbol : data.currencySymbol,
            currencyName : data.currencyName,
            currencyExplorerLink : data.currencyExplorerLink,
            mainColor : data.mainColor,
            darkColor : data.darkColor
        }
    })
)

export const getSelectedAccountData = createSelector(
    [state => state.mainStore.selectedAccount],
    (data => {
        return {
            walletHash : data.walletHash,
            address : data.address,
            segwitAddress : data.segwitAddress,
            legacyAddress : data.legacyAddress,
            balancePretty : data.balancePretty,
            unconfirmedPretty : data.unconfirmedPretty,
            balanceProvider : data.balanceProvider,
            balanceScanTime : data.balanceScanTime,
            balanceScanError : data.balanceScanError,
            isSynchronized : data.balanceScanTime,
            balanceScanLog: data.balanceScanLog,
            balanceAddingLog: data.balanceAddingLog,
            basicCurrencyCode: data.basicCurrencyCode,
            basicCurrencyBalance: data.basicCurrencyBalance,
            basicCurrencyRate: data.basicCurrencyRate,
            basicCurrencySymbol : data.basicCurrencySymbol,

            transactionsToView : data.transactionsToView,
            walletPubs : data.walletPubs
        }
    })
)

