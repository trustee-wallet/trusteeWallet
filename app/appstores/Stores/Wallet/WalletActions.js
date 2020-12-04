/**
 * @version 0.9
 */
import store from '../../../store'


import walletDS from '../../DataSource/Wallet/Wallet'

import settingsActions from '../Settings/SettingsActions'
import { setSelectedWallet } from '../Main/MainStoreActions'

import App from '../../Actions/App/App'
import Log from '../../../services/Log/Log'

const { dispatch } = store

const walletActions = {

    setAvailableWallets: async () => {
        Log.log('ACT/Wallet setAvailableWallets called')
        const wallets = await walletDS.getWallets()

        Log.log('ACT/Wallet setAvailableWallets found', wallets)
        dispatch({
            type: 'SET_WALLET_LIST',
            wallets
        })

        return wallets
    },

    setSelectedSegwitOrNot: async function() {
        Log.log('ACT/MStore setSelectedSegwitOrNot called')
        let setting = await settingsActions.getSetting('btc_legacy_or_segwit')
        setting = setting === 'segwit' ? 'legacy' : 'segwit'
        await settingsActions.setSettings('btc_legacy_or_segwit', setting)
        Log.log('ACT/MStore setSelectedSegwitOrNot finished ' + setting)
        return setting
    },

    /**
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletIsHideTransactionForFee
     * @param {string} wallet.walletUseUnconfirmed
     * @param {string} wallet.walletUseLegacy
     * @returns {Promise<void>}
     */
    setUse: async (wallet) => {

        await walletDS.updateWallet(wallet)

        await walletActions.setAvailableWallets()

        await setSelectedWallet('ACT/Wallet setUse')
    },

    setWalletBackedUpStatus: async (walletHash) => {

        await walletDS.updateWallet({ walletHash, walletIsBackedUp: 1 })

        await App.refreshWalletsStore({firstTimeCall : false, source : 'ACT/Wallet setWalletBackedUpStatus '})

    },

    getNewWalletName: async () => {
        const wallets = await walletDS.getWallets()

        if (typeof wallets === 'undefined' || !wallets || !wallets.length) {
            return 'TRUSTEE WALLET'
        }

        return 'TRUSTEE WALLET №' + (wallets.length)
    },

    setNewWalletName: async (walletHash, newName) => {
        try {
            let tmpNewWalletName = newName.replace(/'/g, '')

            if (tmpNewWalletName.length > 255) tmpNewWalletName = tmpNewWalletName.slice(0, 255)

            await walletDS.changeWalletName(walletHash, tmpNewWalletName)
            await setSelectedWallet('ACT/Wallet setNewWalletName')
            await walletActions.setAvailableWallets()
            return true
        } catch (e) {
            Log.err('walletActions.setNewWalletName error:', e.message)
            return false
        }
    }
}

export default walletActions
