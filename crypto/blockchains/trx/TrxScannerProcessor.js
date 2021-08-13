/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import TronUtils from './ext/TronUtils'
import TrxTronscanProvider from './basic/TrxTronscanProvider'
import TrxTrongridProvider from './basic/TrxTrongridProvider'
import TrxTransactionsProvider from './basic/TrxTransactionsProvider'
import TrxTransactionsTrc20Provider from './basic/TrxTransactionsTrc20Provider'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import Database from '@app/appstores/DataSource/Database/main'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import config from '@app/config/config'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'

let CACHE_PENDING_TXS = false

export default class TrxScannerProcessor {

    constructor(settings) {
        this._settings = settings
        this._tokenName = '_'
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
        }
        this._tronscanProvider = new TrxTronscanProvider()
        this._trongridProvider = new TrxTrongridProvider()
        this._transactionsProvider = new TrxTransactionsProvider()
        this._transactionsTrc20Provider = new TrxTransactionsTrc20Provider()
    }

    /**
     * https://developers.tron.network/reference#addresses-accounts
     * @param {string} address
     * @return {Promise<{balance, frozen, frozenEnergy, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address)
        let addressHex = address
        if (address.substr(0, 1) === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        } else {
            address = await TronUtils.addressHexToStr(addressHex)
        }
        let result = await this._tronscanProvider.get(address, this._tokenName)
        let subresult = false
        BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronScan ' + JSON.stringify(result))

        if (result === false) {
            subresult = await this._tronscanProvider.get(address, '_')
            result = await this._trongridProvider.get(addressHex, this._tokenName)
            BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronGrid ' + JSON.stringify(result))
        }

        if (result === false && this._tokenName !== '_') {
            if (subresult !== false) {
                BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' subresult tronScan ' + JSON.stringify(subresult))
                return { balance: 0, unconfirmed: 0, provider: 'tronscan-ok-but-no-token' }
            }
        }
        return result
    }


    /**
     * https://github.com/jakeonchain/tron-wallet-chrome/blob/fecea42771cc5cbda3fada4a1c8cfe8de251c008/src/App.js
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData, source) {
        let result
        let lastBlock = false
        if (this._tokenName[0] === 'T') {
            this._transactionsTrc20Provider.setLink(this._tokenName)
            result = await this._transactionsTrc20Provider.get(scanData, this._tokenName)
            lastBlock = this._transactionsTrc20Provider._lastBlock
        } else {
            result = await this._transactionsProvider.get(scanData, this._tokenName)
            lastBlock = this._transactionsProvider._lastBlock
        }
        await this.getTransactionsPendingBlockchain(scanData, source, lastBlock)
        return result
    }

    async resetTransactionsPendingBlockchain(scanData, source, lastBlock = false) {
        CACHE_PENDING_TXS = false
        return false
    }

    async getTransactionsPendingBlockchain(scanData, source, lastBlock = false) {
        if (CACHE_PENDING_TXS === 'none') {
            return false
        }
        // id, transaction_hash, block_number, block_confirmations, transaction_status,
        const sql = `SELECT id, transaction_hash AS transactionHash, transactions_scan_log AS transactionsScanLog
            FROM transactions
            WHERE 
            ((currency_code='${this._settings.currencyCode}' OR currency_code LIKE 'TRX%')
            AND transaction_of_trustee_wallet=1
            AND (block_number IS NULL OR block_number=0)
            )
            ORDER BY created_at DESC
            LIMIT 10
        `
        const res = await Database.query(sql)
        if (!res || typeof res.array === 'undefined' || !res.array || res.array.length === 0) {
            CACHE_PENDING_TXS = 'none'
            return false
        }

        let needUpdateBalance = -1
        if (lastBlock === false) {
            needUpdateBalance = 0
            try {
                const linkBlock = 'https://api.trongrid.io/wallet/getnowblock'
                const block = await BlocksoftAxios.get(linkBlock)
                if (typeof block !== 'undefined' && block && typeof block.data !== 'undefined') {
                    lastBlock = block.data.block_header.raw_data.number
                }
            } catch (e1) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain lastBlock', e1)
                }
            }
        }

        for (const row of res.array) {
            const linkRecheck = 'https://api.trongrid.io/wallet/gettransactioninfobyid'
            try {
                const recheck = await BlocksoftAxios.post(linkRecheck, {
                    value: row.transactionHash
                })
                if (typeof recheck.data !== 'undefined') {
                    if (await this._unifyFromReceipt(recheck.data, row, lastBlock) && needUpdateBalance === 0) {
                        needUpdateBalance = 1
                    }
                }
            } catch (e1) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain recheck', e1)
                }
            }
        }

        return needUpdateBalance > 0
    }

    async _unifyFromReceipt(transaction, row, lastBlock) {
        /**
         * {"id":"fb7580e4bb6161e0812beb05cf4a1b6463ba55e33def5dd7f3f5c1561c91a49e","blockNumber":29134019,"blockTimeStamp":1617823467000,
         * "receipt":{"origin_energy_usage":4783,"energy_usage_total":4783,"net_usage":345,"result":"OUT_OF_ENERGY"},
         * "result":"FAILED"
         */
        if (typeof transaction.blockNumber === 'undefined' || transaction.blockNumber*1 <= 1) return false

        let transactionStatus = 'success'
        if (typeof transaction.result !== 'undefined' && transaction.result === 'FAILED') {
            transactionStatus = 'fail'
            if (typeof transaction.receipt !== 'undefined' && typeof transaction.receipt.result !== 'undefined') {
                if (transaction.receipt.result === 'OUT_OF_ENERGY') {
                    transactionStatus = 'out_of_energy'
                }
            }
        }
        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.blockTimeStamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction2 data ' + JSON.stringify(transaction)
            throw e
        }

        await transactionDS.saveTransaction({
            blockNumber: transaction.blockNumber,
            blockTime: formattedTime,
            blockConfirmations: lastBlock - transaction.blockNumber,
            transactionStatus,
            transactionsScanLog : new Date().toISOString() + ' RECEIPT RECHECK ' + JSON.stringify(transaction) + ' ' + row.transactionsScanLog
        }, row.id, 'receipt')
        return transactionStatus === 'success'
    }
}
