/**
 * @version 0.5
 * https://docs.vechain.org/thor/get-started/api.html
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

const API_PATH = 'https://sync-mainnet.vechain.org'
const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}
export default class VetScannerProcessor {

    constructor(settings) {
        this._settings = settings
        this._lastBlock = 9243725
    }

    async _get(_address) {
        const address = _address.toLowerCase()

        const now = new Date().getTime()
        if (typeof CACHE[address] !== 'undefined' && (now - CACHE[address].time < CACHE_VALID_TIME)) {
            CACHE[address].provider = 'cache'
            return CACHE[address]
        }

        const link = API_PATH + '/accounts/' + address
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined' || typeof res.data.balance === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' VeChain ScannerProcessor getBalanceBlockchain ' + link + ' error ', res)
            return false
        }

        CACHE[address] = {
            balance: res.data.balance,
            energy: res.data.energy,
            provider: 'loaded',
            time: now
        }
        return CACHE[address]
    }

    /**
     * https://docs.vechain.org/thor/get-started/api.html#get-accounts-address
     * https://vethor-node.vechain.com/doc/swagger-ui/#/
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' VeChain ScannerProcessor getBalanceBlockchain address ' + address)

        const res = await this._get(address)
        if (!res) {
            return false
        }
        try {
            const hex = this._settings.currencyCode === 'VET' ? res.balance : res.energy
            const balance = BlocksoftUtils.hexToDecimalBigger(hex)
            return { balance, unconfirmed: 0, provider: 'vethor-node.vechain.com' }
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' VeChain ScannerProcessor getBalanceBlockchain address ' + address + ' balance ' + JSON.stringify(res) + ' to hex error ' + e.message)
        }
        return false

    }


    /**
     * https://docs.vechain.org/thor/get-started/api.html#post-logs-transfer
     * https://github.com/trustwallet/blockatlas/blob/696fb97b7b3197a7da4bb692122a8028ea4e07cf/platform/vechain/client.go
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData, source) {
        const address = scanData.account.address.trim()

        if (this._settings.currencyCode === 'VET') {
            try {
                const linkNumber = API_PATH + '/blocks/best'
                const resultNumber = await BlocksoftAxios.get(linkNumber)
                if (resultNumber && typeof resultNumber.data !== 'undefined' && typeof resultNumber.data.number !== 'undefined') {
                    const tmp = resultNumber.data.number * 1
                    if (tmp > this._lastBlock) {
                        this._lastBlock = tmp
                    }
                }
            } catch (e) {
                BlocksoftCryptoLog.log('VetScannerProcessor.getTransactions lastBlock ' + e.message)
            }

            const link = API_PATH + '/logs/transfer'
            const result = await BlocksoftAxios.post(link, {
                'options': {
                    'offset': 0,
                    'limit': 100
                },
                'criteriaSet': [
                    {
                        'txOrigin': address
                    },
                    {
                        'sender': address
                    },
                    {
                        'recipient': address
                    }
                ],
                'order': 'desc'
            })

            if (!result.data || result.data.length === 0) return false

            const transactions = await this._unifyTransactions(address, result.data)
            BlocksoftCryptoLog.log('VetScannerProcessor.getTransactions finished ' + address)
            return transactions
        } else {
            const link = API_PATH + '/logs/event'
            const tokenHex = '0x000000000000000000000000' + address.toLowerCase().substr(2)
            const result = await BlocksoftAxios.post(link, {
                'options': {
                    'offset': 0,
                    'limit': 100
                },
                'criteriaSet': [
                    {
                        address: '0x0000000000000000000000000000456e65726779',
                        Topic1: tokenHex
                    },
                    {
                        address: '0x0000000000000000000000000000456e65726779',
                        Topic2: tokenHex
                    }
                ],
                'order': 'desc'
            })
            if (!result.data || result.data.length === 0) return false
            const transactions = await this._unifyTransactionsToken(address, result.data)
            BlocksoftCryptoLog.log('VetScannerProcessor.getTransactions finished ' + tokenHex)
            return transactions
        }
    }

    async _reloadLastBlock() {
        try {
            const link = API_PATH + '/blocks/best'
            const result = await BlocksoftAxios.get(link)
            if (!result.data || typeof result.data.number === 'undefined') {
                return false
            }
            this._lastBlock = result.data.number
        } catch (e) {
            BlocksoftCryptoLog.log('VetScannerProcessor._reloadLastBlock error ' + e.message)
        }
    }

    async _unifyTransactions(address, result) {
        const transactions = []
        let tx
        for (tx of result) {
            const transaction = await this._unifyTransaction(address, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    async _unifyTransactionsToken(address, result) {
        const transactions = []
        let tx
        for (tx of result) {
            const transaction = await this._unifyTransactionToken(address, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    async _unifyTransaction(address, transaction) {
        /**
         * "sender":"0xa4adafaef9ec07bc4dc6de146934c7119341ee25",
         * "recipient":"0xf3ce5d5d8ff44cb6b4f77512b94ddd6e04d820a0",
         * "amount":"0x352e15037328a70000",
         * "meta":{
         * "blockID":"0x008c4643ee0fb483412b2b6aa34c76c7925093cd1749f33238fa14f6ab340046",
         * "blockNumber":9193027,
         * "blockTimestamp":1622441190,
         * "txID":"0x46bb9fb1e71845fee9289e7626aa4eba26fb834d1a17661c6fbbb333958fcc67",
         * "txOrigin":"0xa4adafaef9ec07bc4dc6de146934c7119341ee25",
         * "clauseIndex":0
         */

        const amount = BlocksoftUtils.hexToDecimalBigger(transaction.amount)
        let formattedTime = transaction.meta.blockTimestamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.meta.blockTimestamp)
        } catch (e) {
            e.message += ' timestamp error transaction2 data ' + JSON.stringify(transaction)
            throw e
        }
        const now = new Date().getTime()
        const current = new Date(formattedTime).getTime()
        const diffSeconds = Math.round((now - current) / 1000)
        let blockConfirmations = this._lastBlock - transaction.meta.blockNumber
        if (diffSeconds > 60 && blockConfirmations < 0) {
            await this._reloadLastBlock()
            blockConfirmations = this._lastBlock - transaction.meta.blockNumber
        }
        const tx = {
            transactionHash: transaction.meta.txID,
            blockHash: transaction.meta.blockID,
            blockNumber: transaction.meta.blockNumber,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection: (address.toLowerCase() === transaction.sender.toLowerCase()) ? 'outcome' : 'income',
            addressFrom: transaction.sender === address ? '' : transaction.sender,
            addressTo: transaction.recipient === address ? '' : transaction.recipient,
            addressAmount: amount,
            transactionStatus: blockConfirmations > 20 ? 'success' : 'new',
            transactionFee: '0'
        }
        return tx
    }

    async _unifyTransactionToken(address, transaction) {
        /**
         * "address": "0x0000000000000000000000000000456e65726779",
         * "topics": [
         * "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
         * "0x000000000000000000000000a4adafaef9ec07bc4dc6de146934c7119341ee25",
         * "0x000000000000000000000000f3ce5d5d8ff44cb6b4f77512b94ddd6e04d820a0"
         * ],
         * "data": "0x00000000000000000000000000000000000000000000006a227cf2eb4ac80000",
         * "meta": {
         * "blockID": "0x008c525b58528178e3e2ea89e6a6864c0356127a21b5b06aeaa26f531690abf8",
         * "blockNumber": 9196123,
         * "blockTimestamp": 1622472160,
         * "txID": "0x190406bc9491484ca763774dfb074118ef7b5d6f594ac484402da265d00c3eff",
         * "txOrigin": "0xa4adafaef9ec07bc4dc6de146934c7119341ee25",
         * "clauseIndex": 5
         */

        const amount = BlocksoftUtils.hexToDecimalBigger(transaction.data)
        let formattedTime = transaction.meta.blockTimestamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.meta.blockTimestamp)
        } catch (e) {
            e.message += ' timestamp error transaction2 data ' + JSON.stringify(transaction)
            throw e
        }
        const now = new Date().getTime()
        const current = new Date(formattedTime).getTime()
        const diffSeconds = Math.round((now - current) / 1000)
        let blockConfirmations = this._lastBlock - transaction.meta.blockNumber
        if (diffSeconds > 60 && blockConfirmations < 0) {
            await this._reloadLastBlock()
            blockConfirmations = this._lastBlock - transaction.meta.blockNumber
        }
        if (blockConfirmations > 100 && diffSeconds < 600) {
            blockConfirmations = diffSeconds
        } else if (blockConfirmations < 0) {
            blockConfirmations = diffSeconds > 60 ? 2 : 0
        }
        const addressFrom = typeof transaction.topics[1] !== 'undefined' ? transaction.topics[1].replace('0x000000000000000000000000', '0x') : ''
        const addressTo = typeof transaction.topics[2] !== 'undefined' ? transaction.topics[2].replace('0x000000000000000000000000', '0x') : ''
        const tx = {
            transactionHash: transaction.meta.txID,
            blockHash: transaction.meta.blockID,
            blockNumber: transaction.meta.blockNumber,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection: addressFrom === address.toLowerCase() ? 'outcome' : 'income',
            addressFrom: addressFrom === address.toLowerCase() ? '' : addressFrom,
            addressTo: addressTo === address.toLowerCase() ? '' : addressTo,
            addressAmount: amount,
            transactionStatus: blockConfirmations > 12 ? 'success' : 'new',
            transactionFee: '0'
        }
        return tx
    }
}
