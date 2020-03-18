import cryptoWalletDS from '../DataSource/CryptoWallets/CryptoWallets'

import App from './App/App'

import { setLoaderStatus } from './MainStoreActions'

import Log from '../../services/Log/Log'

const cryptoWalletActions = {

    setSelectedWallet: async (walletHash) => {

        setLoaderStatus(true)

        try {

            Log.log('ACT/CryptoWallet setSelectedWallet called', walletHash)

            await cryptoWalletDS.setSelectedWallet(walletHash)

            await App.refreshWalletsStore()

            Log.log('ACT/CryptoWallet setSelectedWallet finished')

        } catch (e) {

            Log.err('ACT/CryptoWallet setSelectedWallet error' + e.message)

        }

        setTimeout(() => {
            setLoaderStatus(false)
        }, 1000)
    },

}

export default cryptoWalletActions
