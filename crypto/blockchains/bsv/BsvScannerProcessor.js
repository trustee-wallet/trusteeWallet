/**
 * @version 0.5
 */

import config from "@app/config/config"
import BlocksoftAxios from "@crypto/common/BlocksoftAxios"
import BlocksoftCryptoLog from "@crypto/common/BlocksoftCryptoLog"
import BlocksoftUtils from "@crypto/common/BlocksoftUtils";
import BlocksoftPrettyNumbers from "@crypto/common/BlocksoftPrettyNumbers";
import BsvTmpDS from "@crypto/blockchains/bsv/stores/BsvTmpDS";

const API_PATH = 'https://api.whatsonchain.com/v1/bsv/main'
const CACHE_TXS = {}
const CACHE_ASKED = {}

export default class BsvScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * https://api.whatsonchain.com/v1/bsv/main/address/1BcHq66j64juMffHc4Sc5XQ59wWrcSygoZ/balance
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        const link = `${API_PATH}/address/${address}/balance`
        let res = false
        let balance = 0
        try {
            res = await BlocksoftAxios.getWithoutBraking(link)
            if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.confirmed !== 'undefined') {
                balance = res.data.confirmed
            } else {
                return false
            }
        } catch (e) {
            // ?
            throw e
        }
        return {balance: balance, unconfirmed: 0, provider: 'api.whatsonchain.com'}
    }

    async _saveTxToCache(tx) {
        if (typeof CACHE_TXS[tx.txid] === 'undefined' && tx.confirmations > 100) {
            await BsvTmpDS.saveCache(tx.txid, tx)
        }

        CACHE_TXS[tx.txid] = tx
    }

    /**
     * https://api.whatsonchain.com/v1/bsv/main/address/1BcHq66j64juMffHc4Sc5XQ59wWrcSygoZ/history
     * @param scanData
     * @param source
     * @returns {Promise<*[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        if (!CACHE_ASKED[address]) {
            try {
                const asked = await BsvTmpDS.getCache(address)
                if (asked) {
                    for (let txid in asked) {
                        CACHE_TXS[txid] = asked[txid]
                    }
                }
                CACHE_ASKED[address] = true
            } catch (e) {
                throw new Error(e.message + ' in BsvTmpDS.getCache')
            }
        }
        BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions started ' + address)
        const linkTxs = `${API_PATH}/address/${address}/history`
        let res = false
        try {
            res = await BlocksoftAxios.getWithoutBraking(linkTxs)
        } catch (e) {
            throw e
        }

        if (!res || typeof res.data === 'undefined' || !res.data) {
            return false
        }
        const basicTxs = []
        for (const row of res.data) {
            if (row.height * 1 > 0) {
                basicTxs.push(row)
            } else {
                BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions strange one ' + JSON.stringify(row))
            }
        }

        let index = basicTxs.length
        let bulkTxs = []
        let otherTxs = []
        let transactions = []
        for (let i = 0; i < 20; i++) {
            index--
            if (index < 0) {
                break
            }
            let txid = basicTxs[index].tx_hash
            if (typeof CACHE_TXS[txid] === 'undefined') {
                bulkTxs.push(txid)
            } else {
                otherTxs.push(CACHE_TXS[txid])
            }
        }

        if (bulkTxs.length > 0) {
            BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions will ask ' + JSON.stringify(bulkTxs))
            res = false
            try {
                res = await BlocksoftAxios.post(API_PATH + '/txs', {txids: bulkTxs})
            } catch (e) {
                throw e
            }
            if (typeof res !== 'undefined' && res && typeof res.data !== 'undefined' && res.data) {
                transactions = await this._unifyTransactions(address, res.data, otherTxs)
            } else {
                transactions = await this._unifyTransactions(address, [], otherTxs)
            }
        } else {
            transactions = await this._unifyTransactions(address, [], otherTxs)
        }


        BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions finished ' + address)
        return transactions
    }

    async _precheckVins(result) {
        let vins = []
        for (let tx of result) {
            for (let vin of tx.vin) {
                if (typeof CACHE_TXS[vin.txid] === 'undefined') {
                    vins.push(vin.txid)
                    if (vins.length > 19) {
                        BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions will ask vins ' + JSON.stringify(vins))
                        const res = await BlocksoftAxios.post(API_PATH + '/txs', {txids: vins})
                        if (res && typeof res.data !== 'undefined' && res.data) {
                            for (const tx of res.data) {
                                await this._saveTxToCache(tx)
                            }
                        }
                        vins = []
                    }
                }
            }
        }
        if (vins && vins.length > 0) {
            BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions will ask vins1 ' + JSON.stringify(vins))
            const res = await BlocksoftAxios.post(API_PATH + '/txs', {txids: vins})
            if (res && typeof res.data !== 'undefined' && res.data) {
                for (const tx of res.data) {
                    await this._saveTxToCache(tx)
                }
            }
        }
    }

    async _unifyTransactions(address, result, otherTxs) {
        const transactions = []
        if (result && result.length > 0) {
            for (let tx of result) {
                await this._saveTxToCache(tx)
            }
            await this._precheckVins(result)
            for (let tx of result) {
                const transaction = await this._unifyTransaction(address, tx)
                if (transaction) {
                    transactions.push(transaction)
                }
            }
        }
        if (otherTxs && otherTxs.length > 0) {
            for (let tx of otherTxs) {
                await this._precheckVins(otherTxs)
                try {
                    const transaction = await this._unifyTransaction(address, tx)
                    if (transaction) {
                        transactions.push(transaction)
                    }
                } catch (e) {
                    throw new Error(e.message + ' in otherTxs _unifyTransaction ')
                }
            }
        }
        return transactions
    }


    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.txid "d1eecd2a07b9712644bcec3d7285fdc444691da6701d0032ebf6b0f823ab1727"
     * @param {string} transaction.hash "d1eecd2a07b9712644bcec3d7285fdc444691da6701d0032ebf6b0f823ab1727"
     * @param {string} transaction.version 2
     * @param {string} transaction.size 521
     * @param {string} transaction.locktime 0
     * @param {string} transaction.blockhash "000000000000000006d66f40fbe37ccc1854c3d13167e41485716b217ead8d6a"
     * @param {string} transaction.confirmations 151964
     * @param {string} transaction.time 1576793232,
     * @param {string} transaction.blocktime 1576793232
     * @param {string} transaction.blockheight 613832
     * @param {string} transaction.vin[].vout
     * @param {string} transaction.vin[].txid
     * @param {string} transaction.vin[].scriptSig.hex
     * @param {string} transaction.vout[].value
     * @param {string} transaction.vout[].n
     * @param {string} transaction.vout[].scriptPubKey.addresses[]
     * @return {UnifiedTransaction}
     * @private
     **/
    async _unifyTransaction(address, transaction) {
        try {
            const tx = {
                transactionHash: transaction.txid,
                blockHash: transaction.blockhash,
                blockNumber: transaction.blockheight,
                blockTime: new Date(transaction.blocktime * 1000).toISOString(),
                blockConfirmations: transaction.confirmations,
                transactionDirection: '?',
                addressFrom: '',
                addressTo: '',
                addressAmount: 0,
                transactionStatus: transaction.confirmations > this._blocksToConfirm ? 'success' : 'new',
                transactionFee: '0'
            }

            const vins = []
            for (let vin of transaction.vin) {
                if (typeof CACHE_TXS[vin.txid] === 'undefined') {
                    vins.push(vin.txid)
                }
            }
            if (vins && vins.length > 0) {
                BlocksoftCryptoLog.log('BsvScannerProcessor.getTransactions will ask vins2 ' + JSON.stringify(vins))
                const res = await BlocksoftAxios.post(API_PATH + '/txs', {txids: vins})
                if (res && typeof res.data !== 'undefined' && res.data) {
                    for (const tx of res.data) {
                        await this._saveTxToCache(tx)
                    }
                }
            }
            let othersSumIn = 0
            let mySumIn = 0
            let othersSumOut = 0
            let mySumOut = 0
            let othersAddressIn = false
            let othersAddressOut = false
            for (let vin of transaction.vin) {
                if (typeof CACHE_TXS[vin.txid] === 'undefined') {
                    BlocksoftCryptoLog.log('BsvScannerProcessor _unifyTransaction error cant find vin ' + vin.txid + ' for tx ' + transaction.txid)
                } else {
                    let found = false
                    for (let vinToCheck of CACHE_TXS[vin.txid].vout) {
                        if (vinToCheck.n === vin.vout) {
                            if (typeof vinToCheck.scriptPubKey.addresses !== 'undefined') {
                                const addressToCheck = vinToCheck.scriptPubKey.addresses[0]
                                const valueToCheck = vinToCheck.value
                                if (addressToCheck.toLowerCase() === address.toLowerCase()) {
                                    mySumIn += valueToCheck * 1
                                } else {
                                    othersSumIn += valueToCheck * 1
                                    othersAddressIn = addressToCheck
                                }
                            }
                            found = true
                        }
                    }
                    if (!found) {
                        BlocksoftCryptoLog.log('BsvScannerProcessor _unifyTransaction error cant find vin ' + vin.txid + ' n ' + vin.vout + ' for tx ' + transaction.txid)
                    }
                }
            }

            for (let vout of transaction.vout) {
                const addressToCheck = vout.scriptPubKey.addresses[0]
                const valueToCheck = vout.value
                if (addressToCheck.toLowerCase() === address.toLowerCase()) {
                    mySumOut += valueToCheck * 1
                } else {
                    othersSumOut += valueToCheck * 1
                    othersAddressOut = addressToCheck
                }
            }

            if (!othersSumIn && !othersSumOut) {
                tx.transactionDirection = 'self'
                tx.transactionFee = BlocksoftPrettyNumbers.setCurrencyCode('BSV').makeUnPretty(BlocksoftUtils.diff(mySumOut, mySumIn))
            } else if (!othersSumIn) {
                tx.transactionDirection = 'outcome'
                tx.addressTo = othersAddressOut
                const amount = BlocksoftUtils.diff(othersSumOut, othersSumIn)
                const fee = BlocksoftUtils.diff(mySumOut + othersSumOut, mySumIn + othersSumIn)
                tx.addressAmount = BlocksoftPrettyNumbers.setCurrencyCode('BSV').makeUnPretty(amount)
                tx.transactionFee = BlocksoftPrettyNumbers.setCurrencyCode('BSV').makeUnPretty(fee)
            } else {
                tx.transactionDirection = 'income'
                tx.addressFrom = othersAddressIn
                const amount = BlocksoftUtils.diff(mySumOut, mySumIn)
                tx.addressAmount = BlocksoftPrettyNumbers.setCurrencyCode('BSV').makeUnPretty(amount)
            }
            return tx
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BsvScannerProcessor _unifyTransaction error ' + e.message)
            }
            throw e
        }
    }
}

