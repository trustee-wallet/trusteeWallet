import { createSelector } from 'reselect'
import store from '@app/store'
import Log from '@app/services/Log/Log'

export const getVisibleCurrencies = createSelector(
  [state => state.currencyStore.cryptoCurrencies],
  (currencies => {
      let selectedWalletNumber = store.getState().mainStore.selectedWallet.walletNumber
      if (typeof selectedWalletNumber === 'undefined' || !selectedWalletNumber) {
          selectedWalletNumber = 0
      } else {
          selectedWalletNumber = selectedWalletNumber * 1
      }
      Log.log('ACT/Currency getVisibleCurrencies selectedWalletNumber ' + selectedWalletNumber)


      const tmpNft = {
          currencyCode: 'NFT',
          currencyName: 'Ethereum NFT',
          currencySymbol : 'NFT',
          tokenBlockchain: 'ETHEREUM',
          priceChangePercentage24h : null
      }
      const tmpNft2 = {
          currencyCode: 'NFT',
          currencyName: 'Tron NFT',
          currencySymbol : 'NFT',
          tokenBlockchain: 'TRON',
          priceChangePercentage24h : null
      }
      const tmpNft3 = {
          currencyCode: 'NFT',
          currencyName: 'Matic NFT',
          currencySymbol : 'NFT',
          tokenBlockchain: 'MATIC',
          priceChangePercentage24h : null
      }

      const tmp = currencies.filter(c => {
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
      return [tmpNft, tmpNft2, tmpNft3, ...tmp]
  })
)
