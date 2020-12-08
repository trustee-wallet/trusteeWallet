/**
 * @version 0.9
 */
import cryptoWalletDS from '../DataSource/CryptoWallets/CryptoWallets'

import App from './App/App'

import { setLoaderStatus } from '../Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'
import settingsActions from '../Stores/Settings/SettingsActions'

const cryptoWalletActions = {

    setSelectedWallet: async (walletHash, source, loader = true) => {

        if (loader) {
            setLoaderStatus(true)
        }

        try {

            const settings = await settingsActions.getSettings(false)
            if (typeof settings.dbVersion === 'undefined' || !settings.dbVersion) {
                return false
            }

            Log.log('ACT/CryptoWallet setSelectedWallet called', walletHash)

            await cryptoWalletDS.setSelectedWallet(walletHash,  'ACT/CryptoWallet setSelectedWallet ' + source)

            await App.refreshWalletsStore({firstTimeCall : false, source : 'ACT/CryptoWallet setSelectedWallet ' + source, walletHash, noRatesApi: true})

            Log.log('ACT/CryptoWallet setSelectedWallet finished')

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWallet error' + e.message)

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
