import { createSelector } from 'reselect'
import store from '@app/store'
import Log from '@app/services/Log/Log'

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


        const tmpNft = [{
            currencyCode: 'NFT_ETH',
            currencyName: 'Ethereum NFT',
            currencySymbol: 'NFT',
            tokenBlockchain: 'ETHEREUM',
            currencyType: 'NFT',
            currencyIcon: 'ETH',
            addressUiChecker: 'ETH',
        }, {
            currencyCode: 'NFT_BNB',
            currencyName: 'BNB NFT',
            currencySymbol: 'NFT',
            tokenBlockchain: 'BNB',
            currencyType: 'NFT',
            currencyIcon: 'BNB_SMART',
            addressUiChecker: 'ETH',
        }, {
            currencyCode: 'NFT_MATIC',
            currencyName: 'Matic NFT',
            currencySymbol: 'NFT',
            tokenBlockchain: 'MATIC',
            currencyType: 'NFT',
            currencyIcon: 'MATIC',
            addressUiChecker: 'ETH',
        }, {
            currencyCode: 'NFT_TRON',
            currencyName: 'Tron NFT',
            currencySymbol: 'NFT',
            tokenBlockchain: 'TRON',
            currencyType: 'NFT',
            currencyIcon: 'TRX',
            addressUiChecker: 'TRX',
        }]


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
        return [...tmpNft, ...tmp]
    })
)
