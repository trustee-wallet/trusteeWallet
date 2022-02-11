/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysForRefServerSide from './BlocksoftKeysForRefServerSide'
import BlocksoftKeys from '../BlocksoftKeys/BlocksoftKeys'
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'


const CACHE = {}

class BlocksoftKeysForRef {

    /**
     * @param {string} data.mnemonic
     * @param {int} data.index
     * @return {Promise<{currencyCode:[{address, privateKey, path, index, type}]}>}
     */
    async discoverPublicAndPrivate(data) {
        const logData = { ...data }
        const mnemonicCache = data.mnemonic.toLowerCase()

        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
        if (typeof CACHE[mnemonicCache] !== 'undefined') return CACHE[mnemonicCache]
        BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate called ` + JSON.stringify(logData))

        let result = BlocksoftKeys.getEthCached(mnemonicCache)
        if (!result) {
            BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate no cache ` + JSON.stringify(logData))
            let index = 0
            if (typeof data.index !== 'undefined') {
                index = data.index
            }
            const root =  await BlocksoftKeys.getBip32Cached(data.mnemonic)
            const path = `m/44'/60'/${index}'/0/0`
            const child = root.derivePath(path)

            const processor = await BlocksoftDispatcher.getAddressProcessor('ETH')
            result = await processor.getAddress(child.privateKey)
            result.index = index
            result.path = path
            if (index === 0) {
               BlocksoftKeys.setEthCached(data.mnemonic, result)
            }
            BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate finished no cache ` + JSON.stringify(logData))
        }
        // noinspection JSPrimitiveTypeWrapperUsage
        result.cashbackToken = BlocksoftKeysForRefServerSide.addressToToken(result.address)
        BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate finished ` + JSON.stringify(logData))
        CACHE[mnemonicCache] = result
        return result
    }

    async signDataForApi(msg, privateKey) {
        const processor = await BlocksoftDispatcher.getAddressProcessor('ETH')
        if (privateKey.substr(0, 2) !== '0x') {
            privateKey = '0x' + privateKey
        }
        const signedData = await processor.signMessage(msg, privateKey)
        delete signedData.v
        delete signedData.r
        delete signedData.s
        return signedData
    }
}

const singleBlocksoftKeysForRef = new BlocksoftKeysForRef()
export default singleBlocksoftKeysForRef
