
import { createSelector } from 'reselect'
import _isEqual from 'lodash/isEqual'
import store from '@app/store'


export const getVisibleCurrencies = createSelector(
  [state => state.currencyStore.cryptoCurrencies],
  (currencies => {
      const selectedWalletNumber = store.getState().mainStore.selectedWallet.walletNumber
      return currencies.filter(c => {
          if (c.isHidden === null) {
              c.maskedHidden = true
          } else {
              const mask = Number(c.isHidden || 0).toString(2).split('').reverse() // split to binary
              if (typeof mask[selectedWalletNumber] === 'undefined') {
                  c.maskedHidden = mask.length === 1 ? (mask[mask.length - 1] === '1') : false
              } else {
                  c.maskedHidden = mask[selectedWalletNumber] === '1'
              }
          }
          return !c.maskedHidden
      })
  })
)
