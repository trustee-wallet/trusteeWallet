/**
 * @version 0.43
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import SolTmpDS from './stores/SolTmpDS'

import config from '@app/config/config'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const CACHE_FROM_DB = {}
let CACHE_LAST_BLOCK = 0

export default class SolScannerProcessor {

    constructor(settings) {
        this._settings = settings
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     * https://docs.solana.com/developing/clients/jsonrpc-api#getaccountinfo
     * https://docs.solana.com/developing/clients/jsonrpc-api#getconfirmedsignaturesforaddress2
     * curl https://solana-api.projectserum.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getBalance", "params":["9mnBdsuL1x24HbU4oeNDBAYVAGg2vVndkRAc18kPNqCJ"]}'
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address)

        let balance = 0
        try {
            const data = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getBalance',
                'params': [address]
            }
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const res = await BlocksoftAxios._request(apiPath, 'POST', data)
            if (typeof res.data.result === 'undefined' || typeof res.data.result.value === 'undefined') {
                return false
            }
            if (typeof res.data.result.context !== 'undefined' && typeof res.data.result.context.slot !== 'undefined') {
                CACHE_LAST_BLOCK = res.data.result.context.slot * 1
            }
            balance = res.data.result.value
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address + ' error ' + e.message)
            return false
        }
        return { balance, unconfirmed: 0, provider: 'solana-api' }
    }


    /**
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     * https://docs.solana.com/developing/clients/jsonrpc-api#getsignaturesforaddress
     * curl https://api.mainnet-beta.solana.com  -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0","id": 1,"method": "getConfirmedSignaturesForAddress2","params": ["9mnBdsuL1x24HbU4oeNDBAYVAGg2vVndkRAc18kPNqCJ",{"limit": 1}]}'
     */
    async getTransactionsBlockchain(scanData, source) {
        const address = scanData.account.address.trim()
        try {
            if (typeof CACHE_FROM_DB[address] === 'undefined') {
                CACHE_FROM_DB[address] = await SolTmpDS.getCache(address)
            }

            const data = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getConfirmedSignaturesForAddress2',
                'params': [
                    address,
                    {
                        'limit': 100
                    }
                ]
            }
            if (CACHE_FROM_DB[address] && typeof CACHE_FROM_DB[address]['last_hash'] !== 'undefined') {
                data.params[1].until = CACHE_FROM_DB[address]['last_hash']
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
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getTransactionsBlockchain address ' + address + ' error ' + e.message)
            return false
        }
    }

    async _unifyTransactions(address, result) {
        const transactions = []
        let lastHash = false
        for (const tx of result) {
            try {
                const transaction = await this._unifyTransaction(address, tx)
                if (transaction) {
                    transactions.push(transaction)
                    if (transaction.transactionStatus === 'success' && !lastHash) {
                        lastHash = transaction.transactionHash
                    }
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransactions ' + tx.signature + ' error ' + e.message)
                }
                e.message += ' while _unify ' + tx.signature
                throw e
            }
        }

        if (lastHash) {
            if (!CACHE_FROM_DB[address]) {
                CACHE_FROM_DB[address] = { 'last_hash': lastHash }
                await SolTmpDS.saveCache(address, 'last_hash', lastHash)
            } else if (typeof CACHE_FROM_DB[address]['last_hash'] === 'undefined') {
                CACHE_FROM_DB[address]['last_hash'] = lastHash
                await SolTmpDS.saveCache(address, 'last_hash', lastHash)
            } else {
                CACHE_FROM_DB[address]['last_hash'] = lastHash
                await SolTmpDS.updateCache(address, 'last_hash', lastHash)
            }
        }
        return transactions
    }


    async _unifyTransaction(address, transaction) {
        /*
        {
        "blockTime": 1623178302,
        "confirmationStatus": "finalized",
        "err": null,
        "memo": null,
        "signature": "4HGoAFWdXTjhPNSb7KoMbu7U6FVWV294XcUzZkEhsH4QDjb2Uz4Cee6gDYMQfXBz1REFDN3oMw9Js7KijVPsfyQU",
        "slot": 81979566
        }

        {
            'blockTime': 1623091884,
            'meta': {
                'err': null, 'fee': 5000, 'innerInstructions': [],
                'logMessages': ['Program 11111111111111111111111111111111 invoke [1]', 'Program 11111111111111111111111111111111 success'],
                'postBalances': [1283684900, 7561, 1],
                'postTokenBalances': [],
                'preBalances': [1283699900, 0, 1],
                'preTokenBalances': [], 'rewards': [{ 'lamports': -2439, 'postBalance': 7561, 'pubkey': 'DYVo413ddGxjo46JVVxctnTfKWTzdL3ohwvAF4VUv5D', 'rewardType': 'Rent' }], 'status': { 'Ok': null }
            },
            'slot': 81835384,
            'transaction': {
                'message': {
                    'accountKeys': [
                        '9mnBdsuL1x24HbU4oeNDBAYVAGg2vVndkRAc18kPNqCJ',
                        'DYVo413ddGxjo46JVVxctnTfKWTzdL3ohwvAF4VUv5D',
                        '11111111111111111111111111111111'],
                    'header': {
                        'numReadonlySignedAccounts': 0, 'numReadonlyUnsignedAccounts': 1, 'numRequiredSignatures': 1
                    },
                    'instructions': [{ 'accounts': [0, 1], 'data': '3Bxs43ZMjSRQLs6o', 'programIdIndex': 2 }],
                    'recentBlockhash': '12pNW997Pzm6nxzYxwkX19fT4ynhKfWBeWy7NYAiUoYP'
                }, 'signatures': ['4g7uvyQNuDEmjCJ9X954RCfj3PscSbf37vZaaQiUFXgRnnuE27xe731otdCyStpi55CoLv8Qeg3XgwDY8kr4TqYf']
            }
        }
        */
        const data = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'getConfirmedTransaction',
            'params': [
                transaction.signature
            ]
        }
        const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
        const res = await BlocksoftAxios._request(apiPath, 'POST', data)
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            return false
        }
        const additional = res.data.result
        const addressFrom = additional.transaction.message.accountKeys[0]
        const addressTo = additional.transaction.message.accountKeys[1]
        const addressAmount = BlocksoftUtils.diff(additional.meta.postBalances[1], additional.meta.preBalances[1]).toString().replace('-', '')

        if (addressFrom !== address && addressTo !== address) {
            return false
        }
        if (additional.meta.logMessages[0].indexOf('Program 11111111111111111111111111111111') === -1) {
            return false
        }
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
        const blockConfirmations = CACHE_LAST_BLOCK > 0 ? Math.round(CACHE_LAST_BLOCK - additional.slot * 1) : 0
        const tx = {
            transactionHash: transaction.signature,
            blockHash: additional.transaction.message.recentBlockhash,
            blockNumber: transaction.slot,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection: addressFrom === address ? 'outcome' : 'income',
            addressFrom: addressFrom === address ? '' : addressFrom,
            addressTo: addressTo === address ? '' : addressTo,
            addressAmount,
            transactionStatus,
            transactionFee: additional.meta.fee
        }
        if (typeof transaction.memo !== 'undefined' && transaction.memo) {
            tx.transactionJson = { memo: transaction.memo }
        }
        return tx
    }
}
