/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftKeysStorage from '../BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../BlocksoftKeys/BlocksoftKeys'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftTransferDispatcher from '../../blockchains/BlocksoftTransferDispatcher'

const Dispatcher = new BlocksoftTransferDispatcher()

class BlocksoftTransfer {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{privateKey, addressFrom, addressTo, amount, feeForTx, currencyCode, addressForChange, replacingTransaction, nSequence, jsonData, memo}}
     * @private
     */
    _data = {}

    /**
     * @type {{privateKey, addressFrom, addressTo, amount, feeForTx, currencyCode, addressForChange, replacingTransaction, nSequence, memo}}
     * @private
     */
    _logData = {}

    /**
     * @type {{walletHash, derivePath}}
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
        this._private.walletHash = hash
        this._data.privateKey = false
        return this
    }

    /**
     * @param {string} key
     * @return {BlocksoftTransfer}
     */
    setPrivateKey(key) {
        this._private.walletHash = ''
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
        if (!this._private.walletHash || !this._data.addressFrom) {
            return false
        }

        let mnemonic = this._privateCache[this._private.walletHash]
        if (!mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(this._private.walletHash)
            this._privateCache[this._private.walletHash] = mnemonic
        }
        if (!mnemonic) {
            throw new Error('no mnemonic for hash ' + this._private.walletHash)
        }

        let discoverFor = {mnemonic, path : this._private.derivePath, currencyCode : this._data.currencyCode}
        let discoverForKey = BlocksoftKeysStorage.getAddressCacheKey(this._private.walletHash, discoverFor.path.replace(/[']/g, "quote"), discoverFor.currencyCode)

        let result = this._privateCache[discoverForKey]
        if (!result) {
            result = await BlocksoftKeysStorage.getAddressCache(discoverForKey)
            if (!result) {
                try {
                    result = await BlocksoftKeys.discoverOne(discoverFor)
                    BlocksoftKeysStorage.setAddressCache(discoverForKey, result)
                } catch (e) {
                    throw new Error('private key not discovered this._data=' + JSON.stringify(this._logData))
                }
            }
            this._privateCache[discoverForKey] = result
        }
        if (result.address !== this._data.addressFrom) {
            throw new Error('private key is not for address you set ' + result.address + '!=' + this._data.addressFrom + ' this._data=' + JSON.stringify(this._logData))
        }
        this._data.privateKey = result.privateKey
        this._logData.privateKey = '***'
        return true
    }

    /**
     * @param address
     * @return {BlocksoftTransfer}
     */
    setAddressFrom(address) {
        this._data.addressFrom = address.trim()
        this._logData.addressFrom = address.trim()
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
        this._logData.amount = memo
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
        if (this._data.addressForChange === 'TRANSFER_ALL') {
            this._data.addressForChange = false
            this._logData.addressForChange = false
        }
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
     * @return {BlocksoftTransfer}
     */
    setAdditional(jsonData) {
        this._data.jsonData = jsonData
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

    /**
     * @param {string|null|boolean} hash
     * @return {BlocksoftTransfer}
     */
    setReplacingTransaction(hash) {
        if(!hash || typeof hash === 'undefined') {
            this._data.replacingTransaction = false
        } else {
            this._data.replacingTransaction = hash
        }
        this._logData.replacingTransaction = hash

        return this
    }

    /**
     * @param {string|number|null} prevSequence
     * @return {BlocksoftTransfer}
     */
    setSequence(prevSequence) {
        if (typeof prevSequence === 'undefined') {
            // noinspection JSValidateTypes
            prevSequence = null
        }

        switch (prevSequence) {
            case null:
                this._data.nSequence = 0xffffffff
                this._logData.nSequence = 0xffffffff
                break
            case 0xfffffffe:
            case 0xffffffff:
                break
            default:
                this._data.nSequence = prevSequence + 1
                this._logData.nSequence = prevSequence + 1
        }

        return this
    }

    getAddressToForTransferAll(addressTo) {
        if (this._data.currencyCode === 'BTC_TEST') {
            return 'mjojEgUSi68PqNHoAyjhVkwdqQyLv9dTfV'
        }
        if (this._data.currencyCode === 'XRP') {
            let tmp1 = 'rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P'
            let tmp2 = 'rnyWPfJ7dk2X15N7jqwmqo3Nspu1oYiRZ3'
            return addressTo === tmp1 ? tmp2 : tmp1
        }
        return addressTo
    }

    async getTransferAllBalance(balanceRaw) {
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let balanceUpdated
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferAllBalance ${currencyCode} started ${this._data.addressFrom} `)
            balanceUpdated = await this._processor[currencyCode].getTransferAllBalance(this._data, balanceRaw)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferAllBalance ${currencyCode} got ${this._data.addressFrom} data`, balanceUpdated)
        } catch (e) {
            e.message = `BlocksoftTransfer.getTransferAllBalance ${currencyCode} error ` + e.message
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftTransfer.getTransferAllBalance ${currencyCode} ${this._data.addressFrom} `, e)
            let newError = new Error('server.not.responding.all.balance')
            newError.log = e.message
            throw newError
        }

        return balanceUpdated
    }

    async getTransferPrecache() {
        let newTransferPrecache = this._data.currencyCode + '_' + this._data.addressFrom
        if (this._onceTransferPrecache === newTransferPrecache) return false
        this._onceTransferPrecache = newTransferPrecache
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferPrecache ${currencyCode} started`, JSON.stringify(this._logData))
            res = await this._processor[currencyCode].getTransferPrecache(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getTransferPrecache ${currencyCode} finished`, JSON.stringify(res))
        } catch (e) {
            e.message = `BlocksoftTransfer.getTransferPrecache ${currencyCode} error ` + e.message
            // noinspection ES6MissingAwait
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                BlocksoftCryptoLog.err(`BlocksoftTransfer.getTransferPrecache ${currencyCode} ` + e.message)
            }
            if (e.code && e.code === 'ERROR_USER') {
                throw e
            } else {
                let newError = new Error('server.not.responding.network.prices.' + currencyCode)
                newError.log = e.message
                throw newError
            }
        }
        return res
    }

    /**
     * @return {Promise<{feeForTx, langMsg, txSize, feeForByte, gasPrice, gasLimit}[]>}
     */
    async getFeeRate() {
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getFeeRate ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].getFeeRate(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.getFeeRate ${currencyCode} finished`, res)
        } catch (e) {
            // noinspection ES6MissingAwait
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                BlocksoftCryptoLog.err(`BlocksoftTransfer.getFeeRate ${currencyCode}` + ' ' + e.message)
            }
            if (e.code && e.code === 'ERROR_USER') {
                throw e
            } else {
                let newError = new Error('server.not.responding.fee.rates.' + currencyCode + ' ' + e.message)
                newError.log = e.message
                throw newError
            }
        }
        return res
    }


    /**
     * @return {Promise<{hash, correctedAmountFrom}>}
     */
    async sendTx() {
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransfer.sendTx ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].sendTx(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransfer.sendTx ${currencyCode} finished`, res)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                BlocksoftCryptoLog.err(`BlocksoftTransfer.sendTx ${currencyCode} error ` + e.message, e.data ? e.data : e)
            }
            throw e
        }

        this.setSequence(this._data.nSequence)

        return res
    }
}

let singleBlocksoftTransaction = new BlocksoftTransfer()
export default singleBlocksoftTransaction
