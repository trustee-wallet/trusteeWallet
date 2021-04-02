
import { createSelector } from 'reselect'
import _isEqual from 'lodash/isEqual'
import store from '@app/store'


export const getVisibleCurrencies = createSelector(
  [state => state.currencyStore.cryptoCurrencies],
  (currencies => {
      const selectedWalletNumber = store.getState().mainStore.selectedWallet.walletNumber
      return currencies.filter(c => {
          const mask = Number(c.isHidden || 0).toString(2).split('').reverse() // split to binary
          if (typeof mask[selectedWalletNumber] === 'undefined') {
              return mask[mask.length - 1] === '0'
          } else {
              return mask[selectedWalletNumber] === '0'
          }
      })
  })
)
