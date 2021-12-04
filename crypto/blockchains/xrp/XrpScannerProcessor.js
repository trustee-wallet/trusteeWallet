/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import XrpTmpDS from './stores/XrpTmpDS'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import XrpDataRippleProvider from '@crypto/blockchains/xrp/basic/XrpDataRippleProvider'
import XrpDataScanProvider from '@crypto/blockchains/xrp/basic/XrpDataScanProvider'


let CACHE_BLOCK_DATA = {}

export default class XrpScannerProcessor {

    _inited = false

    async init() {
        if (this._inited) {
            return false
        }
        CACHE_BLOCK_DATA = await XrpTmpDS.getCache()
        const serverType = BlocksoftExternalSettings.getStatic('XRP_SCANNER_TYPE')
        if (serverType === 'dataripple') {
            this.provider = new XrpDataRippleProvider()
        } else {
            this.provider = new XrpDataScanProvider()
        }
        this.provider.setCache(CACHE_BLOCK_DATA)
        this._inited = true
    }

    /**
     * https://data.ripple.com/v2/accounts/rL2SpzwrCZ4N2BaPm88pNGGHkPLzejZgB8/balances
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        await this.init()

        let res = false
        let balance = 0
        let provider = 'none'
        try {
            res = await this.provider.getBalanceBlockchain(address)
            if (res && typeof res.balance !== 'undefined') {
                balance = res.balance
                provider = res.provider
            }
        } catch (e) {
            if (e.message.indexOf('timed out') === -1 && e.message.indexOf('account not found') === -1) {
                throw e
            } else {
                return false
            }
        }
        return { balance, unconfirmed: 0, provider }
    }


    /**
     * @param {string} scanData.account.address
     * @param {*} scanData.additional
     * @param {string} scanData.account.walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        await this.init()
        const address = scanData.account.address.trim()
        await BlocksoftCryptoLog.log('XrpScannerProcessor.getTransactions started ' + address)

        let transactions = []
        try {
            transactions = await this.provider.getTransactionsBlockchain(scanData)
        } catch (e) {
            if (e.message.indexOf('account not found') === -1
                && e.message.indexOf('to retrieve payments') === -1
                && e.message.indexOf('limit exceeded') === -1
                && e.message.indexOf('timed out') === -1
            ) {
                throw e
            } else {
                return false
            }
        }

        await BlocksoftCryptoLog.log('XrpScannerProcessor.getTransactions finished ' + address)
        return transactions
    }
}
