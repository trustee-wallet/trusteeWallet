import BlocksoftKeysStorage from '../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftCryptoLog from './BlocksoftCryptoLog'
import BlocksoftKeys from '../actions/BlocksoftKeys/BlocksoftKeys'
import config from '../../app/config/config'
const CACHE = []

class BlocksoftPrivateKeysUtils {
    /**
     * @param discoverFor.mnemonic
     * @param discoverFor.derivationPath
     * @param discoverFor.derivationIndex
     * @param discoverFor.derivationType
     * @param discoverFor.path
     * @param discoverFor.currencyCode
     * @param discoverFor.walletHash
     * @param discoverFor.addressToCheck
     * @returns {Promise<void>}
     */
    async getPrivateKey(discoverFor, source) {
        const path = typeof discoverFor.path !== 'undefined' && discoverFor.path ? discoverFor.path : discoverFor.derivationPath
        if (path === "false" || !path) {
            BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover private key not discovered as path = false from ' + source)
        }
        const discoverForKey = BlocksoftKeysStorage.getAddressCacheKey(discoverFor.walletHash, path.replace(/[']/g, "quote"), discoverFor.currencyCode)
        BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover.getPrivateKey actually inited ', {address : discoverFor.addressToCheck, path, discoverForKey})
        let result = CACHE[discoverForKey]
        if (!result) {
            result = await BlocksoftKeysStorage.getAddressCache(discoverForKey)
            if (!result) {
                try {
                    if (typeof discoverFor.mnemonic === 'undefined' || !discoverFor.mnemonic) {
                        discoverFor.mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(discoverFor.walletHash)
                    }
                    result = await BlocksoftKeys.discoverOne(discoverFor)
                    if (discoverFor.addressToCheck && discoverFor.addressToCheck !== result.address) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('BlocksoftTransferPrivateKeysDiscover private key discovered is not for address you set ' + result.address + '!=' +  discoverFor.addressToCheck + ' key=' + discoverForKey + ' from ' + source)
                    }
                    await BlocksoftKeysStorage.setAddressCache(discoverForKey, result)
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('BlocksoftTransferPrivateKeysDiscover private key error ' + e.message + ' from ' + source)
                        console.log(e)
                    }
                    const clone = JSON.parse(JSON.stringify(discoverFor))
                    if (clone.mnemonic === "***") {
                        clone.mnemonic = '*** already masked ***'
                    } else {
                        clone.mnemonic = '***'
                    }
                    throw new Error('BlocksoftTransferPrivateKeysDiscover private key not discovered this._data=' + JSON.stringify(clone) + ' from ' + source)
                }
            }
            CACHE[discoverForKey] = result
        }
        return result
    }
}
const single = new BlocksoftPrivateKeysUtils()
export default single
