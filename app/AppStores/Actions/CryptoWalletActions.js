/**
 * @version 0.9
 */
import cryptoWalletDS from '../DataSource/CryptoWallets/CryptoWallets'

import App from './App/App'

import { setLoaderStatus } from '../Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'

const cryptoWalletActions = {

    setSelectedWallet: async (walletHash, source) => {

        setLoaderStatus(true)

        try {

            Log.log('ACT/CryptoWallet setSelectedWallet called', walletHash)

            await cryptoWalletDS.setSelectedWallet(walletHash,  'ACT/CryptoWallet setSelectedWallet ' + source)

            await App.refreshWalletsStore({firstTimeCall : false, source : 'ACT/CryptoWallet setSelectedWallet ' + source, walletHash, noRatesApi: true})

            Log.log('ACT/CryptoWallet setSelectedWallet finished')

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWallet error' + e.message)

        }

        setTimeout(() => {
            setLoaderStatus(false)
        }, 1000)
    }

}

export default cryptoWalletActions
