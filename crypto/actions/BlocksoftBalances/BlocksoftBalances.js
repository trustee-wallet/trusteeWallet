/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const Dispatcher = new BlocksoftDispatcher()

class BlocksoftBalances {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}

    /**
     * @type {{}}
     * @private
     */
    _allSettings = {}

    /**
     * @type {{currencyCode, address, fee, jsonData}}
     * @private
     */
    _data = {}

    /**
     * @type {{}}
     * @private
     */
    _currencySettings = {}

    /**
     * @param {string} currencyCode
     * @return {BlocksoftBalances}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getScannerProcessor(currencyCode)
            this._allSettings[currencyCode] = Dispatcher._getSettings(currencyCode)
        }
        this._currencySettings = this._allSettings[currencyCode]
        return this
    }

    /**
     * @param {string} address
     * @return {BlocksoftBalances}
     */
    setAddress(address) {
        this._data.address = address.trim()
        return this
    }

    /**
     * @param {*} jsonData
     * @return {BlocksoftBalances}
     */
    setAdditional(jsonData) {
        this._data.jsonData = jsonData
        return this
    }

    /**
     * @return {Promise<{balance:*, provider:*, unconfirmed:*}>}
     */
    async getBalance() {
        BlocksoftCryptoLog.log('BlocksoftBalances.getBalance ' + this._data.currencyCode + ' ' + this._data.address + ' started')
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (currencyCode === 'BTC' && this._data.address.toString().substr(0, 1) === 'm') {
            throw new Error('plz check btc address as its testnet and mainnet is selected')
        }
        let res
        try {
            res = await this._processor[currencyCode].getBalance(this._data.address, this._data.jsonData)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
        BlocksoftCryptoLog.log('BlocksoftBalances.getBalance ' + this._data.currencyCode + ' ' + this._data.address + ' ended ' + JSON.stringify(res))
        return res
    }
}

const singleBlocksoftBalances = new BlocksoftBalances()
export default singleBlocksoftBalances
