import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'

import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import walletDS from '../Wallet/Wallet'

import accountDS from '../Account/Account'

import Log from '../../../services/Log/Log'
import BlocksoftCryptoLog from '../../../../crypto/common/BlocksoftCryptoLog'
import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'

const cryptoWallets = {
    checkWalletsExists: async () => {
        try {
            Log.log(`DS/cryptoWallets checkWalletsExists called`)

            let count = await BlocksoftKeysStorage.countMnemonics()

            Log.log(`DS/cryptoWallets checkWalletsExists finished`, count)

            return count > 0
        } catch (e) {
            Log.err('DS/cryptoWallets checkWalletsExists error ' + e.message)
        }
        return false
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

            let prepared = { mnemonic: wallet.newMnemonic ? wallet.newMnemonic : wallet.walletMnemonic, hash: '?' }

            prepared.mnemonic = BlocksoftKeysUtils.recheckMnemonic(prepared.mnemonic)
            prepared.hash = await BlocksoftKeysUtils.hashMnemonic(prepared.mnemonic)

            let logData = {...prepared}
            if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
            Log.log('DS/cryptoWallets saveWallet data', logData)

            let checkKey = await BlocksoftKeysStorage.isMnemonicAlreadySaved(prepared)
            if (checkKey) {
                //@todo something
            }
            storedKey = await BlocksoftKeysStorage.saveMnemonic(prepared)

            Log.log('DS/cryptoWallets saveWallet finished', storedKey)

        } catch (e) {
            Log.err('DS/cryptoWallets saveWallet error ' + e.message)
        }
        return storedKey
    },

    /**
     * returns unique key for mnemonic saved in cryptostorage
     * @return {Promise<boolean>}
     */
    generateWallet: async () => {
        let storedKey = false
        try {
            Log.log('DS/cryptoWallets generateWallet called')

            let prepared = await BlocksoftKeys.newMnemonic()

            let logData = {...prepared}
            if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
            Log.log('DS/cryptoWallets generateWallet data', logData)

            storedKey = await BlocksoftKeysStorage.saveMnemonic(prepared)

            Log.log('DS/cryptoWallets generateWallet finished', storedKey)
        } catch (e) {
            Log.err('DS/cryptoWallets generateWallet error ' + e.message)
        }
        return storedKey
    },

    async getWallets() {
        let storedWallets = []
        try {
            Log.log('DS/cryptoWallets getWallets called')

            let storedWalletsTmp = await BlocksoftKeysStorage.getWallets()

            const { array: storedDBWalletsTmp } = await walletDS.getWallets()

            for (let hash of storedWalletsTmp) {
                const { wallet_name } = storedDBWalletsTmp.find(item => item.wallet_hash == hash)
                storedWallets.push({ id: hash, hash, walletName: wallet_name })
            }

            Log.log('DS/cryptoWallets getWallets finished', storedWallets)

        } catch (e) {
            Log.err('DS/cryptoWallets getWallets error ' + e.message)
        }
        return storedWallets
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
            Log.log('DS/cryptoWallets setSelectedWallet called')

            storedSelectedWallet = await BlocksoftKeysStorage.setSelectedWallet(walletHash)

            Log.log('DS/cryptoWallets setSelectedWallet finished')
        } catch (e) {
            Log.err('DS/cryptoWallets setSelectedWallet error' + e.message)
        }
        return storedSelectedWallet
    }
}


export default cryptoWallets
