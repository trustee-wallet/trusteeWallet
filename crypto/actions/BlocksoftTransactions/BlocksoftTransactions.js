/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

class BlocksoftTransactions {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{currencyCode, address, jsonData, walletHash}}
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
            this._processor[currencyCode] = BlocksoftDispatcher.getScannerProcessor(currencyCode)
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
     * @param {string} walletHash
     * @return {BlocksoftTransactions}
     */
    setWalletHash(walletHash) {
        this._data.walletHash = walletHash
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
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let resultData = []
        try {
            resultData = await this._processor[currencyCode].getTransactionsBlockchain(this._data.address, this._data.jsonData, this._data.walletHash)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            e.message += ' on actual getTransactions step '
            throw e
        }

        return resultData
    }

    /**
     * @return {Promise<string[]>}
     */
    async getAddresses() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let resultData = []
        try {
            resultData = await this._processor[currencyCode].getAddressesBlockchain(this._data.address, this._data.jsonData, this._data.walletHash)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            e.message += ' on actual getAddressesBlockchain step '
            throw e
        }

        return resultData
    }
}

const singleBlocksoftTransactions = new BlocksoftTransactions()

export default singleBlocksoftTransactions
