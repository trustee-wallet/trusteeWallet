import BlocksoftKeysStorage from '../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftCryptoLog from './BlocksoftCryptoLog'
import BlocksoftKeys from '../actions/BlocksoftKeys/BlocksoftKeys'
const CACHE = []

class BlocksoftPrivateKeysUtils {
    /**
     * @param discoverFor.mnemonic
     * @param discoverFor.path
     * @param discoverFor.currencyCode
     * @param discoverFor.walletHash
     * @param discoverFor.addressToCheck
     * @returns {Promise<void>}
     */
    async getPrivateKey(discoverFor) {
        const discoverForKey = BlocksoftKeysStorage.getAddressCacheKey(discoverFor.walletHash, discoverFor.path.replace(/[']/g, "quote"), discoverFor.currencyCode)
        BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover.getPrivateKey actually inited ', {address : discoverFor.addressToCheck, path : discoverFor.path, discoverForKey})
        let result = CACHE[discoverForKey]
        if (!result) {
            result = await BlocksoftKeysStorage.getAddressCache(discoverForKey)
            if (!result) {
                try {
                    result = await BlocksoftKeys.discoverOne(discoverFor)
                    if (discoverFor.addressToCheck && discoverFor.addressToCheck !== result.address) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('BlocksoftTransferPrivateKeysDiscover private key discovered is not for address you set ' + result.address + '!=' +  discoverFor.addressToCheck + ' key=' + discoverForKey)
                    }
                    await BlocksoftKeysStorage.setAddressCache(discoverForKey, result)
                } catch (e) {
                    const clone = JSON.parse(JSON.stringify(discoverFor))
                    clone.mnemonic = '***'
                    throw new Error('BlocksoftTransferPrivateKeysDiscover private key not discovered this._data=' + JSON.stringify(clone))
                }
            }
            CACHE[discoverForKey] = result
        }
        return result
    }
}
const single = new BlocksoftPrivateKeysUtils()
export default single
