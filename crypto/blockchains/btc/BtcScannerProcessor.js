/**
 * @version 0.9
 */

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import BtcFindAddressFunction from './basic/BtcFindAddressFunction'
import config from '@app/config/config'
import Database from '@app/appstores/DataSource/Database'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'

const CACHE_VALID_TIME = 60000 // 60 seconds
const CACHE = {}
const CACHE_WALLET_PUBS = {}

const TIMEOUT_BTC = 60000
const PROXY_TXS = 'https://proxy.trustee.deals/btc/getTxs'

export default class BtcScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 1

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

    /**
     * @private
     */
    _trezorServer = false

    constructor(settings) {
        this._settings = settings
    }

    /**
     * @param address
     * @param additionalData
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _get(address, additionalData, source = '') {
        const now = new Date().getTime()
        if (typeof CACHE[address] !== 'undefined' && (now - CACHE[address].time < CACHE_VALID_TIME)) {
            CACHE[address].provider = 'trezor-cache'
            return CACHE[address]
        }
        BlocksoftCryptoLog.log('BtcScannerProcessor._get ' + address + ' from ' + source + ' started')

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.Scanner._get')

        const prefix = address.substr(0, 4)

        let link = ''
        let res = false
        if (prefix === 'xpub' || prefix === 'zpub' || prefix === 'ypub') {
            link = PROXY_TXS + '?address=' + address + '&type=xpub&currencyCode=' + this._settings['currencyCode']
            res = await BlocksoftAxios.getWithoutBraking(link, 5, TIMEOUT_BTC)
            if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.data !== 'undefined') {
                res.data = res.data.data
            } else {
                link = this._trezorServer + '/api/v2/xpub/' + address + '?details=txs&gap=9999&tokens=used&pageSize=40'
                try {
                    res = await BlocksoftAxios._request(link, 'get', false, false, true, TIMEOUT_BTC)
                } catch (e) {
                    if (e.message.indexOf('"error":"internal server error"') !== -1) {
                        CACHE[address] = {
                            data: {
                                balance: 0,
                                unconfirmedBalance: 0,
                                addresses: [],
                                specialMark: 'badServer'
                            },
                            time: now,
                            provider: 'trezor-badserver'
                        }
                        return CACHE[address]
                    }
                }
            }
        } else {
            link = PROXY_TXS + '?address=' + address + '&currencyCode=' + this._settings['currencyCode']
            res = await BlocksoftAxios.getWithoutBraking(link, 5, TIMEOUT_BTC)
            if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.data !== 'undefined') {
                res.data = res.data.data
            } else {
                link = this._trezorServer + '/api/v2/address/' + address + '?details=txs&gap=9999&pageSize=80'
                res = await BlocksoftAxios.getWithoutBraking(link, 5, TIMEOUT_BTC)
            }
        }

        if (!res || !res.data) {
            await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
            CACHE[address] = {
                data: false,
                time: now,
                provider: 'trezor-empty'
            }
            return false
        }
        if (typeof res.data.balance === 'undefined') {
            throw new Error(this._settings.currencyCode + ' BtcScannerProcessor._get nothing loaded for address ' + link)
        }

        const addresses = {}
        let plainAddresses = {}
        if (additionalData && additionalData.addresses) {
            plainAddresses = additionalData.addresses
        }
        if (typeof res.data.tokens !== 'undefined') {
            let token
            for (token of res.data.tokens) {
                addresses[token.name] = {
                    balance: token.balance,
                    transactions: token.transfers,
                    path : token.path
                }
                plainAddresses[token.name] = token.path
            }
        } else {
            plainAddresses[address] = 1
        }
        res.data.addresses = addresses
        res.data.plainAddresses = plainAddresses
        CACHE[address] = {
            data: res.data,
            time: now,
            provider: 'trezor'
        }
        return CACHE[address]
    }

    async _getPubs(walletHash) {
        if (typeof CACHE_WALLET_PUBS[walletHash] !== 'undefined') {
            return CACHE_WALLET_PUBS[walletHash]
        }
        const sqlPub = `SELECT wallet_pub_value as walletPub
                    FROM wallet_pub
                    WHERE wallet_hash = '${walletHash}'
                    AND currency_code='BTC'`
        const resPub = await Database.query(sqlPub)
        CACHE_WALLET_PUBS[walletHash] = {}
        if (resPub && resPub.array && resPub.array.length > 0) {
            for (const row of resPub.array) {
                const scanAddress = row.walletPub
                CACHE_WALLET_PUBS[walletHash][scanAddress] = 1
            }
        }
        return CACHE_WALLET_PUBS[walletHash]
    }

    /**
     * @param {string} address
     * @return {Promise<{balance:*, unconfirmed:*, provider:string}>}
     */
    async getBalanceBlockchain(address, data, walletHash, source = '') {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getBalance started ' + address)
        const res = await this._get(address, data, source)
        if (!res) {
            return false
        }
        return {
            address : address,
            balance: res.data.balance,
            unconfirmed: res.data.unconfirmedBalance,
            provider: res.provider,
            time: res.time,
            addresses: res.data.addresses,
            specialMark : typeof res.data.specialMark !== 'undefined' ? res.data.specialMark : false
        }
    }

    async getAddressesBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        const data = scanData.additional
        const withBalances = typeof scanData.withBalances !== 'undefined' && scanData.withBalances
        if (!withBalances) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BtcScannerProcessor.getAddresses started withoutBalances (KSU!)', address)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getAddresses started withoutBalances (KSU!)', address)
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getAddresses started withBalances', address)
        }
        let res = await this._get(address, data, source)
        if (typeof res.data !== 'undefined') {
            res = JSON.parse(JSON.stringify(res.data))
        } else {
            res = false
        }
        try {
            if (typeof data.walletPub !== 'undefined') {
                const resPub = await this._getPubs(data.walletPub.walletHash)
                for (const scanAddress in resPub) {
                    if (scanAddress === address) continue
                    const tmp = await this._get(scanAddress, data, source + ' _getPubs1')
                    if (typeof tmp.data === 'undefined' || typeof tmp.data.plainAddresses === 'undefined') continue
                    if (res === false || typeof res.plainAddresses === 'undefined') {
                        res = JSON.parse(JSON.stringify(tmp.data))
                    } else {
                        if (withBalances) {
                            for (const row in tmp.data.addresses) {
                                res.addresses[row] = tmp.data.addresses[row]
                            }
                        } else {
                            for (const row in tmp.data.plainAddresses) {
                                res.plainAddresses[row] = tmp.data.plainAddresses[row]
                            }
                        }
                    }

                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BtcScannerProcessor.getAddresses load from all addresses error ' + e.message, e)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getAddresses load from all addresses error ' + e.message)
        }
        return withBalances ? res.addresses : res.plainAddresses
    }

    /**
     * @param {string} scanData.account.address
     * @param {*} scanData.additional
     * @param {string} scanData.account.walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        const data = scanData.additional

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getTransactions started ' + address)
        let res = await this._get(address, data, source)
        if (typeof res.data !== 'undefined') {
            res = JSON.parse(JSON.stringify(res.data))
        } else {
            res = false
        }
        try {
            if (typeof data.walletPub !== 'undefined') {
                const resPub = await this._getPubs(data.walletPub.walletHash)
                for (const scanAddress in resPub) {
                    if (scanAddress === address) continue
                    const tmp = await this._get(scanAddress, data, source + ' _getPubs2')
                    if (typeof tmp.data === 'undefined' || typeof tmp.data.transactions === 'undefined') continue
                    if (res === false || typeof res.transactions === 'undefined') {
                        res = JSON.parse(JSON.stringify(tmp.data))
                    } else {
                        for (const row of tmp.data.transactions) {
                            res.transactions.push(row)
                        }
                    }
                }
            } else {
                for (const scanAddress in data.addresses) {
                    if (scanAddress === address) continue
                    const tmp = await this._get(scanAddress, data, source + ' _getOnes2')
                    if (typeof tmp.data === 'undefined' || typeof tmp.data.transactions === 'undefined') continue
                    if (res === false || typeof res.transactions === 'undefined') {
                        res = tmp.data
                    } else {
                        for (const row of tmp.data.transactions) {
                            res.transactions.push(row)
                        }
                    }
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BtcScannerProcessor.getTransactions load from all addresses error ' + e.message, e)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getTransactions load from all addresses error ' + e.message)
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getTransactions loaded from ' + res.provider + ' ' + res.time)

        if (typeof res.transactions === 'undefined' || !res.transactions) return []
        const transactions = []
        const addresses = res.plainAddresses
        if (typeof data !== 'undefined' && data && typeof data.addresses !== 'undefined') {
            for (const tmp in data.addresses) {
                addresses[tmp] = data.addresses[tmp]
            }
        }
        if (typeof scanData.additional.addresses !== 'undefined') {
            for (const tmp in scanData.additional.addresses) {
                address[tmp] = tmp
            }
        }

        const vinsOrder = {}
        for (const tx of res.transactions) {
            vinsOrder[tx.txid] = tx.blockTime
        }

        let plussed = false
        let i = 0
        do {
            for (const tx of res.transactions) {
                if (typeof tx.vin === 'undefined' || tx.vin.length === 0) continue
                for (const vin of tx.vin) {
                    if (typeof vinsOrder[vin.txid] === 'undefined') {
                        continue
                    }
                    const newTime = vinsOrder[vin.txid] + 1
                    if (tx.blockTime < newTime) {
                        tx.blockTime = newTime
                        plussed = true
                    }
                    vinsOrder[tx.txid] = tx.blockTime
                }
            }
            i++
        } while (plussed && i < 100)

        const uniqueTxs = {}
        for (const tx of res.transactions) {
            const transaction = await this._unifyTransaction(address, addresses, tx)
            if (transaction) {
                if (typeof uniqueTxs[transaction.transactionHash] !== 'undefined') continue
                uniqueTxs[transaction.transactionHash] = 1
                transactions.push(transaction)
            }
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcScannerProcessor.getTransactions finished ' + address + ' total: ' + transactions.length)
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {string} addresses
     * @param {Object} transaction
     * @param {string} transaction.txid c6b4c3879196857bed7fd5b553dd0049486c032d6a1be72b98fda967ca54b2da
     * @param {string} transaction.version 1
     * @param {string} transaction.vin[].txid aa31777a9db759f57fd243ef47419939f233d16bc3e535e9a1c5af3ace87cb54
     * @param {string} transaction.vin[].sequence 4294967294
     * @param {string} transaction.vin[].n 0
     * @param {string} transaction.vin[].addresses [ 'DFDn5QyHH9DiFBNFGMcyJT5uUpDvmBRDqH' ]
     * @param {string} transaction.vin[].value 44400000000
     * @param {string} transaction.vin[].hex 47304402200826f97d3432452abedd4346553de0b0c2d401ad7056b155e6462484afd98aa902202b5fb3166b96ded33249aecad7c667c0870c1
     * @param {string} transaction.vout[].value 59999824800
     * @param {string} transaction.vout[].n 0
     * @param {string} transaction.vout[].spent true
     * @param {string} transaction.vout[].hex 76a91456d49605503d4770cf1f32fbfb69676d9a72554f88ac
     * @param {string} transaction.vout[].addresses  [ 'DD4DKVTEkRUGs7qzN8b7q5LKmoE9mXsJk4' ]
     * @param {string} transaction.blockHash fc590834c04812e1c7818024a94021e12c4d8ab905724b4a4fdb4d4732878f69
     * @param {string} transaction.blockHeight 3036225
     * @param {string} transaction.confirmations 8568
     * @param {string} transaction.blockTime 1577362993
     * @param {string} transaction.value 59999917700
     * @param {string} transaction.valueIn 59999917700
     * @param {string} transaction.fees 0
     * @param {string} transaction.hex 010000000654cb87ce3aafc5a1e935e5c36bd133f239
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    async _unifyTransaction(address, addresses, transaction) {
        let showAddresses = false
        try {
            showAddresses = await BtcFindAddressFunction(addresses, transaction)
        } catch (e) {
            e.message += ' transaction hash ' + JSON.stringify(transaction) + ' address ' + address
            throw e
        }

        let transactionStatus = 'new'
        if (transaction.confirmations >= this._blocksToConfirm) {
            transactionStatus = 'success'
        } else if (transaction.confirmations > 0) {
            transactionStatus = 'confirming'
        }

        let transactionFilterType = TransactionFilterTypeDict.USUAL
        if (typeof showAddresses.to !== 'undefined' && showAddresses.to.toLowerCase().indexOf('simple send') !== -1) {
            transactionFilterType = TransactionFilterTypeDict.FEE
        }

        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.blockTime)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }

        return {
            transactionHash: transaction.txid,
            blockHash: transaction.blockHash,
            blockNumber: +transaction.blockHeight,
            blockTime: formattedTime,
            blockConfirmations: transaction.confirmations,
            transactionDirection: showAddresses.direction,
            addressFrom: showAddresses.from,
            addressTo: showAddresses.to,
            addressAmount: showAddresses.value,
            transactionStatus: transactionStatus,
            transactionFee: transaction.fees,
            transactionFilterType
        }
    }
}
