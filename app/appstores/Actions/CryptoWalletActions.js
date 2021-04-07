/**
 * @version 0.9
 */
import App from '@app/appstores/Actions/App/App'
import Log from '@app/services/Log/Log'

import { setLoaderStatus, setSelectedWallet } from '@app/appstores/Stores/Main/MainStoreActions'

import cryptoWalletDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
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

            Log.log('ACT/CryptoWallet setSelectedWallet called', walletHash)

            await cryptoWalletDS.setSelectedWallet(walletHash,  'ACT/CryptoWallet setSelectedWallet ' + source)

            // await walletActions.setAvailableWallets()

            await setSelectedWallet('ACT/App appRefreshWalletsStates called from ' + source)

            await MarketingEvent.reinitByWallet(walletHash)

            await currencyActions.init()

            // await Daemon.forceAll({source : 'ACT/CryptoWallet setSelectedWallet ' + source, walletHash})

            Log.log('ACT/CryptoWallet setSelectedWallet finished')

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWallet error' + e.message)

        }

        if (loader) {
            setLoaderStatus(false)
        }
    },

    /**
     * could be removed after mainStore refactor, check event before
     * @param walletHash
     * @param source
     * @param loader
     * @returns {Promise<boolean>}
     */
    setSelectedWalletFromHome: async (walletHash, source, loader = true) => {
        MarketingEvent.logEvent('toCheck_setSelectedWalletFromHome')

        if (loader) {
            setLoaderStatus(true)
        }

        try {

            const settings = await settingsActions.getSettings(false)
            if (typeof settings.dbVersion === 'undefined' || !settings.dbVersion) {
                return false
            }

            Log.log('ACT/CryptoWallet setSelectedWalletFromHome called', walletHash)

            await cryptoWalletDS.setSelectedWallet(walletHash,  'ACT/CryptoWallet setSelectedWallet ' + source)

            await App.refreshWalletsStore({firstTimeCall : 'setSelectedWalletHome', source : 'ACT/CryptoWallet setSelectedWallet ' + source, walletHash})

            Log.log('ACT/CryptoWallet setSelectedWalletFromHome finished')

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWalletFromHome error' + e.message)

        }

        if (loader) {
            setTimeout(() => {
                setLoaderStatus(false)
            }, 1000)
        }
    },

    setFirstWallet() {
        return cryptoWalletDS.getFirstWallet()
    }
}

export default cryptoWalletActions
