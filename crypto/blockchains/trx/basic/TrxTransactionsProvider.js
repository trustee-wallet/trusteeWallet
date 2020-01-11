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
        let now = new Date().getTime()
        if (typeof CACHE_OF_TRANSACTIONS[address] !== 'undefined' && (now - CACHE_OF_TRANSACTIONS[address]['time']) < CACHE_VALID_TIME) {
            if (typeof CACHE_OF_TRANSACTIONS[address][tokenName] != 'undefined') {
                BlocksoftCryptoLog.log(' TrxTransactionsProvider.get from cache', address + ' => ' + tokenName)
                return CACHE_OF_TRANSACTIONS[address][tokenName]
            }
        }

        let res = await BlocksoftAxios.getWithoutBraking(this._tronscanLink + address, TXS_MAX_TRY)
        if (!res || !res.data || typeof res.data.data === 'undefined' || res.data.data.length === 0) return false

        this._lastBlock = await this._nodeInfo.getLastBlock()

        CACHE_OF_TRANSACTIONS[address] = {}
        CACHE_OF_TRANSACTIONS[address]['time'] = new Date().getTime()
        CACHE_OF_TRANSACTIONS[address][tokenName] = []
        for (let tx of res.data.data) {
            let transaction = await this._unifyTransaction(address, tx)
            if (!transaction) continue

            let txTokenName = '_'
            if (typeof tx.contractData === 'undefined') {
                txTokenName = tokenName
            }  else if (typeof tx.contractData.contract_address != 'undefined') {
                txTokenName = tx.contractData.contract_address
            } else if (typeof tx.contractData.asset_name != 'undefined') {
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
        let transaction_status = 'new'
        if (transaction.confirmed) {
            if (typeof transaction.contractRet === 'undefined') {
                transaction_status = 'success'
            } else if (transaction.contractRet === 'SUCCESS') {
                transaction_status = 'success'
            } else {
                transaction_status = 'fail'
            }
        } else if (transaction.block > 0) {
            transaction_status = 'fail'
        }

        if (typeof transaction.timestamp === 'undefined') {
            new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timestamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (typeof transaction.contractData.amount == 'undefined') {
            if (typeof transaction.contractType != 'undefined' && transaction.contractType === 31) {
                //skip here
            } else {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err('TrxTransactionsProvider._unifyTransaction buggy tx ' + JSON.stringify(transaction))
            }
            return false
        }
        return {
            transaction_hash: transaction.hash,
            block_hash: '',
            block_number: transaction.block,
            block_time: formattedTime,
            block_confirmations: this._lastBlock - transaction.block,
            transaction_direction: (address.toLowerCase() === transaction.ownerAddress.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.ownerAddress,
            address_to: transaction.toAddress,
            address_amount: typeof transaction.contractData.amount !== 'undefined' ? transaction.contractData.amount : 0,
            transaction_status,
            transaction_fee: 0,
            input_value: transaction.data
        }
    }
}
