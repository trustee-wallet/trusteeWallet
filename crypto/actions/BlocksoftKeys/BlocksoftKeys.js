import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDict from '../../common/BlocksoftDict'
import BlocksoftKeysUtils from './BlocksoftKeysUtils'

import * as BlocksoftRandom from '../../../crypto-native/react-native-blocksoft-random'


const bip32 = require('bip32')
const bip39 = require('bip39')
const bip44Constants = require('../../common/ext/bip44-constants')
const networksConstants = require('../../common/ext/networks-constants')


const Dispatcher = require('../../blockchains/Dispatcher').init()

const ETH_CACHE = {}
const CACHE = {}

class BlocksoftKeys {

    constructor() {
        this._bipHex = {}
        for (let currency of bip44Constants) {
            this._bipHex[currency[1]] = currency[0]
            this._bipHex[currency[2]] = currency[0]
        }
        this._getRandomBytesFunction = BlocksoftRandom.getRandomBytes
    }

    /**
     * create new mnemonic object (also gives hash to store in public db)
     * @param {int} size
     * @return {Promise<{mnemonic: string, hash: string}>}
     */
    async newMnemonic(size = 256, USE_TON = false) {
        BlocksoftCryptoLog.log(`BlocksoftKeys newMnemonic called`)

        /*let mnemonic = false
        if (USE_TON) {
            for (let i = 0; i < 10000; i++) {
                let random = await this._getRandomBytesFunction(size / 8)
                random = Buffer.from(random, 'base64')
                let testMnemonic = bip39.entropyToMnemonic(random)
                if (await BlocksoftKeysUtils.tonCheckRevert(testMnemonic)) {
                    mnemonic = testMnemonic
                    break
                }
                console.log('step ' + i + ' not valid ton ' + testMnemonic)
            }
            if (!mnemonic) {
                throw new Error('TON Mnemonic is not validating')
            }
        } else {
            let random = await this._getRandomBytesFunction(size / 8)
            random = Buffer.from(random, 'base64')
            mnemonic = bip39.entropyToMnemonic(random)
        }*/
        let random = await this._getRandomBytesFunction(size / 8)
        random = Buffer.from(random, 'base64')
        let mnemonic = bip39.entropyToMnemonic(random)
        let hash = BlocksoftKeysUtils.hashMnemonic(mnemonic)
        BlocksoftCryptoLog.log(`BlocksoftKeys newMnemonic finished`)
        return { mnemonic, hash }
    }

    /**
     * @param {string} mnemonic
     * @return {Promise<boolean>}
     */
    async validateMnemonic(mnemonic) {
        BlocksoftCryptoLog.log(`BlocksoftKeys validateMnemonic called`)
        let result = await bip39.validateMnemonic(mnemonic)
        if (!result) {
            throw new Error('invalid mnemonic for bip39')
        }
        return result
    }


    /**
     * @param {string} data.mnemonic
     * @param {string|string[]} data.currencyCode = all
     * @param {int} data.fromIndex = 0
     * @param {int} data.toIndex = 100
     * @param {boolean} data.fullTree = false
     * @return {Promise<{currencyCode:[{address, privateKey, path, index, type}]}>}
     */
    async discoverAddresses(data) {
        let logData = {...data}
        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'

        BlocksoftCryptoLog.log(`BlocksoftKeys discoverAddresses called`, logData)
        if (typeof(data.fullTree) === 'undefined') {
            data.fullTree = false
        }
        let toDiscover = BlocksoftDict.Codes
        if (data.currencyCode) {
            if (typeof (data.currencyCode) === 'string') {
                toDiscover = [data.currencyCode]
            } else {
                toDiscover = data.currencyCode
            }
        }

        let results = {}

        let fromIndex = data.fromIndex ? data.fromIndex : 0
        let toIndex = data.toIndex ? data.toIndex : 10
        let mnemonicCache = data.mnemonic.toLowerCase()
        let bitcoinRoot = false
        for (let currencyCode of toDiscover) {
            results[currencyCode] = []
            let settings = BlocksoftDict.getCurrencyAllSettings(currencyCode)

            let hexes = []
            if (settings.addressCurrencyCode) {
                hexes.push(this._bipHex[settings.addressCurrencyCode])
                if (!this._bipHex[settings.addressCurrencyCode]) {
                    throw new Error('UNKNOWN_CURRENCY_CODE SETTED ' + settings.addressCurrencyCode)
                }
            }

            if (this._bipHex[currencyCode]) {
                hexes.push(this._bipHex[currencyCode])
            } else if (!settings.addressCurrencyCode) {
                if (settings.extendsProcessor && this._bipHex[settings.extendsProcessor]) {
                    hexes.push(this._bipHex[settings.extendsProcessor])
                } else {
                    throw new Error('UNKNOWN_CURRENCY_CODE ' + currencyCode + ' AND NO SETTED addressCurrencyCode')
                }
            }

            let isAlreadyMain = false

            let suffixes
            if (data.fullTree) {
                suffixes = [
                    { 'type': 'main', 'suffix': '0/0' },
                    { 'type': 'second', 'suffix': '0/1' },
                    { 'type': 'change', 'suffix': '1/0' },
                    { 'type': 'change', 'suffix': '1/1' }
                ]
            } else {
                suffixes = [
                    { 'type': 'main', 'suffix': '0/0' }
                ]
                hexes = [hexes[0]]
            }

            let hexesCache = mnemonicCache + '_' + settings.addressProcessor + '_' + JSON.stringify(hexes)

            if (typeof(CACHE[hexesCache]) === 'undefined') {
                BlocksoftCryptoLog.log(`BlocksoftKeys will discover ${settings.addressProcessor}`)
                let root = false
                if (typeof networksConstants[currencyCode] !== 'undefined') {
                    root = bip32.fromSeed(await this.getSeedCached(data.mnemonic), networksConstants[currencyCode])
                } else {
                    if (!bitcoinRoot) {
                        bitcoinRoot = bip32.fromSeed(await this.getSeedCached(data.mnemonic))
                    }
                    root = bitcoinRoot
                }
                // BIP32 Extended Private Key to check - uncomment
                // let childFirst = root.derivePath('m/44\'/2\'/0\'/0')
                // console.log(childFirst.toBase58())

                /**
                 * @type {EthAddressProcessor|BtcAddressProcessor}
                 */
                let processor = await Dispatcher.innerGetAddressProcessor(settings)

                for (let hex of hexes) {
                    hex &= 0x7FFFFFFF

                    if (isAlreadyMain) {
                        suffixes[0].type = 'second'
                    }
                    isAlreadyMain = true

                    for (let index = fromIndex; index < toIndex; index++) {
                        for (let suffix of suffixes) {
                            let path = `m/44'/${hex}'/${index}'/${suffix.suffix}`
                            let child = root.derivePath(path)
                            let result = await processor.getAddress(child.privateKey, {publicKey: child.publicKey, walletHash: data.walletHash})
                            result.basicPrivateKey = child.privateKey.toString('hex')
                            result.basicPublicKey = child.publicKey.toString('hex')
                            result.path = path
                            result.index = index
                            result.type = suffix.type
                            results[currencyCode].push(result)
                        }
                    }
                }
                CACHE[hexesCache] = results[currencyCode]
                if (currencyCode === 'ETH') {
                    ETH_CACHE[mnemonicCache] = results[currencyCode][0]
                }
            } else {
                BlocksoftCryptoLog.log(`BlocksoftKeys will be from cache ${settings.addressProcessor}`)
                results[currencyCode] = CACHE[hexesCache]
            }
        }
        return results
    }

    getSeedCached(mnemonic) {
        BlocksoftCryptoLog.log(`BlocksoftKeys bip39MnemonicToSeed started`)
        let mnemonicCache = mnemonic.toLowerCase()
        if (typeof CACHE[mnemonicCache] === 'undefined') {
            CACHE[mnemonicCache] = BlocksoftKeysUtils.bip39MnemonicToSeed(mnemonic.toLowerCase())
        }
        let seed = CACHE[mnemonicCache] // will be rechecked on saving
        BlocksoftCryptoLog.log(`BlocksoftKeys bip39MnemonicToSeed ended`)
        return seed
    }

    getEthCached(mnemonicCache) {
        if(typeof(ETH_CACHE[mnemonicCache]) === 'undefined') return false
        return ETH_CACHE[mnemonicCache]
    }

    /**
     * @param {string} data.mnemonic
     * @param {string} data.currencyCode
     * @param {string} data.path
     * @return {Promise<{address, privateKey}>}
     */
    async discoverOne(data) {
        let seed = BlocksoftKeysUtils.bip39MnemonicToSeed(data.mnemonic.toLowerCase())
        let root = bip32.fromSeed(seed)
        let child = root.derivePath(data.path)
        /**
         * @type {EthAddressProcessor|BtcAddressProcessor}
         */
        let processor = await Dispatcher.getAddressProcessor(data.currencyCode)
        return processor.getAddress(child.privateKey)
    }
}

let singleBlocksoftKeys = new BlocksoftKeys()

export default singleBlocksoftKeys
