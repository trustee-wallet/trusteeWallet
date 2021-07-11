/**
 * @version 0.9
 */
import Log from '@app/services/Log/Log'

import { setLoaderStatus, setSelectedWallet } from '@app/appstores/Stores/Main/MainStoreActions'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import store from '@app/store'
import config from '@app/config/config'

const cryptoWalletActions = {

    setNextWallet: async (walletNumber, source) => {
        try {
            const allWallets = store.getState().walletStore.wallets
            let foundWallet = allWallets[0]
            if (typeof walletNumber !== 'undefined') {
                for (const wallet of allWallets) {
                    if (wallet.walletNumber * 1 > walletNumber * 1) {
                        foundWallet = wallet
                        break
                    }
                }
            }
            if (foundWallet) {
                await cryptoWalletActions.setSelectedWallet(foundWallet.walletHash, source)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('cryptoWalletActions.setNextWallet error ' + e.message)
            }
        }
    },

    setSelectedWallet: async (walletHash, source, loader = true) => {

        if (loader) {
            setLoaderStatus(true)
        }

        try {

            await setSelectedWallet('ACT/App appRefreshWalletsStates called from ' + source, walletHash)

            await MarketingEvent.reinitByWallet(walletHash)

            await currencyActions.init()

            // await Daemon.forceAll({source : 'ACT/CryptoWallet setSelectedWallet ' + source, walletHash})

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWallet error' + e.message)

        }

        if (loader) {
            setLoaderStatus(false)
        }
    }
}

export default cryptoWalletActions
