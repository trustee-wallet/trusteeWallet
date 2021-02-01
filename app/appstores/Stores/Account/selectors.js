
import { createSelectorCreator, defaultMemoize } from 'reselect'
import _isEqual from 'lodash/isEqual'


const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  _isEqual
)


const selectAccountCurrency = (state, props) => {
  const currencyCode = props.cryptoCurrency.currencyCode
  const selectedWallet = state.mainStore.selectedWallet.walletHash
  const account = state.accountStore.accountList[selectedWallet][currencyCode]
  return account
}
export const getAccountCurrency = createDeepEqualSelector(selectAccountCurrency, account => account)
