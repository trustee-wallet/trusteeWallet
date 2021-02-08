
import { createSelectorCreator, defaultMemoize } from 'reselect'
import _isEqual from 'lodash/isEqual'

const DEFAULT_ACCOUNT = {
  basicCurrencyRate: '', basicCurrencyBalance: '', basicCurrencySymbol: '', balancePretty: '', basicCurrencyBalanceNorm: ''
}

const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  _isEqual
)


const selectAccountCurrency = (state, props) => {
  const currencyCode = props.cryptoCurrency.currencyCode
  const selectedWallet = state.mainStore.selectedWallet.walletHash
  if (typeof state.accountStore.accountList[selectedWallet] === 'undefined') {
    return DEFAULT_ACCOUNT
    // throw new Error('Undefined selectedWallet ' + selectedWallet + ' in Account.selectors.selectAccountCurrency')
  }
  if (typeof state.accountStore.accountList[selectedWallet][currencyCode] === 'undefined') {
    return DEFAULT_ACCOUNT
    // throw new Error('Undefined currencyCode ' + selectedWallet + '  ' + currencyCode + ' in Account.selectors.selectAccountCurrency')
  }
  const account = state.accountStore.accountList[selectedWallet][currencyCode]
  return account
}
export const getAccountCurrency = createDeepEqualSelector(selectAccountCurrency, account => account)
