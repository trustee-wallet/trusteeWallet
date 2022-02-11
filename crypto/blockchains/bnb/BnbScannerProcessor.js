/**
 * @version 0.20
 * https://docs.binance.org/api-reference/dex-api/paths.html#apiv1transactions
 */
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import config from '../../../app/config/config'
import BlocksoftExternalSettings from '../../common/BlocksoftExternalSettings'

export default class BnbScannerProcessor {


    /**
     * https://dex.binance.org/api/v1/account/bnb146lec0enyzz2x5kpna8kwelky8kumfhj05aspz
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        const apiServer = await BlocksoftExternalSettings.getStatic('BNB_SERVER')
        const link = `${apiServer}/api/v1/account/${address}`
        let balance = 0
        let frozen = 0
        const res = await BlocksoftAxios.getWithoutBraking(link)
        // "balances":[{"free":"0.00100000","frozen":"0.00000000","locked":"0.00000000","symbol":"BNB"}]
        if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.balances !== 'undefined') {
            let row
            for (row of res.data.balances) {
                if (row.symbol === 'BNB') {
                    balance = row.free
                    frozen = row.frozen
                    break
                }
            }
        } else {
            await BlocksoftCryptoLog.log('BnbScannerProcessor.getBalanceBlockchain ' + address + ' no actual balance ' + link, res)
            return false
        }


        return { balance, unconfirmed: 0, frozen, provider: 'dex.binance' }
    }


    /**
     * https://dex.binance.org/api/v1/transactions/?address=bnb146lec0enyzz2x5kpna8kwelky8kumfhj05aspz
     * https://dex.binance.org/api/v1/transactions/?address=bnb146lec0enyzz2x5kpna8kwelky8kumfhj05aspz&startTime=1609452000000&limit=100
     * https://docs.binance.org/api-reference/dex-api/paths.html#apiv1transactions
     * https://github.com/trustwallet/blockatlas/blob/b4f6dc360bed412ff555aa981d83e4421380f104/platform/binance/client.go#L43
     * @param {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address.trim()
        BlocksoftCryptoLog.log('BnbScannerProcessor.getTransactions started', address)

        const apiServer = await BlocksoftExternalSettings.getStatic('BNB_SERVER')
        
        let linkTxs = `${apiServer}/api/v1/transactions/?address=${address}&txAsset=BNB` // 2021-01-01
        if (scanData.account.balanceScanTime && scanData.account.balanceScanTime * 1 > 0) {
            linkTxs += '&startTime=' + (scanData.account.balanceScanTime - 86400) * 1000 // 1 day
        }

        const res = await BlocksoftAxios.getWithoutBraking(linkTxs)
        if (!res || typeof res.data === 'undefined' || !res.data) {
            return false
        }

        const transactions = await this._unifyTransactions(address, res.data.tx)
        BlocksoftCryptoLog.log('BnbScannerProcessor.getTransactions finished', address)
        return transactions
    }

    async _unifyTransactions(address, result) {
        const transactions = []
        let tx
        for (tx of result) {
            const transaction = await this._unifyTransaction(address, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.blockHeight 144626977
     * @param {string} transaction.code 0
     * @param {string} transaction.confirmBlocks
     * @param {string} transaction.data
     * @param {string} transaction.fromAddr bnb1jxfh2g85q3v0tdq56fnevx6xcxtcnhtsmcu64m
     * @param {string} transaction.memo
     * @param {string} transaction.orderId
     * @param {string} transaction.proposalId
     * @param {string} transaction.sequence 1950767
     * @param {string} transaction.source 0
     * @param {string} transaction.timeStamp 2021-02-15T21:40:00.232Z
     * @param {string} transaction.toAddr bnb146lec0enyzz2x5kpna8kwelky8kumfhj05aspz
     * @param {string} transaction.txAge 428893
     * @param {string} transaction.txAsset "BNB"
     * @param {string} transaction.txFee "0.00037500"
     * @param {string} transaction.txHash "D160D16A01998B023EC3ABBCD1D1064F23AC1D17715ECAE1E895DC0AA9D12B5A"
     * @param {string} transaction.txType: "TRANSFER"
     * @param {string} transaction.value: "0.00100000"
     * @return {UnifiedTransaction}
     * @private
     **/
    async _unifyTransaction(address, transaction) {
        try {
            let tx
            if (transaction.txType === 'TRANSFER') {
                tx = {
                    transactionHash: transaction.txHash,
                    blockHash: transaction.blockHeight,
                    blockNumber: transaction.blockHeight,
                    blockTime: transaction.timeStamp,
                    blockConfirmations: transaction.txAge,
                    transactionDirection: '?',
                    addressFrom: transaction.fromAddr === address ? '' : transaction.fromAddr,
                    addressTo: transaction.toAddr === address ? '' : transaction.toAddr,
                    addressAmount: transaction.value,
                    transactionStatus: transaction.code === 0 ? 'success' : (transaction.txAge === 0 ? 'new' : 'fail'),
                    transactionFee: transaction.txFee
                }
            } else if (transaction.txType === 'CROSS_TRANSFER_OUT' && typeof transaction.data !== 'undefined') {
                const tmp = JSON.parse(transaction.data)
                if (typeof tmp.amount.denom === 'undefined' || tmp.amount.denom !== 'BNB') return  false
                tx = {
                    transactionHash: transaction.txHash,
                    blockHash: transaction.blockHeight,
                    blockNumber: transaction.blockHeight,
                    blockTime: transaction.timeStamp,
                    blockConfirmations: transaction.txAge,
                    transactionDirection: '?',
                    addressFrom: tmp.from === address ? '' : tmp.from,
                    addressTo: tmp.to === address ? '' : tmp.to,
                    addressAmount: BlocksoftUtils.toUnified(tmp.amount.amount, 8),
                    transactionStatus: transaction.code === 0 ? 'success' : (transaction.txAge === 0 ? 'new' : 'fail'),
                    transactionFee: transaction.txFee
                }
            } else {
                return false
            }

            if (tx.addressTo === '' || !tx.addressTo) {
                if (tx.addressFrom === '') {
                    tx.transactionDirection = 'self'
                } else {
                    tx.transactionDirection = 'income'
                }
            } else {
                tx.transactionDirection = 'outcome'
            }

            if (typeof transaction.memo !== 'undefined' && transaction.memo !== '') {
                tx.transactionJson = { memo: transaction.memo }
            }

            return tx
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BnbScannerProcessor _unifyTransaction error ' + e.message)
            }
            throw e
        }
    }
}
