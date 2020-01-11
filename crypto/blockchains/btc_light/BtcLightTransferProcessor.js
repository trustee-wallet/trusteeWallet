/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BtcLightProvider from './providers/BtcLightProvider'

export default class BtcLightTransferProcessor {

    async getNetworkPrices() {
        return {}
    }

    async getFeeRate(data, alreadyEstimatedGas = false) {
        return false
    }

    async sendTx(data) {
        await BtcLightProvider.setLoginByAddressORJsonData(data.addressFrom, data.jsonData)
        if (data.addressTo.indexOf('lnbc') !== 0) {
            throw new Error('plz use exchange to get your BTC')
        }
        let needMore, offset = 0
        let transactions = {}
        do {
            needMore = false
            let { txs, PER_PAGE } = await BtcLightProvider.getTransactions(offset)
            if (txs) {
                for (let tx of txs) {
                    if (tx.type !== 'paid_invoice') {
                        continue
                    }
                    transactions[tx.timestamp] = tx
                }
                if (txs.length === PER_PAGE) {
                    needMore = true
                    offset++
                }
            }
        } while (needMore)

        let invoice = await BtcLightProvider.payInvoice(data.addressTo, data.amount)

        if (typeof invoice.error != 'undefined') {
            if (invoice.error) {
                throw new Error(invoice.message)
            }
        }

        let { txs, PER_PAGE } = await BtcLightProvider.getTransactions(offset)
        if (!txs) {
            let tmp = await BtcLightProvider.getTransactions(offset - 1)
            txs = tmp.txs
        }
        let newTxFound = false
        for (let tx of txs) {
            if (typeof transactions[tx.timestamp] === 'undefined') {
                newTxFound = tx
            }
        }
        let txHash = 'paid_invoice_'
        if (!newTxFound) {
            timestamp = false
            BlocksoftCryptoLog.log('transactions', transactions)
            BlocksoftCryptoLog.log('invoice', invoice)
            BlocksoftCryptoLog.err('BtcLightTxProcessor couldnt find newTx timestamped')
        } else {
            txHash += newTxFound.timestamp
            timestamp = newTxFound.timestamp * 1000
        }
        return {
            hash: txHash,
            timestamp,
            block_hash: 'paid_invoice',
            transaction_status: 'paid',
            transaction_json: {
                memo: invoice.description,
                hash: invoice.payment_hash,
                destination: invoice.destination
            }
        }
    }
}
