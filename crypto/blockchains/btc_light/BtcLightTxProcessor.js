import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

class BtcLightTxProcessor {
    constructor(settings) {
        this.provider = require('./providers/BtcLightProvider').init(settings)
    }

    async getNetworkPrices() {
        return {}
    }

    async getFeeRate(data, alreadyEstimatedGas = false) {
        return false
    }

    async sendTx(data) {
        await this.provider.setLoginByAddressORJsonData(data.addressFrom, data.jsonData)
        if (data.addressTo.indexOf('lnbc') === 0) {
            let needMore, offset = 0
            let transactions = {}
            do {
                needMore = false
                let {txs, PER_PAGE} = await this.provider.getTransactions(offset)
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

            let invoice = await this.provider.payInvoice(data.addressTo, data.amount)

            if (typeof invoice.error != 'undefined') {
                if (invoice.error) {
                    let e = new Error(invoice.message)
                    throw e
                }
            }

            let {txs, PER_PAGE} = await this.provider.getTransactions(offset)
            if (!txs) {
                let tmp = await this.provider.getTransactions(offset - 1)
                txs = tmp.txs
            }
            let newTxFound = false
            for(let tx of txs) {
                if (typeof (transactions[tx.timestamp]) === 'undefined') {
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
            return {hash : txHash, timestamp, block_hash : 'paid_invoice', transaction_status: 'paid', transaction_json : { memo : invoice.description, hash: invoice.payment_hash, destination: invoice.destination}}
        } else {
            throw new Error('plz use exchange to get your BTC')
        }



        return {hash : ''}

    }
}

module.exports.init = function(settings) {
    return new BtcLightTxProcessor(settings)
}
