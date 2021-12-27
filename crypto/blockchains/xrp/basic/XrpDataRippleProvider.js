import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import XrpTmpDS from '@crypto/blockchains/xrp/stores/XrpTmpDS'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_BLOCK_DATA = {}

const API_PATH = 'https://data.ripple.com/v2'
export default class XrpDataRippleProvider {

    setCache(tmp) {
        CACHE_BLOCK_DATA = tmp
    }

    async getBalanceBlockchain(address) {
        const link = `${API_PATH}/accounts/${address}/balances`
        let res = false
        let balance = 0

        try {
            res = await BlocksoftAxios.getWithoutBraking(link)
            if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.balances !== 'undefined') {
                let row
                for (row of res.data.balances) {
                    if (row.currency === 'XRP') {
                        balance = row.value
                        break
                    }
                }
            } else {
                return false
            }
        } catch (e) {
            if (e.message.indexOf('timed out') === -1 && e.message.indexOf('account not found') === -1) {
                throw e
            } else {
                return false
            }
        }
        return { balance: balance, unconfirmed: 0, provider: 'ripple.com' }
    }

    /**
     * @param {string} scanData.account.address
     * @param {*} scanData.additional
     * @param {string} scanData.account.walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        const action = 'payments'
        await BlocksoftCryptoLog.log('XrpScannerProcessor.DataRipple.getTransactions ' + action + ' started ' + address)
        const link = `${API_PATH}/accounts/${address}/payments`
        let res = false
        try {
            res = await BlocksoftAxios.getWithoutBraking(link)
        } catch (e) {
            if (e.message.indexOf('account not found') === -1
                && e.message.indexOf('to retrieve payments') === -1
                && e.message.indexOf('limit exceeded') === -1
                && e.message.indexOf('timed out') === -1
            ) {
                throw e
            } else {
                return false
            }
        }

        if (!res || typeof res.data === 'undefined' || !res.data) {
            return false
        }
        if (typeof res.data[action] === 'undefined') {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(res.data))
        }
        if (typeof res.data[action] === 'string') {
            throw new Error('Undefined txs ' + link + ' ' + res.data[action])
        }

        const transactions = await this._unifyTransactions(address, res.data[action], action)
        await BlocksoftCryptoLog.log('XrpScannerProcessor.DataRipple.getTransactions ' + action + ' finished ' + address)
        return transactions
    }

    async _unifyTransactions(address, result) {
        const transactions = []
        let tx
        for (tx of result) {
            const transaction = await this._unifyPayment(address, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.amount '20.001'
     * @param {string} transaction.delivered_amount '20.001',
     * @param {Object} transaction.destination_balance_changes: [ { counterparty: '', currency: 'XRP', value: '20.001' } ],
     * @param {Object} transaction.source_balance_changes: [ { counterparty: '', currency: 'XRP', value: '-20.001' } ],
     * @param {string} transaction.tx_index 8
     * @param {string} transaction.currency 'XRP'
     * @param {string} transaction.destination 'rL2SpzwrCZ4N2BaPm88pNGGHkPLzejZgB8'
     * @param {string} transaction.destination_tag '1'
     * @param {string} transaction.executed_time '2019-10-20T22:45:31Z'
     * @param {string} transaction.ledger_index 50845930
     * @param {string} transaction.source 'rpJZ5WyotdphojwMLxCr2prhULvG3Voe3X'
     * @param {string} transaction.source_currency 'XRP'
     * @param {string} transaction.tx_hash '673F28303546CB8A0F45A0D80E6391B7A4A125DB8B72AD0DA635D625C3AD27F1'
     * @param {string} transaction.transaction_cost '0.000012'
     * @return {UnifiedTransaction}
     * @private
     **/
    async _unifyPayment(address, transaction) {
        let direction, amount

        if (transaction.currency === 'XRP') {
            if (transaction.source_currency === 'XRP') {
                direction = (address === transaction.source) ? 'outcome' : 'income'
            } else if (transaction.destination === address) {
                direction = 'income' // USDT any => XRP my
            } else {
                // USDT my => XRP not my
                return false // do nothing
            }
        } else if (transaction.source_currency === 'XRP') {
            if (transaction.source === address) {
                direction = 'outcome' // XRP my => USDT any
            } else {
                // XRP not my => USDT my
                return false // do nothing
            }
        } else {
            return false // USDT => USDT
        }

        if (direction === 'income') {
            amount = transaction.delivered_amount
        } else {
            amount = transaction.amount
        }

        let transactionStatus = 'new'
        let ledger = false
        if (typeof transaction.ledger_index !== 'undefined' && transaction.ledger_index > 0) {
            ledger = await this._getLedger(transaction.ledger_index)
            if (ledger && ledger.transactionConfirmations > 5) {
                transactionStatus = 'success'
            }
        }

        if (typeof transaction.executed_time === 'undefined') {
            transaction.executed_time = ''
        }
        const tx = {
            transactionHash: transaction.tx_hash,
            blockHash: ledger ? ledger.ledger_hash : '',
            blockNumber: transaction.ledger_index,
            blockTime: transaction.executed_time,
            blockConfirmations: ledger ? ledger.transactionConfirmations : 0,
            transactionDirection: direction,
            addressFrom: transaction.source === address ? '' : transaction.source,
            addressTo: transaction.destination === address ? '' : transaction.destination,
            addressAmount: amount,
            transactionStatus: transactionStatus,
            transactionFee: transaction.transaction_cost
        }
        if (typeof transaction.destination_tag !== 'undefined') {
            tx.transactionJson = { memo: transaction.destination_tag }
        }
        return tx
    }

    async _getLedger(index) {
        const now = new Date().getTime()
        await BlocksoftCryptoLog.log('XrpScannerProcessor.DataRipple._getLedger started ' + index)
        const link = `${API_PATH}/ledgers/${index}`
        let res = false
        if (typeof CACHE_BLOCK_DATA[index] === 'undefined' ||
            (
                now - CACHE_BLOCK_DATA[index].time > CACHE_VALID_TIME
                &&
                CACHE_BLOCK_DATA[index].data.transactionConfirmations < 100
            )
        ) {
            try {
                res = await BlocksoftAxios.getWithoutBraking(link)
                if (res.data && typeof res.data !== 'undefined' && typeof res.data.ledger !== 'undefined') {
                    await BlocksoftCryptoLog.log('XrpScannerProcessor.DataRipple._getLedger updated for index ' + index + ' ' + JSON.stringify(res.data.ledger))
                    const ledger = {
                        close_time: res.data.ledger.close_time,
                        ledger_hash: res.data.ledger.ledger_hash,
                        transactionConfirmations : Math.round((now - res.data.ledger.close_time * 1000) / (60 * 1000)) // minutes
                    }
                    CACHE_BLOCK_DATA[index] = {
                        data: ledger,
                        time: now
                    }
                }
                await XrpTmpDS.saveCache(CACHE_BLOCK_DATA)
            } catch (e) {
                if (e.message.indexOf('timed out') === -1 && e.message.indexOf('account not found') === -1) {
                    throw e
                } else {
                    res = false
                }
            }
        }
        if (typeof CACHE_BLOCK_DATA[index] === 'undefined') {
            return false
        }
        return CACHE_BLOCK_DATA[index].data
    }
}
