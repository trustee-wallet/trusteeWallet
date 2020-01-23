/**
 * @version 0.5
 * https://bsv.btc.com/api-doc
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'

const API_PATH = 'https://bsv-chain.api.btc.com/v3/address/'
const API_TX_PATH = 'https://bsv-chain.api.btc.com/v3/address/'

export default class BsvScannerProcessor {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * https://bsv-chain.api.btc.com/v3/address/18SZd38c139X7z8UCCnZHSAnzYhUhrSR7k
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        let link = API_PATH + address
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof res.data.data === 'undefined' || !res.data.data || typeof res.data.data.balance === 'undefined') {
            return false
        }
        return {balance: res.data.data.balance, unconfirmed: 0, provider: 'btc.com' }
    }

    /**
     * https://explorer.viabtc.com/res/bsv/transactions/addressv2?address=1KiTAxJQJ2cv4hTZsJXtCgc3ZaaqZCF7Un
     * https://bsv-chain.api.btc.com/v3/address/1KiTAxJQJ2cv4hTZsJXtCgc3ZaaqZCF7Un/tx
     * @param {string} address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address) {
        BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions started', address)
        let tmp = await BlocksoftAxios.getWithoutBraking(API_TX_PATH + address + '/tx')
        if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.data === 'undefined' || !tmp.data.data || typeof tmp.data.data.list === 'undefined' || !tmp.data.data.list) {
             return []
        }
        let transactions = []
        for (let tx of tmp.data.data.list) {
            let transaction = await this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions finished', address + ' total: ' + transactions.length)
        return transactions
    }

    async _unifyTransaction(address, transaction) {
        let showAddresses = {
            to : address,
            from : address
        }
        if (transaction.balance_diff < 0) {
            transaction.balance_diff = Math.abs(transaction.balance_diff)
            showAddresses.direction = 'outcome'
            if (typeof transaction.outputs != 'undefined') {
                for (let vout of transaction.outputs) {
                    if (vout.addresses[0] && vout.addresses[0] !== address) {
                        showAddresses.to = vout.addresses[0]
                    }
                }
            }
        } else {
            showAddresses.direction = 'income'
            if (typeof transaction.inputs != 'undefined') {
                for (let vin of transaction.inputs) {
                    if (vin.prev_addresses[0] && vin.prev_addresses[0] !== address) {
                        showAddresses.from = vin.prev_addresses[0]
                    }
                }
            }
        }
        showAddresses.value = transaction.balance_diff

        if (typeof transaction.block_time === "undefined") {
            new Error(' no transaction.time error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.block_time
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.block_time)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        let confirmations = transaction.confirmations * 1;
        return {
            transaction_hash: transaction.hash,
            block_hash: transaction.block_hash,
            block_number: +transaction.block_height,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: showAddresses.direction,
            address_from: showAddresses.from,
            address_to: showAddresses.to,
            address_amount: showAddresses.value,
            transaction_status: confirmations > this._blocksToConfirm ? 'success' : 'new',
            transaction_fee: BlocksoftUtils.toSatoshi(transaction.fee),
            lock_time: +transaction.lock_time,
            vin: JSON.stringify(transaction.inputs),
            vout: JSON.stringify(transaction.outputs)
        }
    }
}
