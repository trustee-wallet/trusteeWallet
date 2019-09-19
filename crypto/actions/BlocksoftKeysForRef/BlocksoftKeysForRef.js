import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysUtils from '../BlocksoftKeys/BlocksoftKeysUtils'
import BlocksoftKeysForRefServerSide from  './BlocksoftKeysForRefServerSide'

const bip32 = require('bip32')

const Dispatcher = require('../../blockchains/Dispatcher').init()

class BlocksoftKeysForRef {

    /**
     * @param {string} data.mnemonic
     * @param {int} data.index
     * @return {Promise<{currencyCode:[{address, privateKey, path, index, type}]}>}
     */
    async discoverPublicAndPrivate(data) {
        let logData = JSON.parse(JSON.stringify(data))
        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
        BlocksoftCryptoLog.log(`BlocksoftKeysForRef discoverPublicAndPrivate called`, logData)

        let index = 0
        if (typeof data.index !== 'undefined') {
            index = data.index
        }
        let seed = BlocksoftKeysUtils.bip39MnemonicToSeed(data.mnemonic.toLowerCase())
        let root = bip32.fromSeed(seed)
        let path = `m/44'/60'/${index}'/0/0`
        let child = root.derivePath(path)

        let processor = await Dispatcher.getAddressProcessor('ETH')
        let result = processor.getAddress(child.privateKey)
        result.index = index
        result.path = path
        result.cashbackToken = BlocksoftKeysForRefServerSide.addressToToken(result.address)
        return result
    }

    async signDataForApi(msg, privateKey) {
        let processor = await Dispatcher.getAddressProcessor('ETH')
        let signedData = await processor.signMessage(msg, privateKey)
        delete signedData.v
        delete signedData.r
        delete signedData.s
        return signedData
    }
}

const singleBlocksoftKeysForRef = new BlocksoftKeysForRef ()

export default singleBlocksoftKeysForRef
