import { createSelector } from 'reselect'

export const getIsLoaderVisible = createSelector(
  [state => state.mainStore.loaderVisibility],
  (data => data)
)

export const getIsBlurVisible = createSelector(
    [state => state.mainStore.blurVisibility],
    (data => data)
)

export const getIsBackedUp = createSelector(
    [state => state.mainStore.selectedWallet.walletIsBackedUp],
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
            walletIsBackedUp : data.walletIsBackedUp === 1,
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
            currencyType : data.currencyType,
            tokenBlockchain : data.tokenBlockchain || 'ETHEREUM',
            tokenBlockchainCode : data.tokenBlockchainCode || 'ETH',
            decimals : data.decimals,
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
            currencyCode : data.currencyCode,

            walletPubs : data.walletPubs
        }
    })
)

export const getSelectedAccountTransactions = createSelector(
    [state => state.mainStore.selectedAccountTransactions],
    (data => {
        return {
            transactionsToView : data.transactionsToView,
            transactionsLoaded : data.transactionsLoaded
        }
    })
)

export const getBseLink = createSelector(
    [state => state.mainStore.bseLink],
    (data => data)
)

export const getLoaderStatusFromBse = createSelector(
    [state => state.mainStore.loaderFromBse],
    (data => data)
)

export const getSolValidator = createSelector(
    [state => state.mainStore.solValidator],
    (data => data)
)

export const getFilterData = createSelector(
    [state => state.mainStore.filter],
    (data => {
        return {
            active: data?.active || false,
            startTime: data?.startTime || null,
            endTime: data?.endTime || null,
            startAmount: data?.startAmount || null,
            endAmount: data?.endAmount || null,
            searchQuery: data?.searchQuery || null,
            filterDirectionHideIncome : data?.filterDirectionHideIncome || false,
            filterDirectionHideOutcome : data?.filterDirectionHideOutcome || false,
            filterStatusHideCancel : data?.filterStatusHideCancel || false,
            filterTypeHideFee : typeof data.filterTypeHideFee !== 'undefined' && data.filterTypeHideFee === false ? false : true,
            filterTypeHideStake : data?.filterTypeHideStake || false,
            filterTypeHideWalletConnect : data?.filterTypeHideWalletConnect || false,
            filterTypeHideSwap : data ?.filterTypeHideSwap || false,
        }
    })
)

export const getSortValue = createSelector(
    [state => state.mainStore.sortValue],
    (data => data)
)
