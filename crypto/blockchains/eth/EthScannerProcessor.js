/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthBasic from './basic/EthBasic'

const CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL = {}
const CACHE_GET_MAX_BLOCK = { max_block_number: 0, confirmations: 0 }
const CACHE_BLOCK_NUMBER_TO_HASH = {}

const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}

export default class EthScannerProcessor extends EthBasic {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {boolean}
     * @private
     */
    _useInternal = true

    /**
     * https://eth1.trezor.io/api/v2/address/0x8b661361Be29E688Dda65b323526aD536c8B3997?details=txs
     * @param address
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _get(address) {
        if (!this._trezorPath) {
            return false
        }
        const now = new Date().getTime()
        if (typeof CACHE[address] !== 'undefined' && (now - CACHE[address].time < CACHE_VALID_TIME)) {
            return CACHE[address].data
        }
        const link = this._trezorPath + address + '?details=txs'
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data) {
            return false
        }
        if (typeof res.data.balance === 'undefined') {
            throw new Error('EthScannerProcessor._get nothing loaded for address ' + link)
        }
        const data = res.data
        CACHE[address] = {
            data,
            time: now
        }
        data.totalTokens = 0
        data.formattedTokens = {}
        BlocksoftCryptoLog.log('EthScannerProcessor._get ERC20 tokens ' + JSON.stringify(data.tokens))
        if (typeof data.tokens !== 'undefined') {
            let token
            for (token of data.tokens) {
                data.formattedTokens[token.contract.toLowerCase()] = token
            }
        }
        return data
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalance(address) {
        BlocksoftCryptoLog.log('EthScannerProcessor.getBalance started', address)
        // noinspection JSUnresolvedVariable
        const balance = await this._web3.eth.getBalance(address)
        return { balance, unconfirmed: 0, provider: 'web3' }
    }

    /**
     * @param {string} address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactions(address) {
        BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions started', address)

        address = address.toLowerCase()
        const res = await this._get(address)
        if (res) {
            if (this._tokenAddress && typeof res.formattedTokens[this._tokenAddress] === 'undefined') {
                BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions skipped token ' + this._tokenAddress, address)
                return false
            }
            BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions trezor unify started', address)
            const transactions = await this._unifyTransactions(address, res.transactions, false, true)
            BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions trezor finished', address)
            return transactions
        } else {

            let link = this._etherscanApiPath
            let logTitle = 'EthScannerProcessor.getTransactions etherscan '
            let isInternal = false
            if (this._useInternal) {
                // noinspection EqualityComparisonWithCoercionJS
                if (typeof CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] === 'undefined' || CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] === 2) {
                    CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] = 1
                } else {
                    CACHE_GET_TRANSACTIONS_NORM_OR_INTERNAL[address] = 2
                    link = this._etherscanApiPathInternal
                    logTitle = 'EthScannerProcessor.getTransactions etherscan forInternal'
                    isInternal = true
                }
            }
            link += '&address=' + address
            BlocksoftCryptoLog.log(logTitle + ' started', link)
            const tmp = await BlocksoftAxios.getWithoutBraking(link)
            if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.result === 'undefined') {
                return []
            }
            if (typeof tmp.data.result === 'string') {
                throw new Error('Undefined txs ' + link + ' ' + tmp.data.result)
            }

            const transactions = await this._unifyTransactions(address, tmp.data.result, isInternal)

            BlocksoftCryptoLog.log(logTitle + ' finished', address)
            return transactions
        }
    }


    /**
     * @param {string} address
     * @param {*} result[]
     * @param {boolean} isInternal
     * @returns {Promise<[{UnifiedTransaction}]>}
     * @private
     */
    async _unifyTransactions(address, result, isInternal, isTrezor = false) {
        const transactions = []
        if (!result) {
            return []
        }
        let tx
        for (tx of result) {
            try {
                let transaction
                if (isTrezor) {
                    transaction = await this._unifyTransactionTrezor(address, tx, isInternal)
                } else {
                    transaction = await this._unifyTransaction(address, tx, isInternal)
                }
                if (transaction) {
                    transactions.push(transaction)
                }
            } catch (e) {
                BlocksoftCryptoLog.error('EthScannerProcessor._unifyTransaction error ' + e.message + ' on ' + (isTrezor ? 'Trezor' : 'usual') + ' tx ' + JSON.stringify(tx))
            }
        }
        return transactions
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.txid: "0xdbbce8ace9ecfa2bcd2a5ff54590a9f3b9c445c1111f1b9404ec33ef2314a864"
     * @param {string} transaction.vin[].addresses[]
     * @param {string} transaction.vin[].isAddress
     * @param {string} transaction.vout[].addresses[]
     * @param {string} transaction.vout[].isAddress
     * @param {string} transaction.blockHash: "0xf31e629dea39a96da1ff977fc991552c5f131c4b544a87fbea0533e985ce7e69"
     * @param {string} transaction.blockHeight: 9409918
     * @param {string} transaction.confirmations: 78610
     * @param {string} transaction.blockTime: 1580737403
     * @param {string} transaction.value: "12559200000000000"
     * @param {string} transaction.fees: "69854400000000"
     * @param {string} transaction.ethereumSpecific.status 1
     * @param {string} transaction.ethereumSpecific.nonce 42458
     * @param {string} transaction.ethereumSpecific.gasLimit 150000
     * @param {string} transaction.ethereumSpecific.gasUsed 21000
     * @param {string} transaction.ethereumSpecific.gasPrice "3326400000"
     * @param {array} transaction.tokenTransfers
     * @param {string} transaction.tokenTransfers[].type "ERC20"
     * @param {string} transaction.tokenTransfers[].from "0x8b661361be29e688dda65b323526ad536c8b3997"
     * @param {string} transaction.tokenTransfers[].to "0xa00ed7686c380740fe2adb141136c217b90c5ca5"
     * @param {string} transaction.tokenTransfers[].token "0xdac17f958d2ee523a2206206994597c13d831ec7"
     * @param {string} transaction.tokenTransfers[].name "Tether USD"
     * @param {string} transaction.tokenTransfers[].symbol "USDT"
     * @param {string} transaction.tokenTransfers[].decimals 6
     * @param {string} transaction.tokenTransfers[].value "1000000"
     * @private
     */
    async _unifyTransactionTrezor(address, transaction, isInternal = false) {
        let fromAddress = ''
        address = address.toLowerCase()
        if (typeof transaction.vin[0] !== 'undefined' && transaction.vin[0].addresses && typeof transaction.vin[0].addresses[0] !== 'undefined') {
            fromAddress = transaction.vin[0].addresses[0].toLowerCase()
        }
        let toAddress = ''
        if (typeof transaction.vout[0] !== 'undefined' && transaction.vout[0].addresses && typeof transaction.vout[0].addresses[0] !== 'undefined') {
            toAddress = transaction.vout[0].addresses[0].toLowerCase()
        }
        let amount = transaction.value

        if (this._tokenAddress) {
            if (typeof transaction.tokenTransfers === 'undefined') {
                return false
            }
            let tmp
            let found = false
            amount = BlocksoftUtils.toBigNumber(0)
            for (tmp of transaction.tokenTransfers) {
                if (tmp.token.toLowerCase() === this._tokenAddress.toLowerCase()) {
                    tmp.from = tmp.from.toLowerCase()
                    tmp.to = tmp.to.toLowerCase()
                    if (tmp.to !== address && tmp.from !== address ) {
                        continue
                    }
                    if (tmp.to === address) {
                        fromAddress = tmp.from
                        amount = amount.add(BlocksoftUtils.toBigNumber(tmp.value))
                    } else if (tmp.from === address) {
                        toAddress = tmp.to
                        amount = amount.sub(BlocksoftUtils.toBigNumber(tmp.value))
                    }
                    found = true
                }
            }
            amount = amount.toString()
            if (amount < 0) {
                amount = -1 * amount
                fromAddress = address
            } else {
                toAddress = address
            }
            if (!found) {
                return  false
            }
        }

        if (typeof transaction.blockTime === 'undefined') {
            throw new Error(' no transaction.blockTime error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.blockTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.blockTime)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockHeight] = transaction.blockHash


        let blockHash = false
        if (typeof transaction.blockHash !== 'undefined') {
            blockHash = transaction.blockHash
        }
        const confirmations = transaction.confirmations
        if (confirmations > 0 && transaction.blockHeight > CACHE_GET_MAX_BLOCK.max_block_number) {
            CACHE_GET_MAX_BLOCK.max_block_number = transaction.blockHeight
            CACHE_GET_MAX_BLOCK.confirmations = confirmations
        }
        let transactionStatus = 'new'

        if (blockHash) {
            if (transaction.ethereumSpecific.status === 1) {
                if (confirmations > this._blocksToConfirm) {
                    transactionStatus = 'success'
                } else if (confirmations > 0) {
                    transactionStatus = 'confirming'
                }
            } else {
                transactionStatus = 'fail'
            }
        }

        const tx = {
            transaction_hash: transaction.txid,
            block_hash: blockHash ? blockHash : '',
            block_number: +transaction.blockHeight,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: (address.toLowerCase() === fromAddress.toLowerCase()) ? 'outcome' : 'income',
            address_from: fromAddress,
            address_to: toAddress,
            address_amount: amount,
            transaction_status: transactionStatus,
            contract_address: '',
            input_value: ''
        }
        if (!isInternal) {
            const additional = {
                nonce: transaction.ethereumSpecific.nonce,
                gas: transaction.ethereumSpecific.gasLimit,
                gasPrice: transaction.ethereumSpecific.gasPrice,
                gasUsed: transaction.ethereumSpecific.gasUsed
            }
            tx.transaction_json = JSON.stringify(additional)
            tx.transaction_fee = transaction.fees
        }
        return tx
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.blockNumber 4673230
     * @param {string} transaction.timeStamp 1512376529
     * @param {string} transaction.hash
     * @param {string} transaction.nonce
     * @param {string} transaction.blockHash
     * @param {string} transaction.transactionIndex
     * @param {string} transaction.from
     * @param {string} transaction.to
     * @param {string} transaction.value
     * @param {string} transaction.gas
     * @param {string} transaction.gasPrice
     * @param {string} transaction.isError
     * @param {string} transaction.txreceipt_status
     * @param {string} transaction.input
     * @param {string} transaction.type
     * @param {string} transaction.contractAddress
     * @param {string} transaction.cumulativeGasUsed
     * @param {string} transaction.gasUsed
     * @param {string} transaction.confirmations
     * @param {boolean} isInternal
     * @return {UnifiedTransaction}
     * @protected
     */
    async _unifyTransaction(address, transaction, isInternal = false) {
        if (typeof transaction.timeStamp === 'undefined') {
            throw new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timeStamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timeStamp)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (isInternal) {
            if (transaction.contractAddress !== '') {
                return false
            }
            if (transaction.type !== 'call') {
                return false
            }

            if (typeof CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] === 'undefined') {
                const data = await this._web3.eth.getTransaction(transaction.hash)
                CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = data.blockHash
            }
            transaction.blockHash = CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber]
            // noinspection PointlessArithmeticExpressionJS
            transaction.confirmations = CACHE_GET_MAX_BLOCK.max_block_number - transaction.blockNumber + 1 * CACHE_GET_MAX_BLOCK.confirmations
        } else {
            CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = transaction.blockHash
        }

        const confirmations = transaction.confirmations
        if (confirmations > 0 && transaction.blockNumber > CACHE_GET_MAX_BLOCK.max_block_number) {
            CACHE_GET_MAX_BLOCK.max_block_number = transaction.blockNumber
            CACHE_GET_MAX_BLOCK.confirmations = confirmations
        }
        let transactionStatus = 'new'
        if (typeof transaction.txreceipt_status === 'undefined' || transaction.txreceipt_status === '1') {
            if (confirmations > this._blocksToConfirm) {
                transactionStatus = 'success'
            } else if (confirmations > 0) {
                transactionStatus = 'confirming'
            }
        } else if (transaction.isError !== '0') {
            transactionStatus = 'fail'
        }
        if (isInternal) {
            transactionStatus = 'internal_' + transactionStatus
        }

        const tx = {
            transaction_hash: transaction.hash,
            block_hash: transaction.blockHash,
            block_number: +transaction.blockNumber,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: (address.toLowerCase() === transaction.from.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.from,
            address_to: transaction.to,
            address_amount: transaction.value,
            transaction_status: transactionStatus,
            contract_address: transaction.contractAddress.toLowerCase(),
            input_value: transaction.input
        }
        if (!isInternal) {
            const additional = {
                nonce: transaction.nonce,
                gas: transaction.gas,
                gasPrice: transaction.gasPrice,
                cumulativeGasUsed: transaction.cumulativeGasUsed,
                gasUsed: transaction.gasUsed,
                transactionIndex: transaction.transactionIndex
            }
            tx.transaction_json = JSON.stringify(additional)
            tx.transaction_fee = BlocksoftUtils.toBigNumber(transaction.gasUsed).mul(BlocksoftUtils.toBigNumber(transaction.gasPrice)).toString()
        }
        return tx
    }
}
