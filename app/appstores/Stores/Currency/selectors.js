import { createSelector } from 'reselect'
import store from '@app/store'
import Log from '@app/services/Log/Log'
import Nfts from '@crypto/common/BlocksoftDictNfts'

export const getVisibleCurrencies = createSelector(
    [state => state.currencyStore.cryptoCurrencies],
    (currencies => {
        let { selectedWalletNumber } = store.getState().mainStore.selectedWallet
        if (typeof selectedWalletNumber === 'undefined' || !selectedWalletNumber) {
            selectedWalletNumber = 0
        } else {
            selectedWalletNumber = selectedWalletNumber * 1
        }
        Log.log('ACT/Currency getVisibleCurrencies selectedWalletNumber ' + selectedWalletNumber)

        const tmpNfts = Nfts.Nfts.filter(c => {
            return c.showOnHome
        })

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
        return [...tmpNfts, ...tmp]
    })
)
