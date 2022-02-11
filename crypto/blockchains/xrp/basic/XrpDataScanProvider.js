/**
 * @version 0.5
 * https://xrpl.org/request-formatting.html
 */
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import XrpTmpDS from '@crypto/blockchains/xrp/stores/XrpTmpDS'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_BLOCK_DATA = {}

export default class XrpDataScanProvider {

    setCache(tmp) {
        CACHE_BLOCK_DATA = tmp
    }

    async getBalanceBlockchain(address) {
        const link = BlocksoftExternalSettings.getStatic('XRP_SCANNER_SERVER')
        let res = false
        let balance = 0
        try {
            /**
             curl http://s1.ripple.com:51234/ -X POST -H "Content-Type: application/json" -d '{'method":"account_info","params":[{"account":"rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P","strict":true,"ledger_index":"validated","api_version':1}]}'
             curl https://xrplcluster.com/ -X POST -H "Content-Type: application/json" -d '{'method":"account_info","params":[{"account":"rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P","strict":true,"ledger_index":"validated","api_version':1}]}'
             */
            const data = {
                method: 'account_info',
                params: [
                    {
                        account: address,
                        strict: true,
                        ledger_index: 'validated',
                        api_version: 1
                    }
                ]
            }
            res = await BlocksoftAxios.postWithoutBraking(link, data)

            if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.result !== 'undefined' && res.data.result) {
                if (typeof res.data.result.account !== 'undefined' && typeof res.data.result.error_code !== 'undefined' &&  res.data.result.error_code === 19 ) {
                    balance = 0
                } else if (typeof res.data.result.account_data !== 'undefined' && typeof res.data.result.account_data.Balance !== 'undefined') {
                    balance = BlocksoftUtils.toUnified(res.data.result.account_data.Balance, 6)
                }
            } else {
                return false
            }
        } catch (e) {
            if (e.message.indexOf('timed out') === -1 && e.message.indexOf('account not found') === -1) {
                if (typeof res.data !== 'undefined' && res.data) {
                    e.message += ' in ' + JSON.stringify(res.data)
                } else {
                    e.message += ' empty data'
                }
                throw e
            } else {
                return false
            }
        }
        return { balance: balance, unconfirmed: 0, provider: link }
    }

    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        const link = BlocksoftExternalSettings.getStatic('XRP_SCANNER_SERVER')
        let transactions = []
        let res = false
        try {
            // https://xrpl.org/account_tx.html
            const data = {
                method: 'account_tx',
                params: [
                    {
                        account: address,
                        binary: false,
                        forward: false,
                        ledger_index_max: -1,
                        ledger_index_min: -1,
                        limit: 100
                    }
                ]
            }
            res = await BlocksoftAxios.postWithoutBraking(link, data)

            if (res && typeof res.data !== 'undefined' && res.data
                && typeof res.data.result !== 'undefined' && res.data.result
                && typeof res.data.result.transactions !== 'undefined' && res.data.result.transactions
            ) {
                transactions = await this._unifyTransactions(address, res.data.result.transactions, res.data.result.ledger_index_max)
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
        return transactions
    }

    async _unifyTransactions(address, result, lastBlock) {
        const transactions = []
        let tx
        for (tx of result) {
            const transaction = await this._unifyPayment(address, tx, lastBlock)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {bool}   transaction.validated
     * @param {string} transaction.tx.Account 'rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P'
     * @param {string} transaction.tx.Amount '2000000'
     * @param {string} transaction.tx.Destination 'rDh2XemJY5WSNCPgXjhqnJt1PLGsTKbnix'
     * @param {string} transaction.tx.DestinationTag
     * @param {string} transaction.tx.Fee 127091
     * @param {string} transaction.tx.LastLedgerSequence 68101269
     * @param {string} transaction.tx.TransactionType 'Payment'
     * @param {string} transaction.tx.date 691857661
     * @param {string} transaction.tx.hash '4D08316F83148C7C0EC955301E770A196B708EAF874BA2339260317BFDCE89E6'
     * @param {string} transaction.tx.inLedger 68101268
     * @param {string} transaction.tx.ledger_index 68101268
     * @param {string} transaction.meta.delivered_amount '2000000'
     * @param {string} transaction.meta.TransactionResult 'tesSUCCESS'
     * @return {UnifiedTransaction}
     * @private
     **/
    async _unifyPayment(address, transaction, lastBlock = 0) {
        if (transaction.tx.TransactionType !== 'Payment') {
            return false
        }
        let direction, amount
        if (transaction.tx.Account === address) {
            direction = 'outcome'
        } else {
            direction = 'income'
        }

        amount = transaction.tx.Amount
        if (direction === 'income' && typeof transaction.meta.delivered_amount !== 'undefined') {
            amount = transaction.meta.delivered_amount
        }

        let blockConfirmations = lastBlock - transaction.tx.ledger_index
        if (blockConfirmations <= 0) blockConfirmations = 0
        let transactionStatus = 'new'
        if (transaction.validated === true || transaction.meta.TransactionResult === 'tesSUCCESS') {
            if (blockConfirmations > 5) {
                transactionStatus = 'success'
            }
        }
        const ledger = await this._getLedger(transaction.tx.ledger_index)
        const blockTime = ledger && typeof ledger.close_time !== 'undefined' && ledger.close_time ? ledger.close_time : transaction.tx.date
        const blockHash = ledger && typeof ledger.ledger_hash !== 'undefined' && ledger.ledger_hash ? ledger.ledger_hash : transaction.tx.ledger_index
        const tx = {
            transactionHash: transaction.tx.hash,
            blockHash,
            blockNumber: transaction.tx.ledger_index,
            blockTime,
            blockConfirmations,
            transactionDirection: direction,
            addressFrom: transaction.tx.Account === address ? '' : transaction.tx.Account,
            addressTo: transaction.tx.Destination === address ? '' : transaction.tx.Destination,
            addressAmount: BlocksoftUtils.toUnified(amount, 6),
            transactionStatus: transactionStatus,
            transactionFee: BlocksoftUtils.toUnified(transaction.tx.Fee, 6)
        }
        // https://blockchair.com/ripple/transaction/F56C6B0CA7BB6CD9AC74843E6C7BA605C7FFBB1F409E356CA235423F30F55F51?from=trustee
        if (typeof transaction.tx.DestinationTag !== 'undefined') {
            tx.transactionJson = { memo: transaction.tx.DestinationTag }
        }
        return tx
    }

    async _getLedger(index) {
        const now = new Date().getTime()
        await BlocksoftCryptoLog.log('XrpScannerProcessor.DataScan._getLedger started ' + index)
        const link = BlocksoftExternalSettings.getStatic('XRP_SCANNER_SERVER')
        let res = false
        if (typeof CACHE_BLOCK_DATA[index] === 'undefined' ||
            (
                now - CACHE_BLOCK_DATA[index].time > CACHE_VALID_TIME
                &&
                CACHE_BLOCK_DATA[index].data.transactionConfirmations < 100
            )
        ) {
            try {
                const data = {
                    method: 'ledger_data',
                    params: [
                        {
                            binary: false,
                            ledger_index: index
                        }
                    ]
                }
                res = await BlocksoftAxios.postWithoutBraking(link, data)
                if (res.data && typeof res.data !== 'undefined' && typeof res.data.result !== 'undefined' && typeof res.data.result.ledger !== 'undefined') {
                    await BlocksoftCryptoLog.log('XrpScannerProcessor.DataScan._getLedger updated for index ' + index + ' ' + JSON.stringify(res.data.result.ledger))
                    const date = this._getDate(res.data.result.ledger.close_time_human)
                    const ledger = {
                        close_time: date,
                        ledger_hash: res.data.result.ledger.ledger_hash,
                        transactionConfirmations: Math.round((now - date * 1000) / (60 * 1000)) // minutes
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


    // 2021-Dec-03 14:41:01.00
    // const tmp = new Date(time) not working in emulator
    _getDate(time) {
        time = time.split('.')[0]
        const months = {
            'Jan': 0,
            'Feb': 1,
            'Mar': 2,
            'Apr': 3,
            'May': 4,
            'Jun': 5,
            'Jul': 6,
            'Aug': 7,
            'Sep': 8,
            'Oct': 9,
            'Nov': 10,
            'Dec': 11
        }
        const tmp0 = time.split(' ')
        const tmp1 = tmp0[0].split('-')
        const tmp2 = tmp0[1].split(':')
        const tmp = new Date(tmp1[0], months[tmp1[1]], tmp1[2], tmp2[0], tmp2[1], tmp2[2])
        return tmp.getTime()

    }
}
