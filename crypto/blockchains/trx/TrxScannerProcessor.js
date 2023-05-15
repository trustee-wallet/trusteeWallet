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
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import TronStakeUtils from '@crypto/blockchains/trx/ext/TronStakeUtils'


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

    async isMultisigBlockchain(address) {
        address = address.trim()
        let addressHex = address
        if (address.substr(0, 1) === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        }
        return this._trongridProvider.isMultisigTrongrid(addressHex)
    }

    /**
     * https://developers.tron.network/reference#addresses-accounts
     * @param {string} address
     * @return {Promise<{balance, frozen, frozenEnergy, balanceStaked, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address, jsonData, walletHash, source) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' from ' + source)
        let addressHex = address
        if (address.substr(0, 1) === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        } else {
            address = await TronUtils.addressHexToStr(addressHex)
        }
        const useTronscan = BlocksoftExternalSettings.getStatic('TRX_USE_TRONSCAN') * 1 > 0
        let result = false
        let subresult = false
        if (useTronscan) {
            result = await this._tronscanProvider.get(address, this._tokenName, source === 'AccountScreen')
            BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronScan ' + JSON.stringify(result) + ' from ' + source)
        }

        if (result === false || result === 0) {
            if (this._tokenName !== '_' && this._tokenName.substr(0, 1) === 'T') {
                // https://developers.tron.network/docs/trc20-contract-interaction#balanceof
                try {
                    const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
                    const params = {
                        "contract_address": await TronUtils.addressToHex(this._tokenName),
                        "function_selector": "balanceOf(address)",
                        "parameter": "0000000000000000000000" + addressHex,
                        "owner_address": addressHex
                    }
                    const tmp = await BlocksoftAxios.post(sendLink + '/wallet/triggerconstantcontract', params)
                    if (typeof tmp.data !== 'undefined' && typeof tmp.data.constant_result !== 'undefined') {
                        BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronwallet ' + JSON.stringify(tmp.data) + ' from ' + source)
                        return { balance: BlocksoftUtils.hexToDecimal('0x' + tmp.data.constant_result), unconfirmed: 0, provider: 'tronwallet-raw-call' }
                    }
                } catch (e) {
                    BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' error tronwallet ' + e.message)
                }
                result = await this._tronscanProvider.get(address, this._tokenName)
            } else {
                result = await this._trongridProvider.get(addressHex, this._tokenName, source === 'AccountScreen')
            }
            BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronGrid ' + JSON.stringify(result) + ' from ' + source)
        }

        if (result === false && this._tokenName !== '_') {

            subresult = await this._tronscanProvider.get(address, '_', source === 'AccountScreen')
            BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' result tronScan2 ' + JSON.stringify(result) + ' from ' + source)

            if (subresult !== false) {
                BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getBalanceBlockchain address ' + address + ' subresult tronScan ' + JSON.stringify(subresult) + ' from ' + source)
                return { balance: 0, unconfirmed: 0, balanceStaked : 0, balanceAvailable : 0, provider: 'tronscan-ok-but-no-token' }
            }
        }
        result.balanceStaked = typeof result.frozen !== 'undefined' ? (result.frozen * 1 + result.frozenEnergy * 1) : 0
        if (typeof result.unfrozen !== 'undefined') {
            result.balanceStaked += result.unfrozen * 1 + result.unfrozenEnergy * 1
        }
        if (typeof result.frozenOld !== 'undefined') {
            result.balanceStaked += result.frozenOld * 1 + result.frozenOldEnergy * 1
        }
        if (typeof result.frozenOthers !== 'undefined') {
            result.balanceStaked += result.frozenOthers * 1 + result.frozenEnergyOthers * 1
        }
        result.balanceAvailable = result.balance
        if (result.balanceStaked * 1 > 0) {
            result.balance = result.balance * 1 + result.balanceStaked * 1
        }
        return result
    }


    /**
     * @param {string} address
     * @return {Promise<*>}
     */
    async getResourcesBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._tokenName + ' TrxScannerProcessor getResourcesBlockchain address ' + address)
        let addressHex = address
        if (address.substr(0, 1) === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        }
        const result = await this._trongridProvider.getResources(addressHex, this._tokenName)
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
        CACHE_PENDING_TXS = scanData.resetTime || 0
        if (typeof scanData.specialActionNeeded !== 'undefined' && scanData.specialActionNeeded && typeof scanData.account.address !== 'undefined') {
            await Database.query(`
                    UPDATE transactions SET special_action_needed='' 
                    WHERE special_action_needed='${scanData.specialActionNeeded}'
                    AND address_from_basic='${scanData.account.address}'
                    `)
        }
        return false
    }

    async getTransactionsPendingBlockchain(scanData, source, lastBlock = false) {
        if (CACHE_PENDING_TXS > 0 && CACHE_PENDING_TXS - new Date().getTime() < 60000) {
            return false
        }
        // id, transaction_hash, block_number, block_confirmations, transaction_status,
        const sql = `SELECT t.id, 
            t.wallet_hash AS walletHash,
            t.transaction_hash AS transactionHash,
            t.transactions_scan_log AS transactionsScanLog, 
            t.address_from_basic AS addressFromBasic,
            t.special_action_needed AS specialActionNeeded,
            a.derivation_path AS derivationPath
            FROM transactions AS t
            LEFT JOIN account AS a ON a.address = t.address_from_basic
            WHERE 
            (t.currency_code='${this._settings.currencyCode}' OR t.currency_code LIKE 'TRX%')
            AND t.transaction_of_trustee_wallet=1
            AND (t.block_number IS NULL OR t.block_number<20 OR t.special_action_needed='vote' OR t.special_action_needed='vote_after_unfreeze')
            
            ORDER BY created_at DESC
            LIMIT 10
        `
        const res = await Database.query(sql)
        if (!res || typeof res.array === 'undefined' || !res.array || res.array.length === 0) {
            CACHE_PENDING_TXS = new Date().getTime()
            return false
        }

        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        let needUpdateBalance = -1
        if (lastBlock === false) {
            needUpdateBalance = 0
            try {
                const link2 = sendLink + '/wallet/getnowblock'
                const block = await BlocksoftAxios.get(link2)
                if (typeof block !== 'undefined' && block && typeof block.data !== 'undefined') {
                    lastBlock = block.data.block_header.raw_data.number
                }
            } catch (e1) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain lastBlock', e1)
                }
            }
        }

        const unique = {}
        for (const row of res.array) {
            const linkRecheck = sendLink + '/wallet/gettransactioninfobyid'
            try {
                const recheck = await BlocksoftAxios.post(linkRecheck, {
                    value: row.transactionHash
                })
                if (typeof recheck.data !== 'undefined') {
                    const isSuccess = await this._unifyFromReceipt(recheck.data, row, lastBlock)
                    if (isSuccess && needUpdateBalance === 0) {
                        needUpdateBalance = 1
                    }
                    if (isSuccess && row.specialActionNeeded && row.addressFromBasic) {
                         row.confirmations = lastBlock - recheck.data.blockNumber
                        if (typeof unique[row.addressFromBasic] === 'undefined') {
                            unique[row.addressFromBasic] = row
                        } else {
                            if (unique[row.addressFromBasic].confirmations > row.confirmations) {
                                unique[row.addressFromBasic].confirmations = row.confirmations
                            }
                            if (unique[row.addressFromBasic].specialActionNeeded === 'vote_after_unfreeze') {
                                unique[row.addressFromBasic].specialActionNeeded = row.specialActionNeeded
                            }
                        }

                    }
                }
            } catch (e1) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain recheck', e1)
                }
            }
        }

        if (unique) {
            for (const address in unique) {
                const {walletHash, derivationPath, confirmations, specialActionNeeded } = unique[address]
                if (confirmations < 20) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain vote all skipped by ' + confirmations + ' for ' + address)
                    continue
                }

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain vote all inited for ' + address + ' action ' + specialActionNeeded)
                try {
                    if (await TronStakeUtils.sendVoteAll(address, derivationPath, walletHash, specialActionNeeded, confirmations)) {
                        await Database.query(`
                    UPDATE transactions SET special_action_needed='' WHERE special_action_needed='vote' OR special_action_needed='vote_after_unfreeze'
                    AND address_from_basic='${address}'
                    `)
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain vote all finished for ' + address)
                    }
                } catch (e) {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain vote all error for ' + address + ' ' + e.message)
                    }
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxScannerProcessor.getTransactionsPendingBlockchain vote all error for ' + address + ' ' + e.message)
                }
            }
        }

        return needUpdateBalance > 0
    }

    async _unifyFromReceipt(transaction, row, lastBlock) {
        /**
         * {"id":"fb7580e4bb6161e0812beb05cf4a1b6463ba55e33def5dd7f3f5c1561c91a49e","blockNumber":29134019,"blockTimeStamp":1617823467000,
         * "receipt":{'origin_energy_usage":4783,"energy_usage_total":4783,"net_usage":345,"result":"OUT_OF_ENERGY'},
         * "result":"FAILED"
         */
        if (typeof transaction.blockNumber === 'undefined' || transaction.blockNumber * 1 <= 1) return false

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
            transactionsScanLog: new Date().toISOString() + ' RECEIPT RECHECK ' + JSON.stringify(transaction) + ' ' + row.transactionsScanLog
        }, row.id, 'receipt')
        return transactionStatus === 'success'
    }
}
