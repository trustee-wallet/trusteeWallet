/**
 * @version 0.11
 */
import Database from '@app/appstores/DataSource/Database';

import transactionDS from '../appstores/DataSource/Transaction/Transaction'

import BlocksoftFixBalance from '../../crypto/common/BlocksoftFixBalance'

class DaemonCache {

    CACHE_WALLET_COUNT = 0

    CACHE_WALLET_SUMS = {}
    CACHE_WALLET_TOTAL = { balance: 0, unconfirmed: 0 }
    CACHE_RATES = {}
    CACHE_ALL_ACCOUNTS = {}
    CACHE_FIO_MEMOS = {}

    CACHE_ACCOUNT_TX = {}

    /**
     * @param walletHash
     * @returns {{unconfirmed: number, balance: number, basicCurrencySymbol: string}}
     */
    getCache(walletHash = false) {
        if (!walletHash) {
            return this.CACHE_WALLET_TOTAL
        }
        if (typeof this.CACHE_WALLET_SUMS[walletHash] === 'undefined') return false
        return this.CACHE_WALLET_SUMS[walletHash]
    }

    /**
     * @param {string} currencyCode
     * @returns {{basicCurrencySymbol: string, basicCurrencyRate: number}}
     */
    getCacheRates(currencyCode) {
        if (typeof this.CACHE_RATES[currencyCode] === 'undefined') {
            return { basicCurrencySymbol: '', basicCurrencyRate: '' }
        }
        return this.CACHE_RATES[currencyCode]
    }

    cleanCacheTxsCount(account) {
        let cacheTitle = account.walletHash + '_' + account.currencyCode
        if (typeof this.CACHE_ACCOUNT_TX[cacheTitle] !== 'undefined') {
            this.CACHE_ACCOUNT_TX[cacheTitle] = -1
        }
        cacheTitle += '_noZero'
        if (typeof this.CACHE_ACCOUNT_TX[cacheTitle] !== 'undefined') {
            this.CACHE_ACCOUNT_TX[cacheTitle] = -1
        }
    }

    getFioMemo(currencyCode) {
        return this.CACHE_FIO_MEMOS[currencyCode] ?? {}
    }

    async _getFromDB(walletHash, currencyCode) {
        const sql = ` SELECT balance_fix AS balanceFix, balance_txt AS balanceTxt FROM account_balance WHERE currency_code='${currencyCode}' AND wallet_hash='${walletHash}'`
        const res = await Database.query(sql)
        if (!res || !res.array || res.array.length === 0) {
            return {balance : 0, from : 'noDb'}
        }
        let account
        let totalBalance = 0
        for (account of res.array) {
            const balance = BlocksoftFixBalance(account, 'balance')
            if (balance > 0) {
                totalBalance += balance
            }
        }
        return {balance : totalBalance, from : 'sumDb'}
    }

    async getCacheAccount(walletHash, currencyCode) {
        if (typeof this.CACHE_ALL_ACCOUNTS[walletHash] === 'undefined') {
            return this._getFromDB(walletHash, currencyCode)
        }
        if (typeof this.CACHE_ALL_ACCOUNTS[walletHash][currencyCode] === 'undefined') {
            return this._getFromDB(walletHash, currencyCode)
        }
        return this.CACHE_ALL_ACCOUNTS[walletHash][currencyCode]
    }

    getCacheAccountStatic(walletHash, currencyCode) {
        if (typeof this.CACHE_ALL_ACCOUNTS[walletHash] === 'undefined' || typeof this.CACHE_ALL_ACCOUNTS[walletHash][currencyCode] === 'undefined') {
            return {balance : '0'}
        }
        return this.CACHE_ALL_ACCOUNTS[walletHash][currencyCode]
    }
}

const single = new DaemonCache()
export default single
