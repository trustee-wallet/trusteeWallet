import BlocksoftKeysStorage from '../BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../BlocksoftKeys/BlocksoftKeys'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const Dispatcher = require('../../blockchains/Dispatcher').init()

class BlocksoftTransaction {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{privateKey, addressFrom, addressTo, amount, feeForTx, currencyCode, addressForChange, replacingTransaction, nSequence}}
     * @private
     */
    _data = {}

    /**
     * @type {{privateKey, addressFrom, addressTo, amount, feeForTx, currencyCode, addressForChange, replacingTransaction, nSequence}}
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
     * @return {BlocksoftTransaction}
     */
    setWalletHash(hash) {
        this._private.walletHash = hash
        this._data.privateKey = false
        return this
    }
    /**
     * @param {string} derivePath
     * @return {BlocksoftTransaction}
     */
    setDerivePath(derivePath) {
        this._private.derivePath = derivePath
        return this
    }

    async _initPrivate() {
        if (!this._private.walletHash) {
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
        let discoverForKey = discoverFor.mnemonic + '_' + discoverFor.path + '_' + discoverFor.currencyCode

        let result = this._privateCache[discoverForKey]
        if (!result) {
            result = await BlocksoftKeys.discoverOne(discoverFor)
            if (result.address !== this._data.addressFrom) {
                throw new Error('private key is not for address you set ' + result.address + '!=' + this._data.addressFrom)
            }
            this._privateCache[discoverForKey] = result
        }

        this._data.privateKey = result.privateKey
        this._logData.privateKey = '***'
        return true
    }


    /**
     * @param privateKey
     * @return {BlocksoftTransaction}
     */
    setPrivateKey(privateKey) {
        this._private.walletHash = false
        this._data.privateKey = privateKey
        this._logData.privateKey = '***'
        return this
    }

    /**
     * @param address
     * @return {BlocksoftTransaction}
     */
    setAddressFrom(address) {
        this._data.addressFrom = address
        this._logData.addressFrom = address
        return this
    }

    /**
     * @param address
     * @return {BlocksoftTransaction}
     */
    setAddressTo(address) {
        this._data.addressTo = address
        this._logData.addressTo = address
        return this
    }


    /**
     * @param {boolean} onOrOff
     * @return {BlocksoftTransaction}
     */
    setTransferAll(onOrOff) {
        this._data.addressForChange = onOrOff ? 'TRANSFER_ALL' : false
        this._logData.addressForChange = onOrOff ? 'TRANSFER_ALL' : false
        return this
    }

    /**
     * @param {string|number} amount
     * @return {BlocksoftTransaction}
     */
    setAmount(amount) {
        this._data.amount = amount
        this._logData.amount = amount
        return this
    }

    /**
     * @param currencyCode
     * @return {BlocksoftTransaction}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        this._logData.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthTxProcessor|BtcTxProcessor|UsdtTxProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getTxProcessor(currencyCode)
        }
        return this
    }

    /**
     * @param {string|Object} feeForTx
     * @return {BlocksoftTransaction}
     */
    setFee(feeForTx) {
        this._data.feeForTx = feeForTx
        this._logData.feeForTx = feeForTx
        return this
    }

    /**
     * @param {string|null|boolean} hash
     * @return {BlocksoftTransaction}
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
     * @return {BlocksoftTransaction}
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

    async getNetworkPrices() {
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransaction.getNetworkPrices ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].getNetworkPrices(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransaction.getNetworkPrices ${currencyCode} finished`, res)
        } catch (e) {
            e.message = `BlocksoftTransaction.getNetworkPrices ${currencyCode} error ` + e.message
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftTransaction.getNetworkPrices ${currencyCode}`, e)
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
            BlocksoftCryptoLog.log(`BlocksoftTransaction.getFeeRate ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].getFeeRate(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransaction.getFeeRate ${currencyCode} finished`, res)
        } catch (e) {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftTransaction.getFeeRate ${currencyCode}`, e)
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
     * @return {Promise<{hash}>}
     */
    async sendTx() {
        await this._initPrivate()
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftTransaction.sendTx ${currencyCode} started`, this._logData)
            res = await this._processor[currencyCode].sendTx(this._data)
            BlocksoftCryptoLog.log(`BlocksoftTransaction.sendTx ${currencyCode} finished`, res)
        } catch (e) {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftTransaction.sendTx ${currencyCode} error ` + e.message, e.data ? e.data : e)
            e.message = 'server.not.responding.while.send.tx.' + currencyCode + ' ' + e.message
            throw e
        }

        this.setSequence(this._data.nSequence)

        return res
    }
}

let singleBlocksoftTransaction = new BlocksoftTransaction()

export default singleBlocksoftTransaction
