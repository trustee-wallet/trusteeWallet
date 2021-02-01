
import { createSelector } from 'reselect'
import _isEqual from 'lodash/isEqual'


export const getVisibleCurrencies = createSelector(
  [state => state.currencyStore.cryptoCurrencies],
  (currencies => currencies.filter(c => !c.isHidden))
)
