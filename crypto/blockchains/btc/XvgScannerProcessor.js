import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}

class XvgScannerProcessor {

    constructor(settings) {
        this._xvgApiPath = ' https://api.vergecurrency.network/node/api/XVG/mainnet'
    }

    async getBalance(address) {
        let res = await BlocksoftAxios.get(this._xvgApiPath + '/address/' + address + '/balance')
        if (!res.data || typeof(res.data.confirmed) === 'undefined') {
            return {balance : 0, provider: 'api.vergecurrency' }
        }
        let balance = res.data.confirmed
        return {balance, provider: 'api.vergecurrency' }
    }

    /**
     * @param {string} address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address) {
        address = address.trim()
        BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions started', address)
        let link = `${this._xvgApiPath}/address/${address}/txs`
        let tmp  = await BlocksoftAxios.get(link)

        if(tmp.status < 200 || tmp.status >= 300) {
            throw new Error('not valid server response status ' + link)
        }

        if (typeof tmp.data === 'undefined') {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(tmp.data))
        }

        tmp = tmp.data
        if (tmp.data) {
            tmp = tmp.data // wtf but ok to support old wallets
        }

        let transactions = []
        let already = {}
        for (let tx of tmp) {
            let tmp2 = await this._unifyTransactionStep1(address, tx, already)
            if (tmp2) {
                tmp2.incoming = await this._unifyTransactionStep2(address, tmp2.incoming)
                if (tmp2.incoming) {
                    already[tmp2.incoming.transaction_hash] = 1
                    transactions.push(tmp2.incoming)
                }
                tmp2.outcoming = await this._unifyTransactionStep2(address, tmp2.outcoming)
                if (tmp2.outcoming) {
                    already[tmp2.outcoming.transaction_hash] = 1
                    transactions.push(tmp2.outcoming)
                }
            }
        }
        BlocksoftCryptoLog.log('XvgScannerProcessor.getTransactions finished', address)
        return transactions
    }

    async _unifyTransactionStep2(address, transaction) {
        if (!transaction) return false

        if (typeof (CACHE[transaction.transaction_hash]) !== 'undefined') {
            if (CACHE[transaction.transaction_hash]['data'].block_confirmations > 100) {
                return CACHE[transaction.transaction_hash]['data']
            }
            let now = new Date().getTime()
            if (now - CACHE[transaction.transaction_hash]['time'] < CACHE_VALID_TIME) {
                return CACHE[transaction.transaction_hash]['data']
            }
        }

        let link = `${this._xvgApiPath}/tx/${transaction.transaction_hash}/coins`
        let tmp = await BlocksoftAxios.get(link)
        if (transaction.transaction_direction === 'income') {
            let self = false
            for (let input of tmp.data.inputs) {
                if (input.address) {
                    if (input.address !== address) {
                        transaction.address_from = input.address
                        break
                    } else {
                        self = true
                    }
                }
            }
            if (transaction.address_from === '?' && self) {
                transaction.address_from = address
            }
        } else {
            for (let input of tmp.data.inputs) {
                if (input.address && input.address === address) {
                    transaction.address_amount = input.value
                    break
                }
            }
            for (let output of tmp.data.outputs) {
                if (output.address) {
                    if (output.address != address) {
                        transaction.address_to = output.address
                    } else {
                        //transaction.address_amount = transaction.address_amount - output.value
                    }
                }
            }
        }
        if (transaction.address_from === address) {
            transaction.transaction_direction = 'outcome'
        }
        if (transaction.address_to === address) {
            transaction.transaction_direction = 'income'
        }

        let link2 = `${this._xvgApiPath}/tx/${transaction.transaction_hash}`
        let tmp2 = await BlocksoftAxios.get(link2)
        transaction.block_hash = tmp2.data.blockHash
        transaction.block_time = tmp2.data.blockTimeNormalized
        transaction.block_confirmations = tmp2.data.confirmations * 1
        if (transaction.block_confirmations < 0) transaction.block_confirmations = transaction.block_confirmations * -1

        transaction.transaction_fee = tmp2.data.fee
        transaction.transaction_status = transaction.block_confirmations > 15 ? 'success' : 'new'
        transaction.address_amount =  transaction.address_amount

        CACHE[transaction.transaction_hash] = {}
        CACHE[transaction.transaction_hash]['time'] = new Date().getTime()
        CACHE[transaction.transaction_hash]['data'] = transaction
        return transaction
    }
    async _unifyTransactionStep1(address, transaction, already) {
        if (transaction.chain !== 'XVG' || transaction.network !== 'mainnet') return false
        let res = {incoming : false, outcoming : false}
        if (transaction.spentTxid && typeof already[transaction.spentTxid] === 'undefined') {
            res.outcoming = {
                transaction_hash: transaction.spentTxid,
                block_hash: '?',
                block_number: +transaction.spentHeight,
                block_time: '?',
                block_confirmations: '?',
                transaction_direction: 'outcome',
                address_from: transaction.address,
                address_to: '?',
                address_amount: '?',
                transaction_status: '?',
            }
        }
        if (transaction.mintTxid && transaction.mintTxid !== transaction.spentTxid && typeof already[transaction.mintTxid] === 'undefined') {
            res.incoming = {
                transaction_hash: transaction.mintTxid,
                block_hash: '?',
                block_number: +transaction.mintHeight,
                block_time: '?',
                block_confirmations: '?',
                transaction_direction: 'income',
                address_from: '?',
                address_to: transaction.address,
                address_amount: transaction.value,
                transaction_status: '?',
            }
        }
        return res

    }
}

module.exports.init = function(settings) {
    return new XvgScannerProcessor(settings)
}
