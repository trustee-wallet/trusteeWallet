import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const Web3 = require('web3')

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute

const CACHE_ERRORS_BY_LINKS = {

}

class EthScannerProcessor {

    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthScannerProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthScannerProcessor requires settings.network')
        }
        BlocksoftCryptoLog.logDivider()
        BlocksoftCryptoLog.log('EthScannerProcessor init started', settings.currencyCode)
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            case 'kovan' :
            case 'rinkeby' :
            case 'goerli' :
                // noinspection JSUnresolvedVariable
                this._web3 = new Web3(new Web3.providers.HttpProvider(`https://${settings.network}.infura.io/v3/478e48mushyfgsdfryumlrynh`))
                this._etherscanSuffix = (settings.network === 'mainnet') ? '' : ('-' + settings.network)
                this._etherscanApiPath = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&action=txlist&apikey=YourApiKeyToken`
                break
            default:
                throw new Error('while retrieving Ethereum address - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", rinkeby". Got : ' + settings.network)
        }
        BlocksoftCryptoLog.log('EthScannerProcessor inited')
    }

    /**
     * @param {string} address
     * @return {Promise<int>}
     */
    async getBalance(address) {
        // noinspection JSUnresolvedVariable
        let balance = await this._web3.eth.getBalance(address)
        BlocksoftCryptoLog.log('EthScannerProcessor.getBalance finished', address + ' => ' + balance)
        return balance
    }

    /**
     * @param {string} address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactions(address) {
        address = address.trim()
        BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions started', address)
        let link = `${this._etherscanApiPath}&address=${address}`
        let tmp = ''
        try {
            // noinspection JSUnresolvedFunction
            tmp = await BlocksoftAxios.get(link)
        } catch (e) {
            let now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS[link] === 'undefined' || CACHE_ERRORS_BY_LINKS[link] === 0 || (time - CACHE_ERRORS_BY_LINKS[link] > CACHE_ERRORS_VALID_TIME)) {
                e.code = 'ERROR_SILENT'
            } else {
                e.code = 'ERROR_PROVIDER'
            }
            CACHE_ERRORS_BY_LINKS[link] = now
            throw e
        }
        CACHE_ERRORS_BY_LINKS[link] = 0

        if (typeof (tmp.data.result) === 'undefined') {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(tmp.data))
        }
        if (typeof (tmp.data.result) === 'string') {
            throw new Error('Undefined txs ' + link + ' ' + tmp.data.res)
        }
        let transactions = []
        for (let tx of tmp.data.result) {
            let transaction = this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('EthScannerProcessor.getTransactions finished', address)
        return transactions
    }

    _unifyTransaction(address, transaction) {
        let transaction_status = 'fail'
        if (typeof(transaction.txreceipt_status) === 'undefined') {
            if (transaction.confirmations > 1) {
                transaction_status = 'success'
            }
        } else if (transaction.txreceipt_status === '1' && transaction.isError === '0') {
            transaction_status = 'success'
        }

        if (transaction.timeStamp === "undefined") {
            new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timeStamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timeStamp)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        return {
            transaction_hash: transaction.hash,
            block_hash: transaction.blockHash,
            block_number: +transaction.blockNumber,
            block_time: formattedTime,
            block_confirmations: +transaction.confirmations,
            transaction_direction: (address.toLowerCase() === transaction.from.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.from,
            address_to: transaction.to,
            address_amount: transaction.value,
            transaction_status,
            transaction_fee: transaction.cumulativeGasUsed,

            contract_address: transaction.contractAddress,
            input_value: transaction.input,

            transaction_json: JSON.stringify({
                nonce: transaction.nonce,
                cumulativeGasUsed: transaction.cumulativeGasUsed,
                gasUsed: transaction.gasUsed,
                transactionIndex: transaction.transactionIndex
            })
        }
    }
}

module.exports.EthScannerProcessor = EthScannerProcessor

module.exports.init = function(settings) {
    return new EthScannerProcessor(settings)
}
