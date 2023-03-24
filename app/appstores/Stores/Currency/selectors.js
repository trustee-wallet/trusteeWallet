import { createSelector } from 'reselect'
import store from '@app/store'
import Log from '@app/services/Log/Log'

const hiddenAssets = ['ETH_ONE']

export const getVisibleCurrencies = createSelector(
    [state => state.currencyStore.cryptoCurrencies],
    (currencies => {
        try {
            let { walletNumber } = store.getState().mainStore.selectedWallet
            if (typeof walletNumber === 'undefined' || !walletNumber) {
                walletNumber = 1
            } else {
                walletNumber = walletNumber * 1
            }

            const tmp = currencies.filter(c => {
                if (c.isHidden === null) {
                    c.maskedHidden = true
                } else {
                    const mask = Number(c.isHidden || 0).toString(2).split('').reverse() // split to binary
                    if (typeof mask[walletNumber] === 'undefined') {
                        c.maskedHidden = mask.length === 1 ? (mask[mask.length - 1] === '1') : false
                    } else {
                        c.maskedHidden = mask[walletNumber] === '1'
                    }
                }
                return !c.maskedHidden
            })
            if (!tmp) {
                return []
            }

            return [...tmp]
        } catch (e) {
            Log.log('ACT/Currency getVisibleCurrencies error ' + e.message)
            return []
        }
    })
)

export const getVisibleAssets = createSelector(
    [state => state.currencyStore.cryptoCurrencies],
    (data => {
        try {
            return data.filter(item => !hiddenAssets.includes(item.currencyCode))
        } catch (e) {
            Log.err('ACT/Currency getVisibleAssets error ' + e.message)
            return []
        }
    })
)
