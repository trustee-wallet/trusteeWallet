/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'


import EthScannerProcessor from '@crypto/blockchains/eth/EthScannerProcessor'

export default class MetisScannerProcessor extends EthScannerProcessor {

    /**
     * @param {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' MetisScannerProcessor.getTransactions started ' + address)
        const transactions = await super.getTransactionsBlockchain(scanData)

        // https://andromeda-explorer.metis.io/token/0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000/token-transfers
        // actual deposits and withdrawals done as erc20 token transfer
        const tmp = this._etherscanApiPath.split('/')
        const depositLink = `https://${tmp[2]}/api?module=account&action=tokentx&sort=desc&contractaddress=0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000&address=${address}`
        const depositLogTitle = this._settings.currencyCode + ' EthScannerProcessor.getTransactions etherscan deposits'
        const depositTransactions = await this._getFromEtherscan(address, depositLink, depositLogTitle, false, {})
        if (depositTransactions) {
            for (const transactionHash in depositTransactions) {
                transactions.push(depositTransactions[transactionHash])
            }
        }

        return transactions
    }
}
