import { createSelectorCreator, defaultMemoize } from 'reselect'
import _isEqual from 'lodash/isEqual'
import _values from 'lodash/values'
import store from '@app/store'
import DaemonCache from '@app/daemons/DaemonCache'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

const DEFAULT_ACCOUNT = {
    basicCurrencyRate: '',
    basicCurrencyBalance: '',
    basicCurrencySymbol: '',
    balancePretty: '',
    basicCurrencyBalanceNorm: ''
}

const createDeepEqualSelector = createSelectorCreator(
    defaultMemoize,
    _isEqual
)


const selectAccountCurrency = (state, props) => {
    try {
        const currencyCode = props.cryptoCurrency.currencyCode
        const selectedWallet = state.mainStore.selectedWallet.walletHash

        if (currencyCode === 'CASHBACK') {
            const cashbackStore = store.getState().cashBackStore
            if (typeof cashbackStore.dataFromApi !== 'undefined') {
                const accountRates = DaemonCache.getCacheRates('USDT')
                const basicCurrencyBalanceNorm = RateEquivalent.mul({ value: cashbackStore.dataFromApi.cashbackBalance || 0, currencyCode: 'USDT', basicCurrencyRate: accountRates.basicCurrencyRate })
                const basicCurrencyBalance = BlocksoftPrettyNumbers.makeCut(basicCurrencyBalanceNorm, 2).separated
                return {
                    basicCurrencySymbol:  accountRates.basicCurrencySymbol,
                    basicCurrencyRate: '',
                    basicCurrencyBalance,
                    balanceScanTime :  cashbackStore.dataFromApi.time || false,
                    balancePretty: cashbackStore.dataFromApi.cashbackBalance || 0,
                    basicCurrencyBalanceNorm
                }
            }
        }

        if (typeof state.accountStore.accountList[selectedWallet] === 'undefined') {
            // Log.log('Undefined selectedWallet ' + selectedWallet + ' in Account.selectors.selectAccountCurrency') // @todo redo UpdateAccountListDaemon
            return DEFAULT_ACCOUNT
            // throw new Error('Undefined selectedWallet ' + selectedWallet + ' in Account.selectors.selectAccountCurrency')
        }
        if (typeof state.accountStore.accountList[selectedWallet][currencyCode] === 'undefined') {
            // Log.log('Undefined currencyCode ' + selectedWallet + '  ' + currencyCode + ' in Account.selectors.selectAccountCurrency')
            return DEFAULT_ACCOUNT
            // throw new Error('Undefined currencyCode ' + selectedWallet + '  ' + currencyCode + ' in Account.selectors.selectAccountCurrency')
        }
        const account = state.accountStore.accountList[selectedWallet][currencyCode]
        return account
    } catch (e) {
        throw new Error(e.message + ' in selectors.selectAccountCurrency')
    }
}
export const getAccountCurrency = createDeepEqualSelector(selectAccountCurrency, account => account)

export function getAccountList(state) {
    try {
        const selectedWallet = state.mainStore.selectedWallet.walletHash

        if (typeof state.accountStore.accountList[selectedWallet] === 'undefined') {
            // Log.log('Undefined selectedWallet ' + selectedWallet + ' in Account.selectors.selectAccountCurrency') // @todo redo UpdateAccountListDaemon
            return DEFAULT_ACCOUNT
            // throw new Error('Undefined selectedWallet ' + selectedWallet + ' in Account.selectors.selectAccountCurrency')
        }

        const account = _values(state.accountStore.accountList[selectedWallet])
        return account

    } catch (e) {
        throw new Error(e.message + ' in selectors.getAccountList')
    }
}
