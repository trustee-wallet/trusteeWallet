/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthBasic from './basic/EthBasic'

const CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL = {}
const CACHE_GET_MAX_BLOCK = {max_block_number: 0, confirmations : 0}
const CACHE_BLOCK_NUMBER_TO_HASH = {}
export default class EthScannerProcessor extends EthBasic {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {boolean}
     * @private
     */
    _useInternal = true

    /**
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalance(address) {
        // noinspection JSUnresolvedVariable
        let balance = await this._web3.eth.getBalance(address)
        BlocksoftCryptoLog.log('EthScannerProcessor.getBalance finished', address + ' => ' + balance)
        return {balance, unconfirmed : 0, provider : 'etherscan'}
    }

    /**
     * https://etherscan.io/apis#accounts
     * https://api.etherscan.io/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken&address=0x8b661361Be29E688Dda65b323526aD536c8B3997
     * https://api.etherscan.io/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken&address=0x8b661361Be29E688Dda65b323526aD536c8B3997
     * @param {string} address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactions(address) {
        BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions started', address)

        let link = this._etherscanApiPath
        let logTitle = 'EthScannerProcessor.getTransactions'
        let isInternal = false
        if (this._useInternal) {
            if (typeof CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] === 'undefined' || CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] == 2) {
                CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] = 1
            } else {
                CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] = 2
                link = this._etherscanApiPathInternal
                logTitle = 'EthScannerProcessor.getTransactions forInternal'
                isInternal = true
            }
        }
        link += '&address='+ address
        BlocksoftCryptoLog.log(logTitle + ' started', link)
        let tmp = await BlocksoftAxios.getWithoutBraking(link)
        if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.result === 'undefined') {
            return []
        }
        if (typeof tmp.data.result === 'string') {
            throw new Error('Undefined txs ' + link + ' ' + tmp.data.result)
        }

        let transactions = await this._unifyTransactions(address, tmp.data.result, isInternal)

        BlocksoftCryptoLog.log(logTitle + ' finished', address)
        return transactions
    }


    /**
     * @param {string} address
     * @param {*} result[]
     * @param {boolean} isInternal
     * @returns {Promise<[{UnifiedTransaction}]>}
     * @private
     */
    async _unifyTransactions(address, result, isInternal) {
        let transactions = []
        for (let tx of result) {
            let transaction = await this._unifyTransaction(address, tx, isInternal)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }


    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.blockNumber 4673230
     * @param {string} transaction.timeStamp 1512376529
     * @param {string} transaction.hash
     * @param {string} transaction.nonce
     * @param {string} transaction.blockHash
     * @param {string} transaction.transactionIndex
     * @param {string} transaction.from
     * @param {string} transaction.to
     * @param {string} transaction.value
     * @param {string} transaction.gas
     * @param {string} transaction.gasPrice
     * @param {string} transaction.isError
     * @param {string} transaction.txreceipt_status
     * @param {string} transaction.input
     * @param {string} transaction.type
     * @param {string} transaction.contractAddress
     * @param {string} transaction.cumulativeGasUsed
     * @param {string} transaction.gasUsed
     * @param {string} transaction.confirmations
     * @param {boolean} isInternal
     * @return {UnifiedTransaction}
     * @protected
     */
    async _unifyTransaction(address, transaction, isInternal = false) {
        if (typeof transaction.timeStamp === "undefined") {
            new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timeStamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timeStamp)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (isInternal) {
            if (transaction.contractAddress !== '') {
                return false
            }
            if (transaction.type !== 'call') {
                return false
            }

            if (typeof CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] === 'undefined') {
                let data = await this._web3.eth.getTransaction(transaction.hash)
                CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = data.blockHash
            }
            transaction.blockHash = CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber]
            transaction.confirmations = CACHE_GET_MAX_BLOCK.max_block_number - transaction.blockNumber + 1*CACHE_GET_MAX_BLOCK.confirmations
        } else {
            CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = transaction.blockHash
        }

        let confirmations = transaction.confirmations;
        if (confirmations > 0 && transaction.blockNumber > CACHE_GET_MAX_BLOCK.max_block_number) {
            CACHE_GET_MAX_BLOCK.max_block_number = transaction.blockNumber
            CACHE_GET_MAX_BLOCK.confirmations = confirmations
        }
        let transaction_status = 'new'
        if (typeof transaction.txreceipt_status === 'undefined' || transaction.txreceipt_status === '1') {
            if (confirmations > this._blocksToConfirm) {
                transaction_status = 'success'
            }
        } else if (transaction.isError !== '0') {
            transaction_status = 'fail'
        }
        if (isInternal) {
            transaction_status = 'internal_' + transaction_status
        }

        let tx = {
            transaction_hash: transaction.hash,
            block_hash: transaction.blockHash,
            block_number: +transaction.blockNumber,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: (address.toLowerCase() === transaction.from.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.from,
            address_to: transaction.to,
            address_amount: transaction.value,
            transaction_status,
            contract_address: transaction.contractAddress,
            input_value: transaction.input,
        }
        if (!isInternal) {
            let additional = {
                nonce: transaction.nonce,
                cumulativeGasUsed: transaction.cumulativeGasUsed,
                gasUsed: transaction.gasUsed,
                transactionIndex: transaction.transactionIndex
            }
            tx.transaction_json = JSON.stringify(additional)
            tx.transaction_fee = transaction.cumulativeGasUsed
        }
        return tx
    }
}
