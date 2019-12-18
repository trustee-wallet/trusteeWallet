/**
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import TronUtils from './ext/TronUtils'

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute

const CACHE_ERRORS_BY_LINKS = {}

const CACHE_VALID_TIME = 30000 // 30 seconds

const CACHE_TRONGRID = {}
const CACHE_TRONSCAN = {}
const CACHE_OF_TRANSACTIONS = {}


class TrxScannerProcessor {

    constructor(settings) {
        this._transactionsTronscanPath = 'https://api.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=50&address='

        this._infoTrongridPath = 'https://api.trongrid.io/wallet/getnodeinfo'

        this._balanceTrongridPath = 'https://api.trongrid.io/walletsolidity/getaccount?address='
        this._balanceTronscanPath = 'https://apilist.tronscan.org/api/account?address='

        this._tronLastBlock = 0

        this._tokenName = '_'
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
        }

        this._doLastBlock()

    }

    /**
     * @param {string} address
     * @return {Promise<{balance:*, provider:string}>}
     * https://developers.tron.network/reference#addresses-accounts
     */
    async getBalance(address) {
        address = address.trim()
        let addressHex = address
        if (address[0] === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        } else {
            address = await TronUtils.addressHexToStr(addressHex)
        }

        let now = new Date().getTime()
        let balance = 0


        let cacheIsOk = false
        try {
            if (typeof (CACHE_TRONSCAN[address]) !== 'undefined' && (now - CACHE_TRONSCAN[address]['time']) < CACHE_VALID_TIME) {
                cacheIsOk = true
                if (typeof (CACHE_TRONSCAN[address][this._tokenName]) != 'undefined') {
                    BlocksoftCryptoLog.log('TrxScannerProcessor.getBalance from cache tronscan', address + ' => ' + this._tokenName + ' : ' + CACHE_TRONSCAN[address][this._tokenName])
                    return { balance: CACHE_TRONSCAN[address][this._tokenName], provider: 'tronscan-cache' }
                }
            }

            let res = false
            if (!cacheIsOk) {
                res = await BlocksoftAxios.get(this._balanceTronscanPath + address)
            }
            if (res && res.data && res.data) {
                CACHE_TRONSCAN[address] = {}
                CACHE_TRONSCAN[address]['time'] = now
                CACHE_TRONSCAN[address]['_'] = res.data.balance
                if (res.data.tokenBalances) {
                    for (let token of res.data.tokenBalances) {
                        CACHE_TRONSCAN[address][token.name] = token.balance
                    }
                }
                if (res.data.trc20token_balances) {
                    for (let token of res.data.trc20token_balances) {
                        CACHE_TRONSCAN[address][token.contract_address] = token.balance
                    }
                }
            }
            if (typeof (CACHE_TRONSCAN[address][this._tokenName]) !== 'undefined') {
                balance = CACHE_TRONSCAN[address][this._tokenName]
                return { balance, provider: 'tronscan' }
            }
        } catch (e) {
            BlocksoftCryptoLog.log('TrxScannerProcessor.getBalance error ' + address + ' => ' + this._tokenName + ' ' + e.message)
        }


        cacheIsOk = false
        if (typeof (CACHE_TRONGRID[address]) !== 'undefined' && (now - CACHE_TRONGRID[address]['time']) < CACHE_VALID_TIME) {
            cacheIsOk = true
            if (typeof (CACHE_TRONGRID[address][this._tokenName]) != 'undefined') {
                BlocksoftCryptoLog.log('TrxScannerProcessor.getBalance from cache trongrid', address + ' => ' + this._tokenName + ' : ' + CACHE_TRONGRID[address][this._tokenName])
                return { balance: CACHE_TRONGRID[address][this._tokenName], provider: 'trongrid-cache' }
            }
        }

        let res = false
        if (!cacheIsOk) {
            res = await BlocksoftAxios.get(this._balanceTrongridPath + addressHex)
        }
        if (res && res.data && res.data.balance) {
            CACHE_TRONGRID[address] = {}
            CACHE_TRONGRID[address]['time'] = now
            CACHE_TRONGRID[address]['_'] = res.data.balance
            if (res.data.assetV2) {
                for (let token of res.data.assetV2) {
                    CACHE_TRONGRID[address][token.key] = token.value
                }
            }
            if (typeof (CACHE_TRONGRID[address][this._tokenName]) !== 'undefined') {
                balance = CACHE_TRONGRID[address][this._tokenName]
            }
            BlocksoftCryptoLog.log('TrxScannerProcessor.getBalance finished', address + ' => ' + this._tokenName + ' : ' + balance)
        }
        return { balance, unconfirmed: 0, provider: 'trongrid' }
    }

    async _doLastBlock() {
        try {
            let info = await BlocksoftAxios.get(this._infoTrongridPath)
            info = info.data.block.split(',ID')
            info = info[0].substr(4) * 1
            if (info > this._tronLastBlock) {
                this._tronLastBlock = info
            }
            BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions currentBlock ' + info)
        } catch (e) {
            BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions currentBlock error ' + e.message)
        }
    }

    /**
     * @param {string} address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactions(address) {
        await this._doLastBlock()

        address = address.trim()
        let now = new Date().getTime()
        if (typeof (CACHE_OF_TRANSACTIONS[address]) !== 'undefined' && (now - CACHE_OF_TRANSACTIONS[address]['time']) < CACHE_VALID_TIME) {
            if (typeof (CACHE_OF_TRANSACTIONS[address][this._tokenName]) === 'undefined') {
                BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions from cache', address + ' => ' + this._tokenName + ' nothing')
                return []
            } else {
                BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions from cache', address + ' => ' + this._tokenName + ' tx count ' + CACHE_OF_TRANSACTIONS[address][this._tokenName].length)
                return CACHE_OF_TRANSACTIONS[address][this._tokenName]
            }
        }

        BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions started', address)
        let link = this._transactionsTronscanPath + address

        if (this._tokenName[0] === 'T') {
            link = 'https://apilist.tronscan.org/api/contract/events?sort=-timestamp&count=true&limit=50&contract=' + this._tokenName + '&address=' + address
        }

        let tmp = ''
        try {
            // noinspection JSUnresolvedFunction
            tmp = await BlocksoftAxios.get(link)
        } catch (e) {
            let now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS[link] === 'undefined' || CACHE_ERRORS_BY_LINKS[link] === 0 || (now - CACHE_ERRORS_BY_LINKS[link] > CACHE_ERRORS_VALID_TIME)) {
                e.code = 'ERROR_SILENT'
            } else {
                e.code = 'ERROR_PROVIDER'
            }
            CACHE_ERRORS_BY_LINKS[link] = now
            throw e
        }
        CACHE_ERRORS_BY_LINKS[link] = 0

        if (typeof (tmp.data.data) === 'undefined') {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(tmp.data))
        }

        let transactions
        if (this._tokenName[0] === 'T') {
            transactions = await this._unifyTransactionsTRC20(address, tmp.data.data)
        } else {
            transactions = await this._unifyTransactions(address, tmp.data.data)
        }
        BlocksoftCryptoLog.log('TrxScannerProcessor.getTransactions finished', address)
        return transactions
    }

    async _unifyTransactions(address, result) {
        CACHE_OF_TRANSACTIONS[address] = {}
        CACHE_OF_TRANSACTIONS[address]['time'] = new Date().getTime()
        CACHE_OF_TRANSACTIONS[address][this._tokenName] = []
        for (let tx of result) {
            let transaction = await this._unifyTransaction(address, tx)
            if (!transaction) continue;
            let tokenName = '_'
            if (typeof (tx.contractData.contract_address) != 'undefined') {
                tokenName = tx.contractData.contract_address
            } else if (typeof (tx.contractData.asset_name) != 'undefined') {
                tokenName = tx.contractData.asset_name
            }
            if (typeof (CACHE_OF_TRANSACTIONS[address][tokenName]) === 'undefined') {
                CACHE_OF_TRANSACTIONS[address][tokenName] = []
            }
            CACHE_OF_TRANSACTIONS[address][tokenName].push(transaction)
        }
        return CACHE_OF_TRANSACTIONS[address][this._tokenName]
    }


    async _unifyTransactionsTRC20(address, result) {
        let transactions = []
        for (let tx of result) {

            let transaction_status = 'new'
            if (tx.confirmed) {
                transaction_status = 'success'
            } else if (tx.block > 0) {
                transaction_status = 'fail'
            }

            let formattedTime
            try {
                formattedTime = BlocksoftUtils.toDate(tx.timestamp / 1000)
            } catch (e) {
                e.message += ' timestamp error transaction data ' + JSON.stringify(tx)
                throw e
            }
            if (typeof(tx.amount) == 'undefined') {
                BlocksoftCryptoLog.err('TrxScannerProcessor _unifyTransactionsTRC20 buggy tx ' + JSON.stringify(tx))
            }
            transactions.push({
                transaction_hash: tx.transactionHash,
                block_hash: '',
                block_number: tx.block,
                block_time: formattedTime,
                block_confirmations: this._tronLastBlock - tx.block,
                transaction_direction: (address.toLowerCase() === tx.transferFromAddress.toLowerCase()) ? 'outcome' : 'income',
                address_from: tx.transferFromAddress,
                address_to: tx.transferToAddress,
                address_amount: typeof(tx.amount) != 'undefined' ? tx.amount : 0,
                transaction_status,
                transaction_fee: 0,
                input_value: tx.data
            })
        }
        return transactions
    }

    async _unifyTransaction(address, transaction) {
        let transaction_status = 'new'
        if (transaction.confirmed) {
            if (typeof (transaction.contractRet) === 'undefined') {
                transaction_status = 'success'
            } else if (transaction.contractRet === 'SUCCESS') {
                transaction_status = 'success'
            } else {
                transaction_status = 'fail'
            }
        } else if (transaction.block > 0) {
            transaction_status = 'fail'
        }

        if (typeof (transaction.timestamp) === 'undefined') {
            new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.timestamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (typeof(transaction.contractData.amount) == 'undefined') {
            if (typeof transaction.contractType != 'undefined' && transaction.contractType === 31) {
                //skip here
            } else {
                BlocksoftCryptoLog.err('TrxScannerProcessor _unifyTransaction buggy tx ' + JSON.stringify(transaction))
            }
            return false
        }
        return {
            transaction_hash: transaction.hash,
            block_hash: '',
            block_number: transaction.block,
            block_time: formattedTime,
            block_confirmations: this._tronLastBlock - transaction.block,
            transaction_direction: (address.toLowerCase() === transaction.ownerAddress.toLowerCase()) ? 'outcome' : 'income',
            address_from: transaction.ownerAddress,
            address_to: transaction.toAddress,
            address_amount: typeof(transaction.contractData.amount) != 'undefined' ? transaction.contractData.amount : 0,
            transaction_status,
            transaction_fee: 0,
            input_value: transaction.data
        }
    }
}

module.exports.TrxScannerProcessor = TrxScannerProcessor

module.exports.init = function(settings) {
    return new TrxScannerProcessor(settings)
}
