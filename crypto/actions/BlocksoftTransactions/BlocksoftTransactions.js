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
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(data, source = '') {
        const currencyCode = data.account.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
             */
            this._processor[currencyCode] = BlocksoftDispatcher.getScannerProcessor(currencyCode)
        }
        let resultData = []
        try {
            resultData = await this._processor[currencyCode].getTransactionsBlockchain(data, source)
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
    async getAddresses(data, source = '') {
        const currencyCode = data.account.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
             */
            this._processor[currencyCode] = BlocksoftDispatcher.getScannerProcessor(currencyCode)
        }
        let resultData = []
        try {
            resultData = await this._processor[currencyCode].getAddressesBlockchain(data, source)
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
