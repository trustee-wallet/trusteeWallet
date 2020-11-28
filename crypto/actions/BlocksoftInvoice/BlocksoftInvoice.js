/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

class BlocksoftInvoice {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{privateKey, address, amount, feeForTx, currencyCode, addressForChange, nSequence, jsonData, memo}}
     * @private
     */
    _data = {}

    /**
     * @param address
     * @return {BlocksoftInvoice}
     */
    setAddress(address) {
        this._data.address = address
        return this
    }

    /**
     * @param jsonData
     * @return {BlocksoftInvoice}
     */
    setAdditional(jsonData) {
        this._data.jsonData = jsonData
        return this
    }

    /**
     * @param amount
     * @return {BlocksoftInvoice}
     */
    setAmount(amount) {
        this._data.amount = amount
        return this
    }

    /**
     * @param memo
     * @return {BlocksoftInvoice}
     */
    setMemo(memo) {
        this._data.memo = memo
        return this
    }

    /**
     * @param currencyCode
     * @return {BlocksoftInvoice}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {

        }
        return this
    }


    /**
     * @return {Promise<{hash}>}
     */
    async createInvoice() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftInvoice.createInvoice ${currencyCode} started`, this._data)
            res = await this._processor[currencyCode].createInvoice(this._data)
            BlocksoftCryptoLog.log(`BlocksoftInvoice.createInvoice ${currencyCode} finished`, res)
        } catch (e) {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftInvoice.createInvoice ${currencyCode} error ` + e.message, e.data ? e.data : e)
            throw e
        }

        return res
    }

    async checkInvoice(hash) {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftInvoice.checkInvoice ${currencyCode} started`, this._data)
            res = await this._processor[currencyCode].checkInvoice(hash, this._data)
            BlocksoftCryptoLog.log(`BlocksoftInvoice.checkInvoice ${currencyCode} finished`, res)
        } catch (e) {
            if (e.message.indexOf('not a valid invoice') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftInvoice.checkInvoice ${currencyCode} error ` + e.message, e.data ? e.data : e)
            }
            throw e
        }

        return res
    }
}

const singleBlocksoftInvoice = new BlocksoftInvoice()

export default singleBlocksoftInvoice
