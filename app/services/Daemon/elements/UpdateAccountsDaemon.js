/**
 * @version 0.9
 */
import Update from './Update'

import Log from '../../Log/Log'

import store from '../../../store'

import accountDS from '../../../appstores/DataSource/Account/Account'
import walletPubDS from '../../../appstores/DataSource/Wallet/WalletPub'

import prettyNumber from '../../../services/UI/PrettyNumber/PrettyNumber'

import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import DBInterface from '../../../appstores/DataSource/DB/DBInterface'
import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'

const CACHE_WALLET_SUMS = {}
const CACHE_WALLET_TOTAL = { balance: 0, unconfirmed: 0 }
const CACHE_RATES = {}
const CACHE_ALL_ACCOUNTS = {}

class UpdateAccountsDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountsDaemon
        this.tryCounter = 0
    }


    /**
     * @param walletHash
     * @returns {{unconfirmed: number, balance: number, basicCurrencySymbol: string}}
     */
    getCache(walletHash = false) {
        if (!walletHash) {
            return CACHE_WALLET_TOTAL
        }
        if (typeof CACHE_WALLET_SUMS[walletHash] === 'undefined') return false
        return CACHE_WALLET_SUMS[walletHash]
    }

    /**
     * @param {string} currencyCode
     * @returns {{basicCurrencySymbol: string, basicCurrencyRate: number}}
     */
    getCacheRates(currencyCode) {
        if (typeof CACHE_RATES[currencyCode] === 'undefined') {
            return { basicCurrencySymbol: '', basicCurrencyRate: '' }
        }
        return CACHE_RATES[currencyCode]
    }

    async _getFromDB(walletHash, currencyCode) {
        const dbInterface = new DBInterface()
        const sql = ` SELECT balance_fix AS balanceFix, balance_txt AS balanceTxt FROM account_balance   WHERE currency_code='${currencyCode}' AND wallet_hash='${walletHash}'`
        const res = await dbInterface.setQueryString(sql).query()
        if (!res || !res.array || res.array.length === 0) {
            return {balance : 0}
        }
        let account
        let totalBalance = 0
        for (account of res.array) {
            const balance = BlocksoftFixBalance(account, 'balance')
            if (balance > 0) {
                totalBalance += balance
            }
        }
        return {balance : totalBalance}
    }

    async getCacheAccount(walletHash, currencyCode) {
        if (typeof CACHE_ALL_ACCOUNTS[walletHash] === 'undefined') {
            return this._getFromDB(walletHash, currencyCode)
        }
        if (typeof CACHE_ALL_ACCOUNTS[walletHash][currencyCode] === 'undefined') {
            return this._getFromDB(walletHash, currencyCode)
        }
        return CACHE_ALL_ACCOUNTS[walletHash][currencyCode]
    }

    /**
     * @namespace Flow.updateAccountsDaemon
     * @return {Promise<void>}
     */
    updateAccountsDaemon = async (source) => {
        if (!this._canUpdate && CACHE_ALL_ACCOUNTS) {
            store.dispatch({
                type: 'SET_ACCOUNTS',
                accounts: CACHE_ALL_ACCOUNTS
            })
            return false
        }
        this._canUpdate = false

        Log.daemon('UpdateAccountsDaemon called')
        try {

            const currentStore = store.getState()
            const allWallets = currentStore.walletStore.wallets

            const basicCurrency = currentStore.mainStore.selectedBasicCurrency
            const basicCurrencyCode = basicCurrency.currencyCode || 'USD'

            const walletPub = await walletPubDS.getWalletPubs()
            const notWalletHashes = []
            if (walletPub) {
                let walletPubKey
                for (walletPubKey in walletPub) {
                    notWalletHashes.push(walletPubKey)
                }
            }
            const tmps = await accountDS.getAccountData({ notWalletHashes })

            const reformatted = {}
            const alreadyCounted = {}
            let tmpCurrency
            const tmpWalletHashes = []
            for (tmpCurrency of tmps) {
                if (typeof reformatted[tmpCurrency.walletHash] === 'undefined') {
                    reformatted[tmpCurrency.walletHash] = {}
                    alreadyCounted[tmpCurrency.walletHash] = {}
                    tmpWalletHashes.push(tmpCurrency.walletHash)
                }
                if (tmpCurrency.currencyCode === 'BTC' && typeof walletPub[tmpCurrency.walletHash] !== 'undefined') {
                    if (typeof reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] !== 'undefined') {
                        continue
                    }
                    const pub = walletPub[tmpCurrency.walletHash]
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = tmpCurrency

                    let tmpBalanceScanTime = 0
                    let tmpTransactionsScanTime = 0
                    let tmpBalance = 0
                    let tmpUnconfirmed = 0
                    let keys = ['btc.44', 'btc.49', 'btc.84']
                    let tmpBalanceLog = ''
                    for (let key of keys) {
                        if (typeof pub[key] === 'undefined') {
                            continue
                        }
                        if (tmpBalanceScanTime > 0) {
                            if (pub[key].balanceScanTime * 1 > 0) {
                                tmpBalanceScanTime = Math.min(tmpBalanceScanTime, pub[key].balanceScanTime)
                            }
                        } else {
                            tmpBalanceScanTime = pub[key].balanceScanTime * 1
                        }
                        if (tmpTransactionsScanTime > 0) {
                            if (pub[key].transactionsScanTime * 1 > 0) {
                                tmpTransactionsScanTime = Math.min(tmpTransactionsScanTime, pub[key].transactionsScanTime)
                            }
                        } else {
                            tmpTransactionsScanTime = pub[key].transactionsScanTime * 1
                        }
                        if (tmpBalance > 0) {
                            if (pub[key].balance) {
                                tmpBalance = BlocksoftUtils.add(tmpBalance, pub[key].balance)
                                tmpBalanceLog += ' ' + pub[key].balance + '(' + key + ')'
                            }
                        } else {
                            tmpBalance = pub[key].balance
                            tmpBalanceLog = pub[key].balance + '(' + key + ')'
                        }
                        if (tmpUnconfirmed > 0) {
                            if (pub[key].unconfirmed) {
                                tmpUnconfirmed = BlocksoftUtils.add(tmpUnconfirmed, pub[key].unconfirmed)
                            }
                        } else {
                            tmpUnconfirmed = pub[key].unconfirmed
                        }
                    }
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance = tmpBalance
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed = tmpUnconfirmed
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceTxt = ""
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceFix = ""
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedTxt = ""
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedFix = ""
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog = tmpBalanceLog
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = tmpBalanceScanTime
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].transactionsScanTime = tmpTransactionsScanTime

                } else if (typeof reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] !== 'undefined') {
                    if (typeof alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] === 'undefined') {
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance = BlocksoftUtils.add(reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance, tmpCurrency.balance).toString()
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed = BlocksoftUtils.add(reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed, tmpCurrency.unconfirmed).toString()
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceTxt = ""
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceFix = ""
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedTxt = ""
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedFix = ""
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog += ' ' + tmpCurrency.balance + ' (' + tmpCurrency.address + ')'
                        alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] = 1
                    }
                    continue
                } else {
                    alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = {}
                    alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] = 1
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = tmpCurrency
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog = tmpCurrency.balance + ' (' +  tmpCurrency.address + ')'
                }
            }

            let tmpWalletHash
            for (tmpWalletHash of tmpWalletHashes) {
                CACHE_ALL_ACCOUNTS[tmpWalletHash] = {}
                CACHE_WALLET_SUMS[tmpWalletHash] = {
                    balance: 0,
                    unconfirmed: 0,
                    basicCurrencySymbol: basicCurrency.symbol || '$'
                }
                CACHE_WALLET_TOTAL.balance = 0
                CACHE_WALLET_TOTAL.unconfirmed = 0
                CACHE_WALLET_TOTAL.basicCurrencySymbol = basicCurrency.symbol || '$'
            }

            for (tmpCurrency of currentStore.currencyStore.cryptoCurrencies) {
                const currencyCode = tmpCurrency.currencyCode

                let rate = 0
                if (!tmpCurrency.currencyRateJson || typeof tmpCurrency.currencyRateJson[basicCurrencyCode] === 'undefined') {
                    if (basicCurrencyCode === 'USD') {
                        rate = tmpCurrency.currencyRateUsd || 0
                    }
                } else {
                    rate = tmpCurrency.currencyRateJson[basicCurrencyCode] || 0
                }
                CACHE_RATES[currencyCode] = { basicCurrencyRate: rate, basicCurrencySymbol: basicCurrency.symbol || '$' }

                for (tmpWalletHash of tmpWalletHashes) {
                    // console.log('updateAccounts ' + tmpWalletHash + ' ' + currencyCode + ' ' + rate, reformatted[tmpWalletHash][currencyCode])
                    if (typeof reformatted[tmpWalletHash][currencyCode] === 'undefined') {
                        if (currencyCode === 'BTC' && typeof walletPub[tmpWalletHash] !== 'undefined') {
                            Log.daemon('UpdateAccountsDaemon need to generate ' + tmpWalletHash + ' ' + currencyCode)

                            const res = await walletPubDS.discoverMoreAccounts({ currencyCode: 'BTC', walletHash: tmpWalletHash, needLegacy: true, needSegwit: true })

                            if (res && source !== 'regenerate') {
                                this._canUpdate = true
                                return this.updateAccountsDaemon('regenerate')
                            }
                        } else {
                            Log.daemon('UpdateAccountsDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode)
                        }
                        continue
                    }
                    const accountWallet = allWallets.find(item => item.walletHash === tmpWalletHash)
                    const account = reformatted[tmpWalletHash][currencyCode]

                    const extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(account.currencyCode)
                    account.feesCurrencyCode = extendCurrencyCode.feesCurrencyCode || account.currencyCode
                    const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(account.feesCurrencyCode)
                    account.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode

                    account.feeRates = this.getCacheRates(account.feesCurrencyCode)

                    account.balanceRaw = (accountWallet && accountWallet.walletUseUnconfirmed === 1) ? BlocksoftUtils.add(account.balance, account.unconfirmed).toString() : account.balance
                    account.currencySymbol = tmpCurrency.currencySymbol
                    account.basicCurrencyRate = rate
                    account.basicCurrencyCode = basicCurrencyCode
                    account.basicCurrencySymbol = basicCurrency.symbol || '$'
                    account.balancePretty = 0
                    if (account.balance > 0) {
                        account.balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balance)
                    }
                    account.unconfirmedPretty = 0
                    if (account.unconfirmed > 0) {
                        account.unconfirmedPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.unconfirmed)
                    }
                    if (rate > 0) {
                        if (rate === 1) {
                            account.basicCurrencyBalance = account.balancePretty
                            account.basicCurrencyUnconfirmed = account.unconfirmedPretty
                        } else {
                            account.basicCurrencyBalance = prettyNumber(account.balancePretty * rate, 2)
                            account.basicCurrencyUnconfirmed = prettyNumber(account.unconfirmedPretty * rate, 2)
                        }
                        CACHE_WALLET_SUMS[tmpWalletHash].balance = BlocksoftUtils.add(CACHE_WALLET_SUMS[tmpWalletHash].balance, account.basicCurrencyBalance)
                        CACHE_WALLET_TOTAL.balance = BlocksoftUtils.add(CACHE_WALLET_TOTAL.balance, account.basicCurrencyBalance)
                        CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed = BlocksoftUtils.add(CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed, account.basicCurrencyUnconfirmed)
                        CACHE_WALLET_TOTAL.unconfirmed = BlocksoftUtils.add(CACHE_WALLET_TOTAL.unconfirmed, account.basicCurrencyUnconfirmed)
                    } else {
                        account.basicCurrencyBalance = 0
                        account.basicCurrencyUnconfirmed = 0
                    }

                    CACHE_ALL_ACCOUNTS[tmpWalletHash][currencyCode] = account
                    CACHE_WALLET_SUMS[tmpWalletHash].balance = prettyNumber(CACHE_WALLET_SUMS[tmpWalletHash].balance, 2)
                    CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed = prettyNumber(CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed, 2)
                }
                CACHE_WALLET_TOTAL.balance = prettyNumber(CACHE_WALLET_TOTAL.balance, 2)
                CACHE_WALLET_TOTAL.unconfirmed = prettyNumber(CACHE_WALLET_TOTAL.unconfirmed, 2)
            }


            Log.daemon('UpdateAccountsDaemon success')

            if (typeof CACHE_ALL_ACCOUNTS !== 'undefined') {
                store.dispatch({
                    type: 'SET_ACCOUNTS',
                    accounts: CACHE_ALL_ACCOUNTS
                })
            }

            this._canUpdate = true
            this.tryCounter = 0

        } catch (e) {
            this._canUpdate = true

            if (Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.daemon('UpdateAccountsDaemon network try ' + this.tryCounter + ' ' + e.message)
            } else {
                Log.errDaemon('UpdateAccountsDaemon notice ' + e.message, e)
            }
        }
    }

}

export default new UpdateAccountsDaemon
