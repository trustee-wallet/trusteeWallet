/**
 * @version 0.9
 */
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'

import Log from '../../../services/Log/Log'


const cryptoWallets = {

    /**
     * remove unique key
     * @param {string} wallet.walletHash
     * @return {Promise<string>}
     */
    deleteWallet: async (wallet) => {
        // @todo
    },

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

            Log.log('DS/cryptoWallets saveWallet finished ' + storedKey)
        } catch (e) {
            Log.err('DS/cryptoWallets saveWallet error ' + e.message)
        }
        return storedKey
    },

    async getWallet(walletHash, source) {
        let storedWalletMnemonic = null
        try {
            // Log.log('DS/cryptoWallets getWallet ' + source  + ' ' + walletHash + ' started')

            storedWalletMnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash, 'CryptoWallets.getWallet ' + source)

            // Log.log('DS/cryptoWallets getWallet ' + source + ' finished')
        } catch (e) {
            Log.err('DS/cryptoWallets getWallet ' + source + ' error ' + e.message)
        }
        return storedWalletMnemonic
    },

    async getAllWalletsText() {
        return BlocksoftKeysStorage.getAllWalletsText()
    },

    async getOneWalletText(walletHash, discoverPath, currencyCode) {
        return BlocksoftKeysStorage.getOneWalletText(walletHash, discoverPath, currencyCode)
    }
}


export default cryptoWallets
