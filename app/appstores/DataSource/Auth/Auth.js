import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import BlocksoftKeysRefStorage from '../../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRefStorage'

import SettingsDS from '../Settings/Settings'

import Log from '../../../services/Log/Log'


const authDS = {
    /**
     * returns unique key for mnemonic saved in cryptostorage
     * @param {string} mnemonic
     * @return {Promise<string>}
     */
    saveAuthMnemonic: async (mnemonic) => {
        let storedKey = ''
        try {
            Log.log('DS/Auth saveAuthMnemonic called')

            let prepared = { mnemonic, hash: '?' }

            prepared.mnemonic = BlocksoftKeysUtils.recheckMnemonic(prepared.mnemonic)
            prepared.hash = await BlocksoftKeysUtils.hashMnemonic(prepared.mnemonic)

            let logData = {...prepared}
            if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
            Log.log('DS/Auth saveAuthMnemonic data', logData)

            let checkKey = await BlocksoftKeysRefStorage.isMnemonicAlreadySaved(prepared)
            if (checkKey) {
                return prepared.hash
            }

            storedKey = await BlocksoftKeysRefStorage.saveMnemonic(prepared)

            Log.log('DS/Auth saveAuthMnemonic finished', storedKey)

        } catch (e) {
            Log.err('DS/Auth saveAuthMnemonic error ' + e.message)
        }
        return storedKey
    },

    async getAuthMnemonic(walletHash) {
        let authMnemonic = null
        try {
            Log.log('DS/Auth getAuthMnemonic finished')

            authMnemonic = await BlocksoftKeysRefStorage.getWalletMnemonic(walletHash)

            Log.log('DS/Auth getAuthMnemonic finished')
        } catch (e) {
            Log.err('DS/Auth getAuthMnemonic error ' + e.message)
        }
        return authMnemonic
    },

    setAuthMnemonicHash: async (mnemonicAuthHash) => {
        try {
            Log.log('DS/Auth setAuthMnemonicHash called')

            const settingsDS = new SettingsDS()

            await settingsDS.setSettings('auth_mnemonic_hash', mnemonicAuthHash)

            Log.log('DS/Auth setAuthMnemonicHash finished')

            return true
        } catch (e) {
            Log.err('DS/Auth setAuthMnemonicHash error ' + e.message)
            return false
        }

    },

    getAuthMnemonicHash: async () => {
        let storedAuthHash = null
        try {
            Log.log('DS/Auth getAuthHash called')

            const settingsDS = new SettingsDS()

            const { array: settings } = await settingsDS.getSettings()

            const tmpAuthHash = settings.find(item => item.paramKey === 'auth_mnemonic_hash')

            if(typeof tmpAuthHash == 'undefined' || tmpAuthHash.paramValue === '')
                storedAuthHash = false
            else
                storedAuthHash = tmpAuthHash.paramValue

            Log.log('DS/Auth getAuthHash finished')

        } catch (e) {
            Log.err('DS/Auth getAuthHash error ' + e.message)
        }
        return storedAuthHash
    }
}

export default authDS
