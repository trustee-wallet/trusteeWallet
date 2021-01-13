/**
 * @author Ksu
 * @version 0.5
 * @docs https://www.npmjs.com/package/react-native-keychain
 */
import 'react-native'
import * as Keychain from 'react-native-keychain'

import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { fioSdkWrapper } from '../../blockchains/fio/FioSdkWrapper'
import config from '../../../app/config/config'

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

    constructor(_serviceName = 'BlocksoftKeysStorage3') {
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
        const res = await Keychain.getInternetCredentials(this._serviceName + '_' + key, {
            authenticationPrompt: {
                title: 'Fingerprint title',
                cancel: 'Cancel'
            }
        })
        if (!res) return false
        return { 'pub': res.username, 'priv': res.password }
    }

    // /**
    //  * @return {Promise<*>}
    //  * @public
    //  */
    // async getKeychainData() {
    //
    //     let serversArray = [
    //         'wallets_counter',
    //         'selected_hash'
    //     ]
    //
    //     let count = await this._getKeyValue('wallets_counter')
    //
    //     this._serviceWalletsCounter = count && count.priv ? count.priv * 1 : 0
    //     if (this._serviceWalletsCounter > 0) {
    //         for (let i = 1; i <= this._serviceWalletsCounter; i++) {
    //             serversArray.push('wallet_' + i)
    //         }
    //     }
    //
    //     for(let i = 0; i < serversArray.length; i++){
    //         await Keychain.getInternalCredential(this._serviceName + '_' + serversArray[i])
    //     }
    // }

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
        let res = false
        try {
            res = await Keychain.setInternetCredentials(this._serviceName + '_' + key, pub, priv, {
                authenticationPrompt: {
                    title: 'Fingerprint title',
                    cancel: 'Cancel'
                },
                // if will be breaking again try accessControl : 'BiometryAnyOrDevicePasscode'
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BlocksoftKeysStorage _setKeyValue error ', e)
            }
            if (key.indexOf('wallet') !== -1) {
                throw e
            }
        }
        return res
    }

    /**
     * @private
     */
    async _init() {
        if (this._serviceWasInited) {
            return true
        }
        BlocksoftCryptoLog.log('BlocksoftKeysStorage init started')

        const count = await this._getKeyValue('wallets_counter')

        this._serviceWalletsCounter = count && count.priv ? count.priv * 1 : 0
        this._serviceWallets = {}
        this.publicWallets = []
        this.publicSelectedWallet = false
        let firstWallet = false
        BlocksoftCryptoLog.log('BlocksoftKeysStorage countMnemonics ' + this._serviceWalletsCounter)
        if (this._serviceWalletsCounter > 0) {
            for (let i = 1; i <= this._serviceWalletsCounter; i++) {
                const wallet = await this._getKeyValue('wallet_' + i)
                if (!wallet.priv || wallet.priv === '' || wallet.priv === 'new wallet is not generated - please reinstall and restart' || wallet.priv === wallet.pub) {
                    continue
                }
                this._serviceWallets[wallet.pub] = wallet.priv
                this._serviceWallets[i - 1] = wallet.priv
                this.publicWallets.push(wallet.pub)
                if (i === 1) {
                    firstWallet = wallet.pub
                }
            }
            BlocksoftCryptoLog.log('BlocksoftKeysStorage savedMnemonics', JSON.stringify(this.publicWallets))
        }
        const tmp = await this._getKeyValue('selected_hash')
        if (tmp && tmp.pub) {
            this.publicSelectedWallet = tmp.pub
            BlocksoftCryptoLog.log('BlocksoftKeysStorage publicSelectedWallet by selected_hash', this.publicSelectedWallet)
        }
        if (!this.publicSelectedWallet || !this._serviceWallets[this.publicSelectedWallet]) {
            this.publicSelectedWallet = firstWallet
            BlocksoftCryptoLog.log('BlocksoftKeysStorage publicSelectedWallet by recheck', this.publicSelectedWallet)
        }
        BlocksoftCryptoLog.log('BlocksoftKeysStorage init ended')
        this._serviceWasInited = true

        if (this.publicSelectedWallet) {
            await fioSdkWrapper.init(this.publicSelectedWallet)
        }
    }

    async reInit() {
        this._serviceWasInited = false
        return this._init()
    }

    async getOneWalletText(walletHash, discoverPath, currencyCode) {
        try {
            const key = this.getAddressCacheKey(walletHash, discoverPath, currencyCode)
            return this.getAddressCache(key)
        } catch (e) {
            // do nothing
        }
        return false
    }

    async getAllWalletsText() {
        let res = ''
        for (let i = 1; i <= 3; i++) {
            try {
                const wallet = await this._getKeyValue('wallet_' + i)
                if (typeof wallet.priv !== 'undefined' && wallet.priv !== 'undefined') {
                    res += ' WALLET#' + i + ' ' + wallet.priv
                }
            } catch (e) {
                // do nothing
            }
        }
        if (res === '') {
            return 'Nothing found by general search'
        }
        return res
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
     * @param {string} source
     * @return {boolean}
     */
    async setSelectedWallet(hashOrId, source) {
        await this._init()
        const msg = 'BlocksoftKeysStorage setSelectedWallet ' + source + ' ' + hashOrId + ' '

        let isChanged = false
        if (!hashOrId || typeof hashOrId === 'undefined' || hashOrId === 'first') {
            if (typeof this.publicWallets[0] === 'undefined') {
                this._serviceWasInited = false
                await this._init()
                if (typeof this.publicWallets[0] === 'undefined') {
                    throw new Error('System empty second try on setSelectedWallet')
                }
            }
            if (!this.publicSelectedWallet || typeof this.publicSelectedWallet === 'undefined') {
                hashOrId = this.publicWallets[0]
                this.publicSelectedWallet = hashOrId
            } else {
                // do nothing
            }
            isChanged = true
        } else {
            if (!this._serviceWallets[hashOrId]) {
                throw new Error('undefined wallet with hash ' + hashOrId)
            }
            try {
                await this._setKeyValue('selected_hash', hashOrId)
                this.publicSelectedWallet = hashOrId
                isChanged = true
            } catch (e) {
                return this.publicSelectedWallet
            }
        }
        BlocksoftCryptoLog.log(msg + 'new publicSelectedWallet = ' + this.publicSelectedWallet + ' ' + JSON.stringify({ isChanged }))

        if (isChanged) {
            await fioSdkWrapper.init(this.publicSelectedWallet)
        }

        return this.publicSelectedWallet
    }

    getFirstWallet() {
        if (!this.publicSelectedWallet || typeof this.publicSelectedWallet === 'undefined') {
            this.setSelectedWallet('first')
            if (!this.publicWallets || typeof this.publicWallets[0] === 'undefined') {
                return false
            }
            return this.publicWallets[0]
        }
        return this.publicSelectedWallet
    }

    /**
     * public wallet mnemonic by hash
     * @return {string}
     */
    async getWalletMnemonic(hashOrId, source = 'default') {
        await this._init()
        if (!this._serviceWallets[hashOrId]) {
            throw new Error('undefined wallet with hash ' + hashOrId + ' source ' + source)
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

        const logData = { ...newMnemonic }
        if (typeof logData.mnemonic !== 'undefined') logData.mnemonic = '***'
        BlocksoftCryptoLog.log('BlocksoftKeysStorage saveMnemonic', logData)

        if (!newMnemonic.hash) {
            throw new Error('unique hash required ' + JSON.stringify(newMnemonic))
        }
        if (this._serviceWallets[newMnemonic.hash]) {
            if (this._serviceWallets[newMnemonic.hash] !== newMnemonic.mnemonic) {
                throw new Error('something wrong with hash algorithm')
            }
            return newMnemonic.hash // its ok
        }
        this._serviceWalletsCounter++

        const unique = newMnemonic.hash

        /*
        hash should give unique values for different mnemonics
        let i = 0
        while (this._serviceWallets[unique]) {
            unique = newMnemonic.hash + '_' + i
            i++
            if (i > 1000) {
                throw new Error('unique hash is not reachable for ' + newMnemonic.hash)
            }
        }
        */

        await this._setKeyValue('wallet_' + this._serviceWalletsCounter, unique, newMnemonic.mnemonic)
        await this._setKeyValue('wallets_counter', this._serviceWalletsCounter)
        this._serviceWallets[unique] = newMnemonic.mnemonic
        this._serviceWallets[this._serviceWalletsCounter - 1] = newMnemonic.mnemonic

        this.publicWallets.push(unique)
        this.publicSelectedWallet = unique

        return newMnemonic.hash
    }

    getAddressCacheKey(walletHash, discoverPath, currencyCode) {
        return walletHash + '_' + discoverPath + '_' + currencyCode
    }

    async getAddressCache(hashOrId) {
        const res = await this._getKeyValue('ar4_' + hashOrId)
        if (!res) return false
        return { address: res.pub, privateKey: res.priv }
    }

    async setAddressCache(hashOrId, res) {
        return this._setKeyValue('ar4_' + hashOrId, res.address, res.privateKey)
    }

    async getLoginCache(hashOrId) {
        const res = await this._getKeyValue('login_' + hashOrId)
        if (!res) return false
        return { login: res.pub, pass: res.priv }
    }

    async setLoginCache(hashOrId, res) {
        return this._setKeyValue('login_' + hashOrId, res.login, res.pass)
    }

    async setSettingValue(hashOrId, value) {
        return this._setKeyValue('setting_' + hashOrId, hashOrId, value)
    }

    async getSettingValue(hashOrId) {
        const res = await this._getKeyValue('setting_' + hashOrId)
        if (!res) return '0'
        return res.priv.toString()
    }
}

const singleBlocksoftKeysStorage = new BlocksoftKeysStorage()
export default singleBlocksoftKeysStorage
