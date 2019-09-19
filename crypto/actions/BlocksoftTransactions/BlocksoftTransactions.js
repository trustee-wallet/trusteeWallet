/**
 * @author Ksu
 * @version 0.3
 */
const Dispatcher = require('../../blockchains/Dispatcher').init()

const FIELDS = {
    'transaction_hash' : 1,
    'transaction_status' : 1,
    'block_hash' : 1,
    'block_number' : 1,
    'block_time' : 1,
    'block_confirmations' : 1,
    'transaction_direction' : 1,
    'address_to' : 1,
    'address_from' : 1,
    'address_amount' : 1,
    'transaction_fee' : 1,
    'vout' : 1,
    'vin' : 1,
    'lock_time' : 1,
    'contract_address' : 1,
    'input_value' : 1,
    'transaction_json' : 1
}

class BlocksoftTransactions {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{currencyCode, address}}
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
     * @return {{transaction_status, block_confirmations, transaction_direction, address_to, block_hash, block_number, transaction_fee, address_from, vout, block_time, lock_time, vin, transaction_hash, address_amount, contract_address, input_value, transaction_json}}
     */
    async getTransactions() {
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        try {
            let resultData = await this._processor[currencyCode].getTransactions(this._data.address)
            if (resultData && resultData[0]) {
                for (let key of Object.keys(resultData[0])) {
                    if (!FIELDS[key]) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('undefined tx key ' + key)
                    }
                }
            }
            return resultData
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
    }
}

let singleBlocksoftTransactions = new BlocksoftTransactions()

export default singleBlocksoftTransactions
