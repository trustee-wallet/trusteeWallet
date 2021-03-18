/**
 * @version 0.5
 * https://github.com/bitpay/bitcore/blob/master/packages/bitcore-node/docs/api-documentation.md
 * https://api.vergecurrency.network/node/api/XVG/mainnet/address/DL5LtSf7wztH45VuYunL8oaQHtJbKLCHyw/balance
 */
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import XvgTmpDS from './stores/XvgTmpDS'
import XvgFindAddressFunction from './basic/XvgFindAddressFunction'

const API_PATH = 'https://api.vergecurrency.network/node/api/XVG/mainnet'
const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}
let CACHE_FROM_DB = {}

export default class XvgScannerProcessor {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 20

    /**
     * @param {string} address
     * @return {Promise<{balance:*, unconfirmed:*, provider:string}>}
     */
    async getBalanceBlockchain(address) {
        const link = `${API_PATH}/address/${address}/balance`
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data) {
            return false
        }
        if (typeof res.data.confirmed === 'undefined') {
            throw new Error('XvgScannerProcessor.getBalance nothing loaded for address ' + link)
        }
        const balance = res.data.confirmed
        return { balance, unconfirmed: 0, provider: 'api.vergecurrency' }
    }

    /**
     * @param {string} scanData.account.address
     * @param {*} scanData.additional
     * @param {string} scanData.account.walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions started ' + address)
        const link = `${API_PATH}/address/${address}/txs`
        BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions call ' + link)
        let tmp = await BlocksoftAxios.get(link)
        if (tmp.status < 200 || tmp.status >= 300) {
            throw new Error('not valid server response status ' + link)
        }

        if (typeof tmp.data === 'undefined' || !tmp.data) {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(tmp.data))
        }

        tmp = tmp.data
        if (tmp.data) {
            tmp = tmp.data // wtf but ok to support old wallets
        }

        const transactions = []
        const already = {}
        CACHE_FROM_DB = await XvgTmpDS.getCache(address)

        let tx
        for (tx of tmp) { // ASC order is important
            const tmp2 = await this._unifyTransactionStep1(address, tx, already)
            if (tmp2) {
                if (tmp2.outcoming) {
                    if (typeof CACHE_FROM_DB[tmp2.outcoming.transactionHash + '_data'] === 'undefined') {
                        tmp2.outcoming = await this._unifyTransactionStep2(address, tmp2.outcoming)
                        if (tmp2.outcoming) {
                            already[tmp2.outcoming.transactionHash] = 1
                            if (tmp2.outcoming.addressTo === '?') {
                                tmp2.outcoming.addressTo = 'self'
                                BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions consider as self ' + tmp2.outcoming.transactionHash)
                            }
                            transactions.push(tmp2.outcoming)
                        }
                    } else {
                        already[tmp2.outcoming.transactionHash] = 1
                    }
                }
                if (tmp2.incoming) {
                    if (typeof CACHE_FROM_DB[tmp2.incoming.transactionHash + '_data'] === 'undefined') {
                        tmp2.incoming = await this._unifyTransactionStep2(address, tmp2.incoming)
                        if (tmp2.incoming) {
                            already[tmp2.incoming.transactionHash] = 1
                            transactions.push(tmp2.incoming)
                        }
                    } else {
                        already[tmp2.incoming.transactionHash] = 1
                    }
                }
            }
        }
        BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions finished ' + address + ' total: ' + transactions.length)
        return transactions

    }

    /**
     * https://api.vergecurrency.network/node/api/XVG/mainnet/tx/abcda88bdb3968c5e444694ce3914cdec34f3afab73627bf201d34493d5e3aae/coins
     * @param address
     * @param transaction
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _unifyTransactionStep2(address, transaction) {
        if (!transaction) return false

        if (typeof CACHE[transaction.transactionHash] !== 'undefined') {
            if (CACHE[transaction.transactionHash].data.blockConfirmations > 100) {
                return CACHE[transaction.transactionHash].data
            }
            const now = new Date().getTime()
            if (now - CACHE[transaction.transactionHash].time < CACHE_VALID_TIME) {
                return CACHE[transaction.transactionHash].data
            }
        }

        let tmp

        const link = `${API_PATH}/tx/${transaction.transactionHash}/coins`
        BlocksoftCryptoLog.log('XvgScannerProcessor._unifyTransactionStep2 call for outputs should be ' + link)

        if (typeof CACHE_FROM_DB[transaction.transactionHash + '_coins'] !== 'undefined') {
            tmp = CACHE_FROM_DB[transaction.transactionHash + '_coins']
        } else {
            BlocksoftCryptoLog.log('XvgScannerProcessor._unifyTransactionStep2 called ' + link)
            tmp = await BlocksoftAxios.get(link)
            tmp = tmp.data
            // noinspection ES6MissingAwait
            XvgTmpDS.saveCache(address, transaction.transactionHash, 'coins', tmp)
            CACHE_FROM_DB[transaction.transactionHash + '_coins'] = tmp
        }


        let output
        try {
            output = await XvgFindAddressFunction(address, tmp)
        } catch (e) {
            e.message += ' while XvgFindAddressFunction'
            throw e
        }

        transaction.transactionDirection = output.direction
        transaction.addressFrom = output.from
        transaction.addressTo = output.to
        transaction.addressAmount = output.value


        const link2 = `${API_PATH}/tx/${transaction.transactionHash}`
        BlocksoftCryptoLog.log('XvgScannerProcessor._unifyTransactionStep2 call for details ' + link2)
        let tmp2 = await BlocksoftAxios.get(link2)
        tmp2 = tmp2.data
        transaction.blockHash = tmp2.blockHash
        transaction.blockTime = tmp2.blockTimeNormalized
        transaction.blockConfirmations = tmp2.confirmations * 1
        if (transaction.blockConfirmations < 0) transaction.blockConfirmations = transaction.blockConfirmations * -1

        transaction.transaction_fee = tmp2.fee
        transaction.transactionStatus = 'new'
        if (transaction.blockConfirmations > this._blocksToConfirm) {
            transaction.transactionStatus = 'success'
        } else if (transaction.blockConfirmations > 0) {
            transaction.transactionStatus = 'confirming'
        }
        if (transaction.transactionStatus === 'success') {
            // noinspection ES6MissingAwait
            XvgTmpDS.saveCache(address, transaction.transactionHash, 'data', tmp2)
            CACHE_FROM_DB[transaction.transactionHash + '_data'] = 1 // no need all - just mark
        }
        BlocksoftCryptoLog.log('XvgScannerProcessor._unifyTransactionStep2 call for details result ', transaction)
        CACHE[transaction.transactionHash] = {}
        CACHE[transaction.transactionHash].time = new Date().getTime()
        CACHE[transaction.transactionHash].data = transaction
        return transaction
    }

    /**
     *
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction._id 5dcedb83746f4c73710ff5ce
     * @param {string} transaction.chain XVG
     * @param {string} transaction.network mainnet
     * @param {string} transaction.coinbase false
     * @param {string} transaction.mintIndex 0
     * @param {string} transaction.spentTxid
     * @param {string} transaction.mintTxid abcda88bdb3968c5e444694ce3914cdec34f3afab73627bf201d34493d5e3aae
     * @param {string} transaction.mintHeight 3600363
     * @param {string} transaction.spentHeight
     * @param {string} transaction.address DL5LtSf7wztH45VuYunL8oaQHtJbKLCHyw
     * @param {string} transaction.script 76a914a3d43334ff9ea4c257a1796b63e4fa8330747d2e88ac
     * @param {string} transaction.value 95000000
     * @param {string} transaction.confirmations
     * @param {*} already
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransactionStep1(address, transaction, already) {
        if (transaction.chain !== 'XVG' || transaction.network !== 'mainnet') return false
        const res = { incoming: false, outcoming: false }
        if (transaction.spentTxid && typeof already[transaction.spentTxid] === 'undefined') {
            res.outcoming = {
                transactionHash: transaction.spentTxid,
                blockHash: '?',
                blockNumber: +transaction.spentHeight,
                blockTime: '?',
                blockConfirmations: '?',
                transactionDirection: 'outcome',
                addressFrom: transaction.address,
                addressTo: '?',
                addressAmount: '0',
                transactionStatus: '?'
            }
        }
        if (transaction.mintTxid && transaction.mintTxid !== transaction.spentTxid && typeof already[transaction.mintTxid] === 'undefined') {
            res.incoming = {
                transactionHash: transaction.mintTxid,
                blockHash: '?',
                blockNumber: +transaction.mintHeight,
                blockTime: '?',
                blockConfirmations: '?',
                transactionDirection: 'income',
                addressFrom: '?',
                addressTo: transaction.address,
                addressAmount: '0', // transaction.value
                transactionStatus: '?'
            }
        }
        return res

    }
}
