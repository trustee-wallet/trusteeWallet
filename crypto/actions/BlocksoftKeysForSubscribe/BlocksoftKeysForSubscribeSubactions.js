import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysUtils from '../BlocksoftKeys/BlocksoftKeysUtils'
import BlocksoftKeysForSubscribeUtils from './BlocksoftKeysForSubscribeUtils'

const bitcoin = require('bitcoinjs-lib')
const bip32 = require('bip32')
const sjcl = require('sjcl') 

const createHash = require('create-hash')

const CACHE_ENCRYPT = {}
class BlocksoftKeysForSubscribeSubactions {

    /**
     * @param {string} data.mnemonic
     * @return {Promise<{currencyCode:[{address, privateKey, path, index, type}]}>}
     */
    async discoverPublicAndPrivate(data) {
        let logData = { ...data }
        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'

        BlocksoftCryptoLog.log(`BlocksoftKeysForSubscribe discoverPublicAndPrivate called`, logData)

        let result = {}
        BlocksoftCryptoLog.log(`BlocksoftKeysForSubscribe discoverPublicAndPrivate no cache`, logData)
        let seed = BlocksoftKeysUtils.bip39MnemonicToSeed(data.mnemonic.toLowerCase())
        let root = bip32.fromSeed(seed)

        let path0 = `m/44'/0'/0'/0/0`
        let child0 = root.derivePath(path0)
        result.btcPrivKey = child0.privateKey
        result.btcPubKey = child0.publicKey.toString('hex')
        let keyPair = bitcoin.ECPair.fromPrivateKey(child0.privateKey)
        result.btcWifKey = keyPair.toWIF()

        let path1 = `m/44'/0'/0'`
        let child1 = root.derivePath(path1)
        result.xPrivKey = child1.privateKey
        result.xPubKey = child1.publicKey.toString('hex')
        result.xPriv = child1.toBase58()
        result.xPub = child1.neutered().toBase58()
        result.copayerId = createHash('sha256').update(result.xPub).digest('hex')


        let path2 = `m/1'/0`
        let child2 = root.derivePath(path2)
        result.requestPrivKey = child2.privateKey
        result.requestPubKey = child2.publicKey.toString('hex')

        BlocksoftCryptoLog.log(`BlocksoftKeysForSubscribe discoverPublicAndPrivate finished no cache`, logData)
        BlocksoftCryptoLog.log(`BlocksoftKeysForSubscribe discoverPublicAndPrivate finished`, logData)
        return result
    }

    personalEncryptingKey(key) {
        let entropySource = createHash('sha256').update(Buffer.from(key)).digest('hex')
        let b = Buffer.from(entropySource, 'hex')
        let b2 = BlocksoftKeysForSubscribeUtils.hash_sha256hmac(b, 'personalKey')
        return b2.slice(0, 16).toString('base64')
    }

    async sharedEncryptingKey(key) {
        let res1 = createHash('sha256').update(Buffer.from(key, 'hex')).digest()
        let res2 = res1.slice(0, 16)
        let res3 = res2.toString('base64')
        return res3
    }

    async encryptMessage(message, encryptingKey) {
        if (typeof CACHE_ENCRYPT[message + '_' + encryptingKey] != 'undefined') {
            return CACHE_ENCRYPT[message + '_' + encryptingKey]
        }
        let key = sjcl.codec.base64.toBits(encryptingKey)
        let res = sjcl.encrypt(key, message, { ks: 128, iter: 1 })
        CACHE_ENCRYPT[message + '_' + encryptingKey] = res
        return res
    }

    signRequest = function (method, url, args, result) {
        let message = [method.toLowerCase(), url, JSON.stringify(args)].join('|');
        let res = BlocksoftKeysForSubscribeUtils.sign(message, result.requestPrivKey)
        return res
    }
    sign = function (message, key) {
        return BlocksoftKeysForSubscribeUtils.sign(message, key)
    }
}

const singleBlocksoftKeysForSubscribeSubactions = new BlocksoftKeysForSubscribeSubactions()

export default singleBlocksoftKeysForSubscribeSubactions
