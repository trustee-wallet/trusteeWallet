import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysUtils from '../BlocksoftKeys/BlocksoftKeysUtils'
import BlocksoftKeysForRefServerSide from  './BlocksoftKeysForRefServerSide'
import BlocksoftKeys from  '../BlocksoftKeys/BlocksoftKeys'

const bip32 = require('bip32')

const Dispatcher = require('../../blockchains/Dispatcher').init()

const CACHE = {}

class BlocksoftKeysForRef {

    /**
     * @param {string} data.mnemonic
     * @param {int} data.index
     * @return {Promise<{currencyCode:[{address, privateKey, path, index, type}]}>}
     */
    async discoverPublicAndPrivate(data) {
        let logData = {...data}
        let mnemonicCache = data.mnemonic.toLowerCase()

        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
        if (typeof CACHE[mnemonicCache] !== 'undefined') return CACHE[mnemonicCache]
        BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate called`, logData)

        let result = BlocksoftKeys.getEthCached(mnemonicCache)
        if (!result) {
            BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate no cache`, logData)
            let index = 0
            if (typeof data.index !== 'undefined') {
                index = data.index
            }
            let seed = BlocksoftKeys.getSeedCached(data.mnemonic)
            let root = bip32.fromSeed(seed)
            let path = `m/44'/60'/${index}'/0/0`
            let child = root.derivePath(path)

            let processor = await Dispatcher.getAddressProcessor('ETH')
            result = processor.getAddress(child.privateKey)
            result.index = index
            result.path = path
            BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate finished no cache`, logData)
        }
        result.cashbackToken = BlocksoftKeysForRefServerSide.addressToToken(result.address)
        BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate finished`, logData)
        CACHE[mnemonicCache] = result
        return result
    }

    async signDataForApi(msg, privateKey) {
        let processor = await Dispatcher.getAddressProcessor('ETH')
        if (privateKey.substr(0,2) !== '0x') {
            privateKey = '0x' + privateKey
        }
        let signedData = await processor.signMessage(msg, privateKey)
        delete signedData.v
        delete signedData.r
        delete signedData.s
        return signedData
    }
}

const singleBlocksoftKeysForRef = new BlocksoftKeysForRef ()

export default singleBlocksoftKeysForRef
