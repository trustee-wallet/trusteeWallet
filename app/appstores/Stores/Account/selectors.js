
import { createSelectorCreator, defaultMemoize } from 'reselect'
import _isEqual from 'lodash/isEqual'
import _values from 'lodash/values'

const DEFAULT_ACCOUNT = {
  basicCurrencyRate: '', basicCurrencyBalance: '', basicCurrencySymbol: '', balancePretty: '', basicCurrencyBalanceNorm: ''
}

const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  _isEqual
)


const selectAccountCurrency = (state, props) => {
  try {
    const currencyCode = props.cryptoCurrency.currencyCode
    const selectedWallet = state.mainStore.selectedWallet.walletHash

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

  } catch(e) {
    throw new Error(e.message + ' in selectors.getAccountList')
  }
}
