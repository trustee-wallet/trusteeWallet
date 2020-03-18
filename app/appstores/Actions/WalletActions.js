import store from '../../store'

import WalletDS from '../DataSource/Wallet/Wallet'

import App from './App/App'

import { setLoaderStatus, setAvailableWallets, setSelectedWallet } from './MainStoreActions'

import Log from '../../services/Log/Log'

const { dispatch } = store


const walletActions = {

    setSelectedWallet: async (walletHash) => {

        Log.log('ACT/Wallet setSelectedWallet called')

        setLoaderStatus(true)

        const settingsDS = new SettingsDS()

        try {

            const res = await settingsDS.set()

            dispatch({
                type: 'UPDATE_SETTINGS',
                settings: res && res.data ? res.data.settings : {}
            })

            await App.refreshWalletsStore()

            Log.log('ACT/Wallet setSelectedWallet finished')
        } catch (e) {
            Log.err('ACT/Wallet setSelectedWallet error ' + e.message)
        }

        setLoaderStatus(false)
    },

    turnOnHD : async (walletHash) => {
        await WalletDS.updateWallet({walletHash, walletIsHd : 1})

        await setSelectedWallet()

        await setAvailableWallets()
    },

    setUseUnconfirmed : async (walletHash, walletUseUnconfirmed) => {

        await WalletDS.updateWallet({walletHash, walletUseUnconfirmed})

        await setAvailableWallets()

        await setSelectedWallet()
    },

    setWalletBackedUpStatus: async (walletHash, status) => {
        Log.log('WalletActions.setWalletBackedUpStatus called')

        try {

            await WalletDS.changeWalletBackedUpStatus({
                key: {
                    wallet_hash: walletHash
                },
                updateObj: {
                    wallet_is_backed_up: status
                }
            })

            await App.refreshWalletsStore()

            Log.log('WalletActions.setWalletBackedUpStatus finished')
        } catch (e) {
            Log.err('WalletActions.setWalletBackedUpStatus error ' + e)
        }
    }
}

export default walletActions
