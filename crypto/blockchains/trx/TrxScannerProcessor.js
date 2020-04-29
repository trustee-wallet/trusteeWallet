/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import TronUtils from './ext/TronUtils'
import TrxTronscanProvider from './basic/TrxTronscanProvider'
import TrxTrongridProvider from './basic/TrxTrongridProvider'
import TrxTransactionsProvider from './basic/TrxTransactionsProvider'
import TrxTransactionsTrc20Provider from './basic/TrxTransactionsTrc20Provider'

export default class TrxScannerProcessor {

    constructor(settings) {
        this._tokenName = '_'
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
        }
        this._tronscanProvider = new TrxTronscanProvider()
        this._trongridProvider = new TrxTrongridProvider()
        this._transactionsProvider = new TrxTransactionsProvider()
        this._transactionsTrc20Provider = new TrxTransactionsTrc20Provider()
    }

    /**
     * https://developers.tron.network/reference#addresses-accounts
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        let addressHex = address
        if (address[0] === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        } else {
            address = await TronUtils.addressHexToStr(addressHex)
        }
        let result = await this._tronscanProvider.get(address, this._tokenName)
        if (result === false) {
            result = await this._trongridProvider.get(addressHex, this._tokenName)
        }
        return result
    }


    /**
     * @param {string} address
     * @return {Promise<[UnifiedTransaction]>}
     * https://github.com/jakeonchain/tron-wallet-chrome/blob/fecea42771cc5cbda3fada4a1c8cfe8de251c008/src/App.js
     */
    async getTransactionsBlockchain(address) {
        address = address.trim()
        let result
        if (this._tokenName[0] === 'T') {
            this._transactionsTrc20Provider.setLink(this._tokenName)
            result = await this._transactionsTrc20Provider.get(address, this._tokenName)
        } else {
            result = await this._transactionsProvider.get(address, this._tokenName)
        }
        return result
    }
}
