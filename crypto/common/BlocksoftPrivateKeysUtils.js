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
     * @returns {Promise<{privateKey: string}>}
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
                        BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover.getPrivateKey actually redo mnemonic ' + discoverFor.walletHash),
                        discoverFor.mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(discoverFor.walletHash, 'getPrivateKey')
                    }
                    result = await BlocksoftKeys.discoverOne(discoverFor)

                    if (discoverFor.addressToCheck && discoverFor.addressToCheck !== result.address) {

                        BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover private key discovered is not for address you path=' + discoverFor.derivationPath + ' set ' + result.address + '!=' +  discoverFor.addressToCheck + ' key=' + discoverForKey + ' from ' + source)

                        const tmpPath = [
                            `m/84'/0'/0'/0/0`,
                            `m/84'/0'/0'/0/1`,
                            `m/44'/0'/0'/0/0`,
                            `m/44'/0'/0'/0/1`,
                            `m/49'/0'/0'/0/0`,
                            `m/49'/0'/0'/0/1`,
                            `m/44'/0`,
                            `m/44'/1`,
                            `m/49'/0`,
                            `m/49'/1`,
                            `m/84'/0`,
                            `m/84'/1`,
                            `m/0`,
                        ]
                        let tmpFound = false
                        for (const path of tmpPath) {
                            const clone = JSON.parse(JSON.stringify(discoverFor))
                            clone.derivationPath = path
                            const result2 = await BlocksoftKeys.discoverOne(clone)
                            if (discoverFor.addressToCheck === result2.address) {
                                BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover private key rediscovered FOUND address path=' + clone.derivationPath + '  set ' + result2.address + '=' + discoverFor.addressToCheck + ' from ' + source)
                                result = result2
                                tmpFound = true
                                break
                            } else {
                                BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover private key rediscovered is not for address path=' + clone.derivationPath + '  set ' + result2.address + '!=' + discoverFor.addressToCheck + ' from ' + source)
                            }
                        }
                        if (!tmpFound) {
                            throw new Error('invalid address')
                        }
                    }
                    await BlocksoftKeysStorage.setAddressCache(discoverForKey, result)
                } catch (e) {
                    if (config.debug.appErrors) {
                        BlocksoftCryptoLog.log('BlocksoftTransferPrivateKeysDiscover private key error ' + e.message + ' from ' + source)
                        BlocksoftCryptoLog.log(e)
                    }
                    const clone = JSON.parse(JSON.stringify(discoverFor))
                    const msg = e.message.toString().replace(discoverFor.mnemonic, '***')
                    if (clone.mnemonic === "***") {
                        clone.mnemonic = '*** already masked ***'
                    } else {
                        clone.mnemonic = '***'
                    }
                    throw new Error('BlocksoftTransferPrivateKeysDiscover private key error ' + msg + ' from ' + source + ' this._data=' + JSON.stringify(clone) )
                }
            }
            CACHE[discoverForKey] = result
        }
        return result
    }
}
const single = new BlocksoftPrivateKeysUtils()
export default single
