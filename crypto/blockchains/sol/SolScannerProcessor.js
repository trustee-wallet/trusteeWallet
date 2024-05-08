/**
 * @version 0.52
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import config from '@app/config/config'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'

const CACHE_TXS = {}
let CACHE_LAST_BLOCK = 0

export default class SolScannerProcessor {

    constructor(settings) {
        this._settings = settings
        this.tokenAddress = typeof settings.tokenAddress !== 'undefined' ? settings.tokenAddress : ''
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     * https://solana.com/docs/rpc/http/getbalance
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address)

        let balance = 0
        try {
            await SolUtils.getEpoch()
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const data = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getBalance',
                'params': [address]
            }
            const res = await BlocksoftAxios._request(apiPath, 'POST', data)
            if (typeof res.data.result === 'undefined' || typeof res.data.result.value === 'undefined') {
                return false
            }
            if (typeof res.data.result.context !== 'undefined' && typeof res.data.result.context.slot !== 'undefined') {
                CACHE_LAST_BLOCK = res.data.result.context.slot * 1
            }
            balance = res.data.result.value
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address + ' error ' + e.message)
            return false
        }
        return { balance, unconfirmed: 0, provider: 'solana-api' }
    }


    /**
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     * https://docs.solana.com/developing/clients/jsonrpc-api#getsignaturesforaddress
     * https://solana.com/docs/rpc/deprecated/getconfirmedsignaturesforaddress2
     **/
    async getTransactionsBlockchain(scanData, source) {
        const address = scanData.account.address.trim()
        try {
            const data = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getSignaturesForAddress',
                'params': [
                    address,
                    {
                        'limit': 1
                    }
                ]
            }

            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const res = await BlocksoftAxios._request(apiPath, 'POST', data)
            if (typeof res.data.result === 'undefined' || !res.data.result) {
                return false
            }
            const transactions = await this._unifyTransactions(address, res.data.result)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor.getTransactions finished ' + address)
            return transactions
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' SolScannerProcessor getTransactionsBlockchain address ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getTransactionsBlockchain address ' + address + ' error ' + e.message)
            return false
        }
    }

    async _unifyTransactions(address, result) {
        const transactions = []
        for (const tx of result) {
            try {
                const transaction = await this._unifyTransaction(address, tx)
                console.log(`
                
                
                
                
                
                tx `, tx)
                console.log(`
                
                =>`, transaction)
                if (transaction) {
                    transactions.push(transaction)
                }
            } catch (e) {
                if (e.message.indexOf('request failed') === -1) {
                    if (config.debug.appErrors) {
                        console.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransactions ' + tx.signature + ' error ' + e.message)
                    }
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransactions ' + tx.signature + ' error ' + e.message)
                }
            }
        }
        return transactions
    }

    async _unifyTransaction(address, transaction) {
        const data = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'getConfirmedTransaction',
            'params': [
                transaction.signature,
                {encoding : 'jsonParsed'}
            ]
        }

        let additional
        if (typeof CACHE_TXS[transaction.signature] === 'undefined') {
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            try {
                const res = await BlocksoftAxios._request(apiPath, 'POST', data)
                if (typeof res.data.result === 'undefined' || !res.data.result) {
                    return false
                }
                additional = res.data.result
                CACHE_TXS[transaction.signature] = {data : additional, now : new Date().getTime(), found : new Date().getTime() }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransaction ' + transaction.signature + ' request error ' + e.message)
                }
                throw e
            }
        } else {
            additional = CACHE_TXS[transaction.signature].data
            CACHE_TXS[transaction.signature].found = new Date().getTime()
        }

        console.log(JSON.stringify(additional))
        return false
        let addressFrom = ''
        let addressTo = ''
        let anySigner = ''
        let addressAmount = 0
        let addressAmountPlus = 0


        let formattedTime = transaction.blockTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.blockTime)
        } catch (e) {
            e.message += ' timestamp error transaction2 data ' + JSON.stringify(transaction)
            throw e
        }
        let transactionStatus = 'new'
        if (transaction.confirmationStatus === 'finalized') {
            transactionStatus = 'success'
        } else if (transaction.confirmationStatus === 'confirmed') {
            transactionStatus = 'confirming'
        }
        if (typeof transaction.err !== 'undefined' && transaction.err) {
            transactionStatus = 'fail'
        }

        let transactionDirection = addressFrom === address ? 'outcome' : 'income'
        if (!addressFrom && anySigner === addressTo) {
            if (addressAmountPlus) {
                transactionDirection = 'swap_income'
            } else {
                transactionDirection = 'swap_outcome'
            }
        }
        const blockConfirmations = CACHE_LAST_BLOCK > 0 ? Math.round(CACHE_LAST_BLOCK - additional.slot * 1) : 0
        const tx = {
            transactionHash: transaction.signature,
            blockHash: additional?.transaction?.message?.recentBlockhash,
            blockNumber: transaction.slot,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection,
            addressFrom: addressFrom === address ? '' : addressFrom,
            addressTo: addressTo === address ? '' : addressTo,
            addressAmount,
            transactionStatus,
            transactionFee: additional?.meta.fee
        }
        if (typeof transaction.memo !== 'undefined' && transaction.memo) {
            tx.transactionJson = { memo: transaction.memo }
        }
        return tx
    }
}
