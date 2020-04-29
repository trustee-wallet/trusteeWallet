/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BtcLightProvider from './providers/BtcLightProvider'

export default class BtcLightScannerProcessor {

    /**
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalanceBlockchain(address, jsonData) {
        await BtcLightProvider.setLoginByAddressORJsonData(address, jsonData)
        const balance = await BtcLightProvider.getBalanceBlockchain()
        return { balance: balance.BTC.AvailableBalance, unconfirmed: 0, provider: 'light' }
    }

    /**
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(address, jsonData) {
        BlocksoftCryptoLog.log('BtcLightScannerProcessor.getTransactions started')
        await BtcLightProvider.setLoginByAddressORJsonData(address, jsonData)
        const transactions = []

        const userInvoices = {}
        let needMore; let offset = 0
        do {
            needMore = false
            const { invoices, PER_PAGE } = await BtcLightProvider.getUserInvoices(offset)
            if (invoices) {
                this._parseAndSave(invoices, transactions, address)
                let invoice
                for (invoice of invoices) {
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
            const { txs, PER_PAGE } = await BtcLightProvider.getTransactionsBlockchain(offset)
            if (txs) {
                let tx
                for (tx of txs) {
                    if (tx.type !== 'paid_invoice') {
                        continue
                    }
                    if (typeof userInvoices[tx.timestamp] !== 'undefined') continue
                    const transaction = {
                        transaction_hash: 'paid_invoice_' + tx.timestamp,
                        block_hash: tx.type, // 'paid_invoice'
                        block_number: '0',
                        block_time: tx.timestamp * 1000,
                        block_confirmations: '0',
                        transaction_direction: 'outcome',
                        transaction_json: { memo: tx.memo },
                        address_from: address,
                        address_to: '',
                        address_amount: tx.value,
                        transaction_status: 'paid'
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
        const now = new Date().getTime()
        let invoice
        for (invoice of invoices) {
            try {
                const blockTime = invoice.timestamp * 1000
                const timed = (now - blockTime) / 1000
                let transactionStatus = 'new'
                if (invoice.ispaid === true) {
                    transactionStatus = 'paid'
                } else if (timed < invoice.expire_time) {
                    transactionStatus = 'pay_waiting'
                } else {
                    transactionStatus = 'pay_expired'
                }
                const transaction = {
                    transaction_hash: invoice.payment_request,
                    block_hash: invoice.type, // user_invoice
                    block_number: '0',
                    block_time : blockTime,
                    block_confirmations: '0',
                    transaction_direction: 'income',
                    transaction_json: { memo: invoice.description },
                    address_from: '',
                    address_to: address,
                    address_amount: invoice.amt,
                    transaction_status : transactionStatus
                }

                /* if (timed < 72000000) { // 20 hours
                    let now2 = new Date(block_time)
                    let date2 = now2.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    console.log('desc', date2, timed, invoice.expire_time, invoice.payment_request, invoice.description)
                } */

                transactions.push(transaction)
            } catch (e) {
                // noinspection JSIgnoredPromiseFromCall
                BlocksoftCryptoLog.err('BtcLightScanner parse error ' + e.message)
            }
        }
    }
}
