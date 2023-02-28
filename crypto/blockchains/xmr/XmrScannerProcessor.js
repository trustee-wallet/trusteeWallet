/**
 * @version 0.11
 * https://api.mymonero.com:8443/get_address_info
 */

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'

import MoneroUtilsParser from './ext/MoneroUtilsParser'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'

const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {}
const NEVER_LOGIN = {}
let CACHE_SHOWN_ERROR = 0

export default class XmrScannerProcessor {

    /**
     * @private
     */
    _serverUrl = false

    _blocksToConfirm = 30

    _maxBlockNumber = 500000000

    constructor(settings) {
        this._settings = settings
    }

    async _getCache(address, additionalData, walletHash) {
        if (typeof CACHE[address] !== 'undefined') {
            CACHE[address].provider = 'mymonero-cache-all'
            return CACHE[address]
        } else {
            return false
        }

    }

    /**
     * @param address
     * @param additionalData
     * @param walletHash
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _get(address, additionalData, walletHash) {
        BlocksoftCryptoLog.log('XMR XmrScannerProcessor._get ' + walletHash + ' ' + address)
        const now = new Date().getTime()
        if (typeof CACHE[address] !== 'undefined' && (now - CACHE[address].time < CACHE_VALID_TIME)) {
            CACHE[address].provider = 'mymonero-cache'
            return CACHE[address]
        }

        //@todo nodes support
        //this._serverUrl = await settingsActions.getSetting('xmrServer')
        //if (!this._serverUrl || this._serverUrl === 'false') {
        this._serverUrl = 'api.mymonero.com:8443'
        //}

        let link = this._serverUrl.trim()
        if (link.substr(0, 4).toLowerCase() !== 'http') {
            link = 'https://' + this._serverUrl
        }
        if (link[link.length - 1] !== '/') {
            link = link + '/'
        }

        const discoverFor = {
            addressToCheck: address,
            walletHash: walletHash,
            currencyCode: 'XMR',
            derivationPath: 'm/44\'/0\'/0\'/0/0',
            derivationIndex: typeof additionalData.derivationIndex !== 'undefined' ? additionalData.derivationIndex : 0
        }

        const result = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'XmrScannerProcessor') // privateSpend_privateView
        const keys = result.privateKey.split('_')
        const spendKey = keys[0] // private spend and view keys
        let viewKey = keys[1]
        while (viewKey.length < 64) {
            viewKey += '0'
        }
        const linkParams = { address: address, view_key: viewKey }


        let res = false
        try {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrScannerProcessor._get start ' + link + 'get_address_info', JSON.stringify(linkParams))
            res = await BlocksoftAxios.post(link + 'get_address_info', linkParams)
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrScannerProcessor._get error ' + e.message, JSON.stringify(linkParams))
            if (CACHE_SHOWN_ERROR === 0 && e.message.indexOf('invalid address and/or view key') !== -1) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title:  strings('modal.walletLog.sorry'),
                    description: strings('settings.walletList.needReinstallXMR')
                })
                CACHE_SHOWN_ERROR++
                if (CACHE_SHOWN_ERROR > 100) {
                    CACHE_SHOWN_ERROR = 0
                }
            }
        }
        if (!res || !res.data) {
            if (typeof NEVER_LOGIN[address] === 'undefined') {
                const linkParamsLogin = {
                    address: address,
                    view_key: viewKey,
                    create_account: true,
                    generated_locally: true
                }
                try {
                    await BlocksoftAxios.post('https://api.mymonero.com:8443/login', linkParamsLogin) // login needed
                } catch (e) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrScannerProcessor._get login error ' + e.message, linkParamsLogin)
                    if (CACHE_SHOWN_ERROR === 0 && e.message.indexOf('invalid address and/or view key') !== -1) {
                        showModal({
                            type: 'INFO_MODAL',
                            icon: false,
                            title:  strings('modal.walletLog.sorry'),
                            description: strings('settings.walletList.needReinstallXMR')
                        })
                        CACHE_SHOWN_ERROR++
                        if (CACHE_SHOWN_ERROR > 100) {
                            CACHE_SHOWN_ERROR = 0
                        }
                    }
                }
            }
            return false
        }
        if (typeof res.data.spent_outputs === 'undefined') {
            throw new Error('XMR XmrScannerProcessor._get nothing loaded for address ' + link)
        }

        let parsed = false
        try {
            parsed = await MoneroUtilsParser.parseAddressInfo(address, res.data, viewKey, additionalData.publicSpendKey, spendKey)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XMR XmrScannerProcessor._get MoneroUtilsParser.parseAddressInfo error ' + e.message)
            }
            await BlocksoftCryptoLog.log('XMR XmrScannerProcessor._get MoneroUtilsParser.parseAddressInfo error ' + e.message)
        }

        const res2 = await BlocksoftAxios.postWithoutBraking(link + 'get_address_txs', linkParams)
        if (!res2 || !res2.data) {
            return false
        }

        let parsed2 = false
        try {
            parsed2 = await MoneroUtilsParser.parseAddressTransactions(address, res2.data, viewKey, additionalData.publicSpendKey, spendKey)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XMR XmrScannerProcessor._get MoneroUtilsParser.parseAddressTransactions error ' + e.message)
            }
            await BlocksoftCryptoLog.log('XMR XmrScannerProcessor._get MoneroUtilsParser.parseAddressTransactions error ' + e.message)
        }

        if (parsed && parsed2) {
            CACHE[address] = {
                outputs: parsed?.spent_outputs,
                transactions: typeof parsed2.serialized_transactions !== 'undefined' ? parsed2.serialized_transactions : parsed2.transactions,
                balance: typeof parsed.total_received_String !== 'undefined' ? BlocksoftUtils.diff(parsed.total_received_String, parsed.total_sent_String) : BlocksoftUtils.diff(parsed.total_received, parsed.total_sent),
                account_scan_start_height: parsed2.account_scan_start_height,
                scanned_block_height: parsed2.account_scanned_block_height,
                account_scanned_height: parsed2.account_scanned_height,
                blockchain_height: parsed2.blockchain_height,
                transaction_height: parsed2.transaction_height,
                time: now,
                provider: 'mymonero'
            }
            return CACHE[address]
        }
        return false
    }

    /**
     * @param {string} address
     * @param {*} additionalData
     * @param {string} walletHash
     * @return {Promise<{balance:*, unconfirmed:*, provider:string}>}
     */
    async getBalanceBlockchain(address, additionalData, walletHash) {
        if (address === 'invalidRecheck1') {
            return  { balance: 0, unconfirmed: 0, provider: 'error'}
        }
        const res = await this._get(address, additionalData, walletHash)
        if (!res) {
            return false
        }
        return { balance: res.balance, unconfirmed: 0, provider: res.provider, time: res.time }
    }

    /**
     * @param {string} scanData.account.address
     * @param {*} scanData.additional
     * @param {string} scanData.account.walletHash
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData, source = '') {
        const address = scanData.account.address.trim()
        if (address === 'invalidRecheck1') {
            return []
        }
        const additionalData = scanData.additional
        const walletHash = scanData.account.walletHash
        const res = await this._get(address, additionalData, walletHash)
        if (!res || typeof res === 'undefined') return []

        if (typeof res.transactions === 'undefined' || !res.transactions) return []
        let tx
        const transactions = []

        for (tx of res.transactions) {
            const transaction = await this._unifyTransaction(address, res.scanned_block_height, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {string} lastBlock
     * @param {Object} transaction
     * @param {BigInteger} transaction.amount BigInteger {_d: Array(2), _s: -1}
     * @param {string} transaction.approx_float_amount -0.00002724
     * @param {string} transaction.coinbase false
     * @param {string} transaction.fee "27240000"
     * @param {string} transaction.hash "ac319a3240f15dab342102fe248d3b95636f8a0bbfa962a5645521fac8fb86d3"
     * @param {string} transaction.height 2152183
     * @param {string} transaction.id 10506991
     * @param {string} transaction.mempool: false
     * @param {string} transaction.mixin 10
     * @param {string} transaction.payment_id ""
     * @param {string} transaction.spent_outputs [{…}]
     * @param {string} transaction.timestamp Tue Jul 28 2020 18:10:26 GMT+0300 (Восточная Европа, летнее время) {}
     * @param {string} transaction.total_received "12354721582"
     * @param {BigInteger} transaction.total_sent BigInteger {_d: Array(2), _s: 1}
     * @param {string} transaction.unlock_time
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    async _unifyTransaction(address, lastBlock, transaction) {

        let transactionStatus = 'new'
        transaction.confirmations = lastBlock * 1 - transaction.height * 1
        //if (transaction.mempool === false) {
            if (transaction.confirmations >= this._blocksToConfirm) {
                transactionStatus = 'success'
            } else if (transaction.confirmations > 0) {
                transactionStatus = 'confirming'
            }
        // }

        if (typeof transaction.unlock_time !== 'undefined') {
            const unlockTime = transaction.unlock_time * 1
            if (unlockTime > 0) {
                if (unlockTime < this._maxBlockNumber) {
                    // then unlock time is block height
                    if (unlockTime > lastBlock) {
                        transactionStatus = 'locked'
                    }
                } else {
                    // then unlock time is s timestamp as TimeInterval
                    const now = new Date().getTime()
                    if (unlockTime > now) {
                        transactionStatus = 'locked'
                    }
                }
            }
        }

        let direction = 'self'
        let amount
        if (transaction.total_received !== '0') {
            if (transaction.total_sent !== '0') {
                const diff = BlocksoftUtils.diff(transaction.total_sent, transaction.total_received)
                if (diff > 0) {
                    direction = 'outcome'
                    amount = diff
                } else {
                    direction = 'income'
                    amount = -1 * diff
                }
            } else {
                direction = 'income'
                amount = transaction.total_received
            }
        } else if (transaction.total_sent !== '0') {
            direction = 'outcome'
            amount = transaction.total_sent
        }
        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }

        return {
            transactionHash: transaction.hash,
            blockHash: transaction.id,
            blockNumber: +transaction.height,
            blockTime: formattedTime,
            blockConfirmations: transaction.confirmations,
            transactionDirection: direction,
            addressFrom: '',
            addressTo: '',
            addressAmount: amount,
            transactionStatus: transactionStatus,
            transactionFee: transaction.fee
        }
    }
}
