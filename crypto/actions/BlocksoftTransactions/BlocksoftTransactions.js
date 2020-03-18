/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

const Dispatcher = new BlocksoftDispatcher()

class BlocksoftTransactions {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{currencyCode, address, jsonData}}
     * @private
     */
    _data = {}

    /**
     * @param {string} currencyCode
     * @return {BlocksoftTransactions}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getScannerProcessor(currencyCode)
        }
        return this
    }

    /**
     * @param {string} address
     * @return {BlocksoftTransactions}
     */
    setAddress(address) {
        this._data.address = address
        return this
    }

    /**
     * @param {*} jsonData
     * @return {BlocksoftTransactions}
     */
    setAdditional(jsonData) {
        this._data.jsonData = jsonData
        return this
    }


    /**
     * @return {{transaction_status, block_confirmations, transaction_direction, address_to, block_hash, block_number, transaction_fee, address_from, vout, block_time, lock_time, vin, transaction_hash, address_amount, contract_address, input_value, transaction_json}}
     */
    async getTransactions() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let resultData = []
        try {
            resultData = await this._processor[currencyCode].getTransactions(this._data.address, this._data.jsonData)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            e.message += ' on actual getTransactions step '
            throw e
        }

        return resultData
    }
}

const singleBlocksoftTransactions = new BlocksoftTransactions()

export default singleBlocksoftTransactions
