/**
 * @docs https://www.npmjs.com/package/react-native-keychain
 */
import 'react-native'
import * as Keychain from 'react-native-keychain'

import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

export class BlocksoftKeysStorage {

    /**
     * @type {string}
     * @private
     */
    _serviceName = ''

    /**
     * @type {number}
     * @private
     */
    _serviceWalletsCounter = 0

    /**
     * @type {{}|array}
     * @private
     */
    _serviceWallets = {}

    /**
     * @type {boolean}
     * @private
     */
    _serviceWasInited = false

    /**
     * @type {array}
     */
    publicWallets = []

    /**
     * @type {string|boolean}
     */
    publicSelectedWallet = ''

    constructor(_serviceName = 'BlocksoftKeys'){
        this._serviceName = _serviceName
    }
    /**
     * @private
     */
    async _getServiceName(name) {
        this._serviceName = name
        this._serviceWasInited = false
        await this._init()
    }

    /**
     * @param {string} key
     * @return {Promise<boolean|{priv: string, pub: string}>}
     * @private
     */
    async _getKeyValue(key) {
        let res = await Keychain.getInternetCredentials(this._serviceName + '_' + key)
        if (!res) return false
        return { 'pub': res.username, 'priv': res.password }
    }

    /**
     * @param {string} key
     * @param {string|int} pub
     * @param {string|boolean} priv
     * @return {Promise<*>}
     * @private
     */
    async _setKeyValue(key, pub, priv = false) {
        pub = pub + ''
        if (!priv) priv = pub
        return Keychain.setInternetCredentials(this._serviceName + '_' + key, pub, priv)
    }

    /**
     * @private
     */
    async _init() {
        if (this._serviceWasInited) {
            return true
        }
        BlocksoftCryptoLog.log('BlocksoftKeysStorage init started')

        let count = await this._getKeyValue('wallets_counter')

        this._serviceWalletsCounter = count && count.priv ? count.priv * 1 : 0
        this._serviceWallets = {}
        this.publicWallets = []
        this.publicSelectedWallet = false
        let firstWallet = false
        BlocksoftCryptoLog.log('BlocksoftKeysStorage countMnemonics', this._serviceWalletsCounter)
        if (this._serviceWalletsCounter > 0) {
            for (let i = 1; i <= this._serviceWalletsCounter; i++) {
                let wallet = await this._getKeyValue('wallet_' + i)
                this._serviceWallets[wallet.pub] = wallet.priv
                this._serviceWallets[i - 1] = wallet.priv
                this.publicWallets.push(wallet.pub)
                if (i === 1) {
                    firstWallet = wallet.pub
                }
            }
            BlocksoftCryptoLog.log('BlocksoftKeysStorage savedMnemonics', JSON.stringify(this.publicWallets))
        }
        let tmp = await this._getKeyValue('selected_hash')
        if (tmp && tmp.pub) {
            this.publicSelectedWallet = tmp.pub
        }
        if (!this.publicSelectedWallet || !this._serviceWallets[this.publicSelectedWallet]) {
            this.publicSelectedWallet = firstWallet
        }

        BlocksoftCryptoLog.log('BlocksoftKeysStorage init ended')
        this._serviceWasInited = true
    }

    async reInit() {
        this._serviceWasInited = false
        return this._init()
    }


    /**
     * @return {Promise<number>}
     */
    async countMnemonics() {
        await this._init()
        return this._serviceWalletsCounter
    }


    /**
     * public list of wallets hashes
     * @return {Array}
     */
    async getWallets() {
        await this._init()
        return this.publicWallets
    }

    /**
     * public selected wallet hash
     * @return {string}
     */
    async getSelectedWallet() {
        await this._init()
        return this.publicSelectedWallet
    }

    /**
     * public select wallet hash
     * @param {string} hashOrId
     * @return {boolean}
     */
    async setSelectedWallet(hashOrId) {
        await this._init()
        if (!this._serviceWallets[hashOrId]) {
            throw new Error('undefined wallet with hash ' + hashOrId)
        }
        this.publicSelectedWallet = hashOrId
        await this._setKeyValue('selected_hash', hashOrId)
        return true
    }

    /**
     * public wallet mnemonic by hash
     * @return {string}
     */
    async getWalletMnemonic(hashOrId) {
        await this._init()
        if (!this._serviceWallets[hashOrId]) {
            throw new Error('undefined wallet with hash ' + hashOrId)
        }
        return this._serviceWallets[hashOrId]
    }

    /**
     * @param {string} newMnemonic.mnemonic
     * @param {string} newMnemonic.hash
     * @return {Promise<boolean>}
     */
    async isMnemonicAlreadySaved(newMnemonic) {
        await this._init()
        if (typeof this._serviceWallets[newMnemonic.hash] === 'undefined' || !this._serviceWallets[newMnemonic.hash]) {
            return false
        }
        if (this._serviceWallets[newMnemonic.hash] !== newMnemonic.mnemonic) {
            throw new Error('something wrong with hash algorithm')
        }
        return true
    }
    /**
     * @param {string} newMnemonic.mnemonic
     * @param {string} newMnemonic.hash
     * @return {Promise<string>}
     */
    async saveMnemonic(newMnemonic) {
        await this._init()

        let logData = JSON.parse(JSON.stringify(newMnemonic))
        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
        BlocksoftCryptoLog.log('BlocksoftKeysStorage saveMnemonic', logData)

        if (!newMnemonic.hash) {
            throw new Error('unique hash required ' + JSON.stringify(newMnemonic))
        }
        if (this._serviceWallets[newMnemonic.hash]) {
            if (this._serviceWallets[newMnemonic.hash] !== newMnemonic.mnemonic) {
                console.log(newMnemonic.mnemonic)
                console.log(this._serviceWallets[newMnemonic.hash])
                throw new Error('something wrong with hash algorithm')
            }
            return newMnemonic.hash // its ok
        }
        this._serviceWalletsCounter++

        let unique = newMnemonic.hash

        await this._setKeyValue('wallet_' + this._serviceWalletsCounter, unique, newMnemonic.mnemonic)
        await this._setKeyValue('wallets_counter', this._serviceWalletsCounter)
        this._serviceWallets[unique] = newMnemonic.mnemonic
        this._serviceWallets[this._serviceWalletsCounter - 1] = newMnemonic.mnemonic

        this.publicWallets.push(unique)
        this.publicSelectedWallet = unique

        return newMnemonic.hash
    }

}

let singleBlocksoftKeysStorage = new BlocksoftKeysStorage()

export default singleBlocksoftKeysStorage
