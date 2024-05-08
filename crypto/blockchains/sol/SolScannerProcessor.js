/**
 * @version 0.52
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import SolTmpDS from '@crypto/blockchains/sol/stores/SolTmpDS'

import config from '@app/config/config'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'

const CACHE_FROM_DB = {}
const CACHE_TXS = {}
const CACHE_VALID_TIME = 120000
let CACHE_LAST_BLOCK = 0

export default class SolScannerProcessor {

    constructor(settings) {
        this._settings = settings
        this.tokenAddress = typeof settings.tokenAddress !== 'undefined' ? settings.tokenAddress : ''
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     * https://docs.solana.com/developing/clients/jsonrpc-api#getaccountinfo
     * https://docs.solana.com/developing/clients/jsonrpc-api#getconfirmedsignaturesforaddress2
     * curl https://solana-api.projectserum.com -X POST -H "Content-Type: application/json" -d '{'jsonrpc":"2.0", "id":1, "method":"getBalance", "params":["9mnBdsuL1x24HbU4oeNDBAYVAGg2vVndkRAc18kPNqCJ']}'
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
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getBalanceBlockchain address ' + address + ' error ' + e.message)
            return false
        }
        return { balance, unconfirmed: 0, provider: 'solana-api' }
    }


    /**
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     * https://docs.solana.com/developing/clients/jsonrpc-api#getsignaturesforaddress
     * curl https://api.mainnet-beta.solana.com  -X POST -H "Content-Type: application/json" -d '{'jsonrpc": "2.0","id": 1,"method": "getConfirmedSignaturesForAddress2","params": ["9mnBdsuL1x24HbU4oeNDBAYVAGg2vVndkRAc18kPNqCJ",{"limit': 1}]}'
     */
    async getTransactionsBlockchain(scanData, source) {
        const address = scanData.account.address.trim()
        const lastHashVar = address + this.tokenAddress
        this._cleanCache()
        try {
            if (typeof CACHE_FROM_DB[lastHashVar] === 'undefined') {
                CACHE_FROM_DB[lastHashVar] = await SolTmpDS.getCache(lastHashVar)
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
            if (CACHE_FROM_DB[lastHashVar] && typeof CACHE_FROM_DB[lastHashVar]['last_hash'] !== 'undefined') {
                data.params[1].until = CACHE_FROM_DB[lastHashVar]['last_hash']
            }
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const res = await BlocksoftAxios._request(apiPath, 'POST', data)
            if (typeof res.data.result === 'undefined' || !res.data.result) {
                return false
            }

            const transactions = await this._unifyTransactions(address, res.data.result, lastHashVar)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor.getTransactions finished ' + address)
            return transactions
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor getTransactionsBlockchain address ' + address + ' error ' + e.message)
            return false
        }
    }

    async _unifyTransactions(address, result, lastHashVar) {
        const transactions = []
        let lastHash = false
        let hasError = false
        for (const tx of result) {
            try {
                const transaction = await this._unifyTransaction(address, tx)
                if (transaction) {
                    transactions.push(transaction)
                    if (transaction.transactionStatus === 'success' && !lastHash && !hasError) {
                        lastHash = transaction.transactionHash
                    }
                }
            } catch (e) {
                hasError = true
                if (e.message.indexOf('request failed') === -1) {
                    if (config.debug.appErrors) {
                        console.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransactions ' + tx.signature + ' error ' + e.message)
                    }
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransactions ' + tx.signature + ' error ' + e.message)
                }
            }
        }

        if (lastHash) {
            if (!CACHE_FROM_DB[lastHashVar]) {
                CACHE_FROM_DB[lastHashVar] = { 'last_hash': lastHash }
                await SolTmpDS.saveCache(lastHashVar, 'last_hash', lastHash)
            } else if (typeof CACHE_FROM_DB[lastHashVar]['last_hash'] === 'undefined') {
                CACHE_FROM_DB[lastHashVar]['last_hash'] = lastHash
                await SolTmpDS.saveCache(lastHashVar, 'last_hash', lastHash)
            } else {
                CACHE_FROM_DB[lastHashVar]['last_hash'] = lastHash
                await SolTmpDS.updateCache(lastHashVar, 'last_hash', lastHash)
            }
        }
        return transactions
    }

    _cleanCache() {
        const now = new Date().getTime()
        for (const key in CACHE_TXS) {
            const t = (now - CACHE_TXS[key].now)
            if (t > CACHE_VALID_TIME) {
                delete CACHE_TXS[key]
            }
        }
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
                CACHE_TXS[transaction.signature] = {data : additional, now : new Date().getTime() }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' SolScannerProcessor._unifyTransaction ' + transaction.signature + ' request error ' + e.message)
                }
                throw e
            }
        } else {
            additional = CACHE_TXS[transaction.signature].data
        }

        let addressFrom = false
        let addressTo = false
        let addressAmount = 0
        let anyFromAddress = false
        let anyToAddress = false

        const indexedPre = {}
        const indexedPost = {}
        const indexedCreated = {}
        const indexedAssociated = {}

        if (this.tokenAddress) {
            for (const tmp of additional.meta.preTokenBalances) {
                if (tmp.mint !== this.tokenAddress) continue
                const realIndex = tmp.accountIndex
                indexedPre[realIndex] = tmp.uiTokenAmount.amount
            }

            for (const tmp of additional.meta.postTokenBalances) {
                if (tmp.mint !== this.tokenAddress) continue
                const realIndex = tmp.accountIndex
                indexedPost[realIndex] = tmp.uiTokenAmount.amount
            }

            for (const tmp of additional.transaction.message.instructions) {
                if (tmp.program !== 'spl-associated-token-account') continue
                indexedCreated[tmp.parsed.info.account] = tmp.parsed.info.wallet
            }

            for (let i = 0, ic = additional.transaction.message.accountKeys.length; i < ic; i++) {
                const tmpAddress = additional.transaction.message.accountKeys[i]
                if (tmpAddress.pubkey === '11111111111111111111111111111111') continue
                const sourceAssociatedTokenAddress = await SolUtils.findAssociatedTokenAddress(
                    tmpAddress.pubkey,
                    this.tokenAddress
                )
                indexedAssociated[sourceAssociatedTokenAddress] = tmpAddress
            }
        } else {
            // do nothing!
        }

        let anySigner = false
        let addressAmountPlus = false
        for (let i = 0, ic = additional.transaction.message.accountKeys.length; i < ic; i++) {
            let tmpAddress = additional.transaction.message.accountKeys[i]
            if (tmpAddress.pubkey === '11111111111111111111111111111111') continue
            let tmpAmount = '0'
            if (typeof indexedAssociated[tmpAddress.pubkey] !== 'undefined') {
                tmpAddress = indexedAssociated[tmpAddress.pubkey]
            }
            if (this.tokenAddress) {
                const to = typeof indexedPost[i] !== 'undefined' ? indexedPost[i] : 0
                const from = typeof indexedPre[i] !== 'undefined' ? indexedPre[i] : 0
                tmpAmount = BlocksoftUtils.diff(to, from).toString()
            } else {
                tmpAmount = BlocksoftUtils.diff(additional.meta.postBalances[i], additional.meta.preBalances[i]).toString()
            }

            if (tmpAddress.pubkey && tmpAddress.signer) {
                anySigner = tmpAddress.pubkey
            }

            if (tmpAmount === '0') continue

            if (tmpAddress.pubkey === address ||
                (
                    typeof indexedCreated[tmpAddress.pubkey] !== 'undefined' && indexedCreated[tmpAddress.pubkey] === address
                )
            ) {
                if (tmpAmount.indexOf('-') === -1) {
                    addressTo = tmpAddress.pubkey
                    addressAmount = tmpAmount
                    addressAmountPlus = true
                } else {
                    addressFrom = tmpAddress.pubkey
                    addressAmount = tmpAmount.replace('-', '')
                }
            } else {
                if (tmpAddress.signer) {
                    anyFromAddress = tmpAddress.pubkey
                } else {
                    anyToAddress = tmpAddress.pubkey
                }
            }
        }

        if (!addressFrom && anySigner !== addressTo) {
            addressFrom = anySigner
        }
        if (!addressFrom && !addressTo) {
            return false
        }
        if (anyFromAddress && !addressFrom) {
            addressFrom = anyFromAddress
        }
        if (anyToAddress && !addressTo) {
            addressTo = anyToAddress
        }
        if (!addressTo) {
            addressTo = 'System'
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
            blockHash: additional.transaction.message.recentBlockhash,
            blockNumber: transaction.slot,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection,
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
