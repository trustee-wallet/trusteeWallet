/**
 * @version 0.9
 */
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'

import Log from '../../../services/Log/Log'


const cryptoWallets = {

    /**
     * returns unique key for mnemonic saved in cryptostorage
     * @param {string} wallet.walletName
     * @param {string} wallet.newMnemonic
     * @param {string} wallet.walletMnemonic
     * @return {Promise<string>}
     */
    saveWallet: async (wallet) => {
        let storedKey = ''
        try {
            Log.log('DS/cryptoWallets saveWallet called')

            const prepared = { mnemonic: wallet.newMnemonic ? wallet.newMnemonic : wallet.walletMnemonic, hash: '?' }

            prepared.mnemonic = BlocksoftKeysUtils.recheckMnemonic(prepared.mnemonic)
            prepared.hash = await BlocksoftKeysUtils.hashMnemonic(prepared.mnemonic)

            const logData = {...prepared}
            if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
            Log.log('DS/cryptoWallets saveWallet data', logData)

            const checkKey = await BlocksoftKeysStorage.isMnemonicAlreadySaved(prepared)
            if (checkKey) {
               // @misha should we do something or ui is enough
            }
            storedKey = await BlocksoftKeysStorage.saveMnemonic(prepared)

            Log.log('DS/cryptoWallets saveWallet finished', storedKey)
        } catch (e) {
            Log.err('DS/cryptoWallets saveWallet error ' + e.message)
        }
        return storedKey
    },

    async getSelectedWallet() {
        let storedSelectedWalletHash = null
        try {
            Log.log('DS/cryptoWallets getSelectedWallet')

            storedSelectedWalletHash = await BlocksoftKeysStorage.getSelectedWallet()

            Log.log('DS/cryptoWallets getSelectedWallet finished')
        } catch (e) {
            Log.err('DS/cryptoWallets getSelectedWallet error ' + e.message)
        }
        return storedSelectedWalletHash
    },

    async getWallet(walletHash) {
        let storedWalletMnemonic = null
        try {
            Log.log('DS/cryptoWallets getWallet', walletHash)

            storedWalletMnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash)

            Log.log('DS/cryptoWallets getWallet finished')
        } catch (e) {
            Log.err('DS/cryptoWallets getWallet error ' + e.message)
        }
        return storedWalletMnemonic
    },

    async setSelectedWallet(walletHash) {
        let storedSelectedWallet = []
        try {
            Log.log('DS/cryptoWallets setSelectedWallet called ' + walletHash)

            storedSelectedWallet = await BlocksoftKeysStorage.setSelectedWallet(walletHash)

            Log.log('DS/cryptoWallets setSelectedWallet finished ' + walletHash)
        } catch (e) {
            Log.err('DS/cryptoWallets setSelectedWallet error' + e.message)
        }
        return storedSelectedWallet
    }
}


export default cryptoWallets
