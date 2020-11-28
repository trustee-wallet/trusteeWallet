/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import TrxNodeInfoProvider from './TrxNodeInfoProvider'

const TXS_MAX_TRY = 10

const CACHE_OF_TRANSACTIONS = {}
const CACHE_VALID_TIME = 30000 // 30 seconds

export default class TrxTransactionsProvider {

    /**
     * @type {number}
     * @private
     */
    _lastBlock = 15850641

    /**
     * @type {string}
     * @private
     */
    _tronscanLink = 'https://api.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=50&address='

    constructor() {
        this._nodeInfo = new TrxNodeInfoProvider()
    }

    /**
     * @param address
     * @param tokenName
     * @returns {Promise<boolean|UnifiedTransaction[]>}
     */
    async get(address, tokenName) {
        const now = new Date().getTime()
        if (typeof CACHE_OF_TRANSACTIONS[address] !== 'undefined' && (now - CACHE_OF_TRANSACTIONS[address].time) < CACHE_VALID_TIME) {
            if (typeof CACHE_OF_TRANSACTIONS[address][tokenName] !== 'undefined') {
                BlocksoftCryptoLog.log(' TrxTransactionsProvider.get from cache', address + ' => ' + tokenName)
                return CACHE_OF_TRANSACTIONS[address][tokenName]
            }
        }

        const res = await BlocksoftAxios.getWithoutBraking(this._tronscanLink + address, TXS_MAX_TRY)

        if (!res || !res.data || typeof res.data.data === 'undefined' || res.data.data.length === 0) return false

        this._lastBlock = await this._nodeInfo.getLastBlock()

        CACHE_OF_TRANSACTIONS[address] = {}
        CACHE_OF_TRANSACTIONS[address].time = new Date().getTime()
        CACHE_OF_TRANSACTIONS[address][tokenName] = []
        let tx
        for (tx of res.data.data) {
            const transaction = await this._unifyTransaction(address, tx)
            if (!transaction) continue

            let txTokenName = '_'
            if (typeof tx.contractData === 'undefined') {
                txTokenName = tokenName
            } else if (typeof tx.contractData.contract_address !== 'undefined') {
                txTokenName = tx.contractData.contract_address
            } else if (typeof tx.contractData.asset_name !== 'undefined') {
                txTokenName = tx.contractData.asset_name
            }
            if (typeof CACHE_OF_TRANSACTIONS[address][txTokenName] === 'undefined') {
                CACHE_OF_TRANSACTIONS[address][txTokenName] = []
            }
            CACHE_OF_TRANSACTIONS[address][txTokenName].push(transaction)
        }
        return CACHE_OF_TRANSACTIONS[address][tokenName]

    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.amount 1000000
     * @param {string} transaction.ownerAddress 'TJcnzHwXiFvMsmGDwBstDmwQ5AWVWFPxTM'
     * @param {string} transaction.data ''
     * @param {string} transaction.contractData.amount ''
     * @param {string} transaction.toAddress 'TGk5Nkv8gf7HShzLw7rHzJsQLzsALvPPnF'
     * @param {string} transaction.block 14129705
     * @param {string} transaction.confirmed true
     * @param {string} transaction.contractRet 'SUCCESS'
     * @param {string} transaction.hash '74d0f84322b1ba1478ce3f272d7b4524563e5a44b1270325cc6cce7e600601e2'
     * @param {string} transaction.timestamp 1572636390000
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let transactionStatus = 'new'
        const now = new Date().getTime()
        transaction.diffSeconds = Math.round((now - transaction.timestamp) / 1000)
        if (transaction.confirmed) {
            if (typeof transaction.contractRet === 'undefined') {
                transactionStatus = 'success'
            } else if (transaction.contractRet === 'SUCCESS') {
                transactionStatus = 'success'
            } else {
                transactionStatus = 'fail'
            }
        } else if (transaction.block > 0) {
            if (transaction.diffSeconds > 120) {
                transactionStatus = 'fail'
            } else {
                transactionStatus = 'confirming'
            }
        }
        if (transaction.block > this._lastBlock) {
            this._lastBlock = transaction.block
        }

        let blockConfirmations = this._lastBlock - transaction.block
        if (blockConfirmations > 100 && transaction.diffSeconds < 600) {
            blockConfirmations = transaction.diffSeconds
        }

        if (typeof transaction.timestamp === 'undefined') {
            throw new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timestamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        let addressAmount = 0
        let transactionDirection = 'self'
        if (typeof transaction.contractData.amount === 'undefined') {
            if (typeof transaction.contractData.frozen_balance !== 'undefined') {
                addressAmount = transaction.contractData.frozen_balance
                transactionDirection = 'freeze'
            } else if (typeof transaction.amount !== 'undefined' && typeof transaction.contractType !== 'undefined' && transaction.contractType === 13) {
                addressAmount = transaction.amount
                transactionDirection = 'claim'
            } else {
                if (typeof transaction.contractType !== 'undefined' && transaction.contractType === 31) {
                    // skip here
                } else {
                    if (transaction.contractType === 11 || transaction.contractType === 4 || transaction.contractType === 13) {
                        // freeze = 11, vote = 4, claim = 13
                    } else {
                        // noinspection ES6MissingAwait
                        BlocksoftCryptoLog.log('TrxTransactionsProvider._unifyTransaction buggy tx ' + JSON.stringify(transaction))
                    }
                }
                return false
            }
        } else {
            addressAmount =  transaction.contractData.amount
            transactionDirection =  (address.toLowerCase() === transaction.ownerAddress.toLowerCase()) ? 'outcome' : 'income'
        }
        const res = {
            transactionHash: transaction.hash,
            blockHash: '',
            blockNumber: transaction.block,
            blockTime: formattedTime,
            blockConfirmations: blockConfirmations,
            transactionDirection,
            addressFrom: (address.toLowerCase() === transaction.ownerAddress.toLowerCase()) ? '' : transaction.ownerAddress,
            addressTo: (address.toLowerCase() === transaction.toAddress.toLowerCase()) ? '' : transaction.toAddress,
            addressAmount,
            transactionStatus: transactionStatus,
            transactionFee: 0,
            inputValue: transaction.data
        }
        return res
    }
}
