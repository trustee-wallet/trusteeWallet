/**
 * @version 0.52
 * https://github.com/Blockstream/esplora/blob/master/API.md
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import DogeFindAddressFunction from '@crypto/blockchains/doge/basic/DogeFindAddressFunction'

const API_PATH = 'https://blockstream.info/testnet/api/'

export default class BtcTestScannerProcessor {


    /*
     * https://blockstream.info/testnet/api/address/mtU4mYXfBRiTx1iUBWcCvUTr4CgRnRALaL
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalanceBlockchain(address) {
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getBalance started ' + address)
        const res = await BlocksoftAxios.getWithoutBraking(API_PATH + 'address/' + address)
        // console.log('res', res.data.chain_stats.funded_txo_sum) // spent_txo_sum
        if (!res || typeof res.data === 'undefined' || typeof res.data.chain_stats === 'undefined' || typeof res.data.chain_stats.funded_txo_sum === 'undefined') {
            return false
        }
        return { balance: res.data.chain_stats.funded_txo_sum, unconfirmed: 0, provider: 'blockstream.info' }
    }

    /**
     * https://blockstream.info/testnet/api/address/mtU4mYXfBRiTx1iUBWcCvUTr4CgRnRALaL/txs
     * @param {string} scanData.account.address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address.trim()
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions started ' + address)
        const res = await BlocksoftAxios.getWithoutBraking(API_PATH + 'address/' + address + '/txs')
        if (!res || typeof res.data === 'undefined' || !res.data) {
            return []
        }
        const transactions = []
        let tx
        for (tx of res.data) {
            const transaction = await this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions finished ' + address + ' total: ' + transactions.length)
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {Object} transaction
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    async _unifyTransaction(address, transaction) {

        let showAddresses = false
        try {
            showAddresses = await DogeFindAddressFunction([address], transaction)
        } catch (e) {
            e.message += ' transaction hash ' + JSON.stringify(transaction) + ' address ' + address
            throw e
        }
        let transactionStatus = 'new'
        let blockConfirmations = 0
        let blockHash = ''
        let blockNumber = ''
        let formattedTime = 0
        if (typeof transaction.status !== 'undefined') {
            if (typeof transaction.status.block_hash !== 'undefined') {
                blockHash = transaction.status.block_hash
            }
            if (typeof transaction.status.block_height !== 'undefined') {
                blockNumber = transaction.status.block_height
            }
            if (typeof transaction.status.confirmed !== 'undefined') {
                if (transaction.status.confirmed) {
                    transactionStatus = 'success'
                    blockConfirmations = 100
                } else {
                    transactionStatus = 'confirming'
                }
            }
            if (typeof transaction.status.block_time !== 'undefined') {
                try {
                    formattedTime = BlocksoftUtils.toDate(transaction.status.block_time)
                } catch (e) {
                    e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
                    throw e
                }
            }
        }



        return {
            transactionHash: transaction.txid,
            blockHash,
            blockNumber,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection: showAddresses.direction,
            addressFrom: showAddresses.from,
            addressTo: showAddresses.to,
            addressAmount: showAddresses.value,
            transactionStatus: transactionStatus,
            transactionFee: transaction.fee
        }
    }
}
