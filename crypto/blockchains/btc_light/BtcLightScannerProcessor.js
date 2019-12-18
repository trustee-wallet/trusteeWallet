import { BlocksoftKeysStorage } from '../../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

class BtcLightScannerProcessor {

    constructor(settings) {
        this.provider = require('./providers/BtcLightProvider').init(settings)
    }

    /**
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address, jsonData) {
        await this.provider.setLoginByAddressORJsonData(address, jsonData)
        let balance = await this.provider.getBalance()
        return {balance : balance.BTC.AvailableBalance, unconfirmed : 0, provider : 'light'}
    }

    /**
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactions(address, jsonData) {
        BlocksoftCryptoLog.log('BtcLightScannerProcessor.getTransactions started')
        await this.provider.setLoginByAddressORJsonData(address, jsonData)
        let transactions = []

        let userInvoices = {}
        let needMore, offset = 0
        do {
            needMore = false
            let {invoices, PER_PAGE} = await this.provider.getUserInvoices(offset)
            if (invoices) {
                this._parseAndSave(invoices, transactions, address)
                for (let invoice of invoices) {
                    userInvoices[invoice.timestamp] = 1
                }
                if (invoices.length === PER_PAGE) {
                    needMore = true
                    offset++
                }
            }
        } while (needMore)

        offset = 0
        do {
            needMore = false
            let {txs, PER_PAGE} = await this.provider.getTransactions(offset)
            if (txs) {
                for (let tx of txs) {
                    if (tx.type !== 'paid_invoice') {
                        // console.log('tx', tx)
                        continue
                    }
                    if (typeof userInvoices[tx.timestamp] !== 'undefined') continue
                    let transaction = {
                        transaction_hash: 'paid_invoice_' + tx.timestamp,
                        block_hash: tx.type, //'paid_invoice'
                        block_number: '0',
                        block_time : tx.timestamp * 1000,
                        block_confirmations: '0',
                        transaction_direction: 'outcome',
                        transaction_json: { memo: tx.memo },
                        address_from: address,
                        address_to: '',
                        address_amount: tx.value,
                        transaction_status : 'paid',
                    }
                    transactions.push(transaction)
                }
                if (txs.length === PER_PAGE) {
                    needMore = true
                    offset++
                }
            }
        } while (needMore)

        return transactions
    }

    _parseAndSave(invoices, transactions, address) {
        let now = new Date().getTime()
        for (let invoice of invoices) {
            try {
                let block_time = invoice.timestamp * 1000
                let timed = (now - block_time)/1000
                let transaction_status = 'new'
                if (invoice.ispaid === true) {
                    transaction_status = 'paid'
                } else if (timed < invoice.expire_time) {
                    transaction_status = 'pay_waiting'
                } else {
                    transaction_status = 'pay_expired'
                }
                let transaction = {
                    transaction_hash: invoice.payment_request,
                    block_hash: invoice.type, //user_invoice
                    block_number: '0',
                    block_time,
                    block_confirmations: '0',
                    transaction_direction: 'income',
                    transaction_json: { memo: invoice.description },
                    address_from: '',
                    address_to: address,
                    address_amount: invoice.amt,
                    transaction_status,
                }

                /*if (timed < 72000000) { // 20 hours
                    let now2 = new Date(block_time)
                    let date2 = now2.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    console.log('desc', date2, timed, invoice.expire_time, invoice.payment_request, invoice.description)
                }*/

                transactions.push(transaction)
            } catch (e) {
                BlocksoftCryptoLog.err('BtcLightScanner parse error ' + e.message)
            }
        }
    }
}

module.exports.init = function (settings) {
    return new BtcLightScannerProcessor(settings)
}
