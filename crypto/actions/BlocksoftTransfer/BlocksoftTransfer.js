/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftKeysStorage from '../BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftPrivateKeysUtils from '../../common/BlocksoftPrivateKeysUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftTransferDispatcher from '../../blockchains/BlocksoftTransferDispatcher'
import walletDS from '../../../app/appstores/DataSource/Wallet/Wallet'
import walletPubDS from '../../../app/appstores/DataSource/Wallet/WalletPub'
import accountDS from '../../../app/appstores/DataSource/Account/Account'
import accountHdDS from '../../../app/appstores/DataSource/Account/AccountHd'
import settingsActions from '../../../app/appstores/Stores/Settings/SettingsActions'

const Dispatcher = new BlocksoftTransferDispatcher()

const CACHE_DOUBLE_TO = {}
const CACHE_DOUBLE_CHECK = {}
const CACHE_VALID_TIME = 20000 // 2 minute

class BlocksoftTransfer {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{walletHash, privateKey, txHash, txInput, addressFrom, addressFromXpub, privateKeyLegacy, addressFromLegacy, addressFromLegacyXpub, addressTo, multiply, amount, feeForTx, currencyCode, addressForChange, addressForChangeHD, jsonData, memo, walletAllowReplaceByFee, walletUseUnconfirmed, walletUseLegacy}}
     * @private
     */
    _data = {}

    /**
     * @type {{walletHash, privateKey, txHash, txInput, addressFrom, addressFromXpub, addressFromLegacy, addressFromLegacyXpub, addressTo, multiply, amount, feeForTx, currencyCode, addressForChange, addressForChangeHD, memo, walletAllowReplaceByFee, walletUseUnconfirmed, walletUseLegacy}}
     * @private
     */
    _logData = {}

    /**
     * @type {{derivePath, walletIsHd}}
     * @private
     */
    _private = {}

    /**
     * @type {{}}
     * @private
     */
    _privateCache = {}

    /**
     * @param {string} hash
     * @return {BlocksoftTransfer}
     */
    setWalletHash(hash) {
        this._data.walletHash = hash
        this._private.walletIsHd = -1
        this._data.walletUseUnconfirmed = -1
        this._data.walletUseLegacy = -1
        this._data.walletAllowReplaceByFee = -1
        this._data.privateKey = false
        return this
    }

    /**
     * @param {string} key
     * @return {BlocksoftTransfer}
     */
    setPrivateKey(key) {
        this._data.walletHash = ''
        this._private.walletIsHd = -1
        this._data.walletUseUnconfirmed = -1
        this._data.walletUseLegacy = -1
        this._data.walletAllowReplaceByFee = -1
        this._data.privateKey = key
        return this
    }

    /**
     * @param {string} derivePath
     * @return {BlocksoftTransfer}
     */
    setDerivePath(derivePath) {
        this._private.derivePath = derivePath.replace(/quote/g, '\'')
        return this
    }

    async _initPrivate() {
        if (!this._data.walletHash || !this._data.addressFrom) {
            return false
        }

        let mnemonic = this._privateCache[this._data.walletHash]
        if (!mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(this._data.walletHash)
            this._privateCache[this._data.walletHash] = mnemonic
        }
        if (!mnemonic) {
            throw new Error('no mnemonic for hash ' + this._data.walletHash)
        }

        let wallet = false
        if (this._data.walletUseUnconfirmed === -1 || this._data.walletUseLegacy === -1) {
            wallet = await walletDS.getWalletByHash(this._data.walletHash)
            this._data.walletUseUnconfirmed = wallet.walletUseUnconfirmed > 0
            this._logData.walletUseUnconfirmed = wallet.walletUseUnconfirmed
            this._data.walletAllowReplaceByFee = wallet.walletAllowReplaceByFee > 0
            this._logData.walletAllowReplaceByFee = wallet.walletAllowReplaceByFee > 0

            if (wallet.walletUseLegacy === 2 || wallet.walletUseLegacy === '2') {
                const btcShowTwoAddress = await settingsActions.getSetting('btcShowTwoAddress')
                let btcLegacyOrSegWit = await settingsActions.getSetting('btc_legacy_or_segwit')
                if (!!JSON.parse(btcShowTwoAddress)) {
                    btcLegacyOrSegWit = 'two_addresses'
                }
                this._data.walletUseLegacy = btcLegacyOrSegWit === 'legacy'
            } else {
                this._data.walletUseLegacy = wallet.walletUseLegacy > 0
            }
            this._logData.walletUseLegacy = this._data.walletUseLegacy
        }


        if (this._data.currencyCode === 'BTC' || this._data.currencyCode === 'USDT') {
            BlocksoftCryptoLog.log('BlocksoftTransfer._initPrivate started for BTC/USDT ' + this._private.derivePath, this._logData)
            if (!this._private.derivePath || this._private.derivePath.toString() === 'false') {
                this._private.derivePath = `m/84'/0'/0'/0/0`
            }
            const resultBtc = await BlocksoftPrivateKeysUtils.getPrivateKey({
                mnemonic,
                addressToCheck: false,
                walletHash: this._data.walletHash,
                derivationPath: 'm/44' + this._private.derivePath.substr(4),
                currencyCode: 'BTC'
            })
            const accountSegwit = {
                mnemonic,
                addressToCheck: false,
                walletHash: this._data.walletHash,
                derivationPath: 'm/84' + this._private.derivePath.substr(4),
                currencyCode: 'BTC_SEGWIT'
            }
            const resultSegwit = await BlocksoftPrivateKeysUtils.getPrivateKey(accountSegwit)
            accountSegwit.address = resultSegwit.address
            accountSegwit.index = accountSegwit.derivationPath.split(`'/`)[2]

            await accountDS.insertAccountByPrivateKey(accountSegwit)

            if (resultBtc.address !== this._data.addressFrom && resultSegwit.address !== this._data.addressFrom) {
                throw new Error('BlocksoftTransfer._initPrivate private key discovered is not for address you set ' + resultBtc.address + '!=' + resultSegwit.address + '!=' + this._data.addressFrom)
            }

            this._data.addressFrom = resultSegwit.address
            this._data.privateKey = resultSegwit.privateKey
            this._data.addressFromLegacy = resultBtc.address
            this._data.privateKeyLegacy = resultBtc.privateKey
            this._logData.addressFrom = resultSegwit.address
            this._logData.addressFromLegacy = resultBtc.address
            this._logData.privateKey = '***'

            if (this._private.walletIsHd === -1) {
                if (!wallet) {
                    wallet = await walletDS.getWalletByHash(this._data.walletHash)
                }
                this._private.walletIsHd = wallet.walletIsHd > 0
            }

            if (this._private.walletIsHd) {
                const xpubs = await walletPubDS.getOrGenerate({ walletHash: this._data.walletHash, currencyCode: 'BTC' })
                const code = this._data.walletUseLegacy > 0 ? 'btc.44' : 'btc.84'
                let change = await accountHdDS.getAccountForChange({ walletPubId: xpubs[code].id })
                if (!change) {
                    await walletPubDS.discoverMoreAccounts({ currencyCode: 'BTC', walletHash: this._data.walletHash, needSegwit: true, needLegacy: false }, '_CRYPTO_TX_CREATE')
                    change = await accountHdDS.getAccountForChange({ walletPubId: xpubs[code].id })
                }
                if (change) {
                    this._data.addressForChangeHD = change
                    this._logData.addressForChangeHD = this._data.addressForChangeHD
                }
                this._data.addressFromXpub = xpubs['btc.84'].walletPubValue
                this._data.addressFromLegacyXpub = xpubs['btc.44'].walletPubValue
                this._data.addressFromCompatibleXpub = ''
                if (typeof xpubs['btc.49'] !== 'undefined') {
                    this._data.addressFromCompatibleXpub = xpubs['btc.49'].walletPubValue
                }
                this._data.mnemonic = mnemonic
            } else {
                this._data.addressFromXpub = false
                this._data.addressFromLegacyXpub = false
                this._data.addressFromCompatibleXpub = false
            }

            this._logData.addressFrom = this._data.addressFrom
            this._logData.addressFromLegacy = this._data.addressFromLegacy

            this._logData.addressFromXpub = this._data.addressFromXpub
            this._logData.addressFromLegacyXpub = this._data.addressFromLegacyXpub
            this._logData.addressFromCompatibleXpub = this._data.addressFromCompatibleXpub

            BlocksoftCryptoLog.log('BlocksoftTransfer._initPrivate finished for BTC/USDT', this._logData)
        } else {
            const discoverFor = {
                mnemonic,
                addressToCheck: this._data.addressFrom,
                walletHash: this._data.walletHash,
                derivationPath: this._private.derivePath,
                currencyCode: this._data.currencyCode
            }
            const result = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor)
            this._data.privateKey = result.privateKey
            this._logData.privateKey = '***'
            BlocksoftCryptoLog.log('BlocksoftTransfer._initPrivate finished for ' + this._data.currencyCode, this._logData)
        }
        return true
    }

    /**
     * @param address
     * @return {BlocksoftTransfer}
     */
    setAddressFrom(address) {
        if (address === this._data.addressFromLegacy || address === this._data.addressFrom) {

            this._data.txHash = false
            this._logData.txHash = false
            this._data.txInput = false
            this._logData.txInput = false

            return this
        }
        this._data.txHash = false
        this._logData.txHash = false
        this._data.txInput = false
        this._logData.txInput = false
        this._data.addressFrom = address.trim()
        this._data.addressFromLegacy = false
        this._data.addressFromXpub = false
        this._data.addressFromLegacyXpub = false
        this._data.addressFromCompatibleXpub = false
        this._data.addressForChangeHD = false
        this._logData.addressFrom = address.trim()
        this._logData.addressFromLegacy = false
        this._logData.addressFromXpub = false
        this._logData.addressFromLegacyXpub = false
        this._logData.addressFromCompatibleXpub = false
        this._logData.addressForChangeHD = false
        return this
    }

    /**
     * @param address
     * @return {BlocksoftTransfer}
     */
    setAddressTo(address) {
        this._data.addressTo = address.trim()
        this._logData.addressTo = address.trim()
        return this
    }


    /**
     * @param {string} memo
     * @return {BlocksoftTransfer}
     */
    setMemo(memo) {
        this._data.memo = memo
        this._logData.memo = memo
        return this
    }

    /**
     * @param {string} hash
     * @return {BlocksoftTransfer}
     */
    setTxHash(hash) {
        this._data.txHash = hash
        this._logData.txHash = hash
        return this
    }

    /**
     * @param {string} hash
     * @return {BlocksoftTransfer}
     */
    setTxInput(hash) {
        this._data.txInput = hash
        this._logData.txInput = hash
        return this
    }

    /**
     * @param {boolean} onOrOff
     * @return {BlocksoftTransfer}
     */
    setTransferAll(onOrOff) {
        this._data.addressForChange = onOrOff ? 'TRANSFER_ALL' : false
        this._logData.addressForChange = onOrOff ? 'TRANSFER_ALL' : false
        return this
    }

    /**
     * @param {string|number} amount
     * @return {BlocksoftTransfer}
     */
    setAmount(amount) {
        this._data.amount = amount
        this._logData.amount = amount
        this._data.multiply = 0
        this._logData.multiply = 0
        if (this._data.addressForChange === 'TRANSFER_ALL') {
            this._data.addressForChange = false
            this._logData.addressForChange = false
        }
        return this
    }

    /**
     * @param {string|number} multiply
     * @return {BlocksoftTransfer}
     */
    setMultiply(multiply) {
        this._data.multiply = multiply
        this._logData.multiply = multiply
        return this
    }

    /**
     * @param currencyCode
     * @return {BlocksoftTransfer}
     */
    setCurrencyCode(currencyCode) {
        if (this._data.currencyCode !== currencyCode) {
            this._data = {}
            this._logData = {}
        }
        this._data.currencyCode = currencyCode
        this._logData.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {BtcTransferProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getTransferProcessor(currencyCode)
        }
        return this
    }

    /**
     * @param jsonData
     * @param secondData
     * @return {BlocksoftTransfer}
     */
    setAdditional(jsonData, secondData) {
        this._data.jsonData = {}
        if (typeof jsonData !== 'undefined' && jsonData && jsonData !== 'false') {
            if (typeof jsonData === 'string') {
                jsonData = JSON.parse(jsonData)
            }
            if (typeof secondData !== 'undefined' && secondData) {
                this._data.jsonData = { ...jsonData, ...secondData }
            } else {
                this._data.jsonData = jsonData
            }
        } else {
            this._data.jsonData = secondData
        }
        return this
    }

    /**
     * @param {string|Object} feeForTx
     * @return {BlocksoftTransfer}
     */
    setFee(feeForTx) {
        this._data.feeForTx = feeForTx
        this._logData.feeForTx = feeForTx
        return this
    }

    getAddressToForTransferAll(addressTo) {
        if (this._data.currencyCode === 'BTC_TEST') {
            return 'mjojEgUSi68PqNHoAyjhVkwdqQyLv9dTfV'
        }
        if (this._data.currencyCode === 'XRP') {
            const tmp1 = 'rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P'
            const tmp2 = 'rnyWPfJ7dk2X15N7jqwmqo3Nspu1oYiRZ3'
            return addressTo === tmp1 ? tmp2 : tmp1
        }
        return addressTo
    }

    async checkTransferHasError() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (typeof this._processor[currencyCode].checkTransferHasError === 'undefined') {
            return false // ksu will do other if needed
        }
        if (typeof CACHE_DOUBLE_CHECK[currencyCode] !== 'undefined') {
            if (CACHE_DOUBLE_CHECK[currencyCode].to === this._data.addressFrom) {
                const diff = new Date().getTime() - CACHE_DOUBLE_CHECK[currencyCode].time
                if (diff < CACHE_VALID_TIME) {
                    return false
                }
            }
        }
        CACHE_DOUBLE_CHECK[currencyCode] = {
            from : this._data.addressFrom,
            time : new Date().getTime()
        }
        let isError
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.checkTransferHasError ${currencyCode} started ${this._data.addressFrom} `)
            isError = await this._processor[currencyCode].checkTransferHasError(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.checkTransferHasError ${currencyCode} got ${this._data.addressFrom} data`)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftTransfer.checkTransferHasError ${currencyCode} ` + e.message)
                return new Error('server.not.responding.check.transfer.has.error.' + currencyCode)
            } else {
                throw e
            }
        }
        return isError

    }

    async getTransferAllBalance(balanceRaw) {
        await this._initPrivate()
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let balanceUpdated
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferAllBalance ${currencyCode} started ${this._data.addressFrom} `)
            balanceUpdated = await this._processor[currencyCode].getTransferAllBalance(this._data, balanceRaw)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferAllBalance ${currencyCode} got ${this._data.addressFrom} data ` + JSON.stringify(balanceUpdated))
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftTransfer.getTransferAllBalance  ${currencyCode} ` + e.message)
                return new Error('server.not.responding.all.balance.' + currencyCode)
            } else {
                throw e
            }
        }

        return balanceUpdated
    }

    async getTransferPrecache(source) {
        const newTransferPrecache = this._data.currencyCode + '_' + this._data.addressFrom
        if (this._onceTransferPrecache === newTransferPrecache) return false
        this._onceTransferPrecache = newTransferPrecache
        await this._initPrivate()
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferPrecache ${currencyCode} started`, JSON.stringify(this._logData))
            res = await this._processor[currencyCode].getTransferPrecache(this._data, source)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferPrecache ${currencyCode} finished`, JSON.stringify(res))
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftTransfer.getTransferPrecache ${currencyCode} ` + e.message)
                throw new Error('server.not.responding.network.prices.' + currencyCode)
            } else {
                throw e
            }
        }
        return res
    }

    /**
     * @return {Promise<{feeForTx, langMsg, txSize, feeForByte, gasPrice, gasLimit}[]>}
     */
    async getFeeRate(isPrecount = false) {
        await this._initPrivate()
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }

        BlocksoftCryptoLog.log(`BlocksoftTransfer.getFeeRate ${currencyCode} started`, this._logData)
        const res = await this._processor[currencyCode].getFeeRate(this._data, {isPrecount})
        BlocksoftCryptoLog.log(`BlocksoftTransfer.getFeeRate ${currencyCode} finished`, res)

        return res
    }


    /**
     * @return {Promise<{hash, correctedAmountFrom}>}
     */
    async sendTx(uiErrorConfirmed = false) {
        await this._initPrivate()
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (!this._data.txHash && !uiErrorConfirmed && typeof CACHE_DOUBLE_TO[currencyCode] !== 'undefined') {
            if (CACHE_DOUBLE_TO[currencyCode].to === this._data.addressTo) {
                const diff = new Date().getTime() - CACHE_DOUBLE_TO[currencyCode].time
                if (diff < CACHE_VALID_TIME) {
                    throw new Error('UI_CONFIRM_DOUBLE_SEND')
                }
            }
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.sendTx ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].sendTx(this._data, uiErrorConfirmed)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.sendTx ${currencyCode} finished`, res)
            if (this._data.currencyCode === 'BTC' || this._data.currencyCode === 'USDT') {
                if (this._data.addressForChangeHD) {
                    await accountDS.massUpdateAccount(`address = '${this._data.addressForChangeHD}' OR address='${this._data.addressTo}'`, 'already_shown=1')
                }
            }
            CACHE_DOUBLE_TO[currencyCode] = {
                to: this._data.addressTo,
                amount: this._data.amount,
                time: new Date().getTime()
            }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1 && e.message.indexOf('UI_') === -1 ) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftTransfer.sendTx ${currencyCode} error ` + e.message, e.data ? e.data : e)
            }
            throw e
        }

        return res
    }
}

const singleBlocksoftTransaction = new BlocksoftTransfer()
export default singleBlocksoftTransaction
