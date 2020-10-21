/**
 * @version 0.11
 */
import Update from '../Update'

import Log from '../../services/Log/Log'

import store from '../../store'

import accountDS from '../../appstores/DataSource/Account/Account'
import walletPubDS from '../../appstores/DataSource/Wallet/WalletPub'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'

import DaemonCache from '../DaemonCache'
import { setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'
import BlocksoftBN from '../../../crypto/common/BlocksoftBN'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

let CACHE_PAUSE = 0
const CACHE_VALID_TIME_PAUSE = 10000

class UpdateAccountListDaemon extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountListDaemon
        this._canUpdate = true
    }

    pause = () => {
        CACHE_PAUSE = new Date().getTime()
    }


    /**
     * @return {Promise<void>}
     */
    updateAccountListDaemon = async (params) => {
        const source = params.source || 'none'
        const force = params.force || false
        const now = new Date().getTime()


        if (!force && DaemonCache.CACHE_ALL_ACCOUNTS) {
            if (
                (CACHE_PAUSE > 0 && now - CACHE_PAUSE < CACHE_VALID_TIME_PAUSE)
                || !this._canUpdate
            ) {
                store.dispatch({
                    type: 'SET_ACCOUNT_LIST',
                    accountList: DaemonCache.CACHE_ALL_ACCOUNTS
                })
                return false
            }
        }
        this._canUpdate = false
        try {

            const currentStore = store.getState()
            const allWallets = currentStore.walletStore.wallets
            const selectedAccount = currentStore.mainStore.selectedAccount

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
                        if (reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].address.substr(0, 1) === '3') {
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].address = tmpCurrency.address
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].derivationPath = tmpCurrency.derivationPath
                        }
                        continue
                    }
                    const pub = walletPub[tmpCurrency.walletHash]
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = tmpCurrency

                    let tmpBalanceScanTime = new BlocksoftBN(0)
                    let tmpTransactionsScanTime = new BlocksoftBN(0)
                    let tmpBalance = new BlocksoftBN(0)
                    let tmpUnconfirmed = new BlocksoftBN(0)
                    let tmpBalanceLog = ''
                    const keys = ['btc.44', 'btc.49', 'btc.84']
                    let key
                    for (key of keys) {
                        if (typeof pub[key] === 'undefined') {
                            continue
                        }
                        if (tmpBalanceScanTime > 0) {
                            if (pub[key].balanceScanTime * 1 > 0) {
                                tmpBalanceScanTime = Math.min(tmpBalanceScanTime, pub[key].balanceScanTime)
                            } else {
                                tmpBalanceScanTime = 0
                            }
                        } else {
                            tmpBalanceScanTime = pub[key].balanceScanTime * 1
                        }
                        if (tmpTransactionsScanTime > 0) {
                            if (pub[key].transactionsScanTime * 1 > 0) {
                                tmpTransactionsScanTime = Math.min(tmpTransactionsScanTime, pub[key].transactionsScanTime)
                            } else {
                                tmpTransactionsScanTime = 0
                            }
                        } else {
                            tmpTransactionsScanTime = pub[key].transactionsScanTime * 1
                        }

                        if (pub[key].balance) {
                            tmpBalance.add(pub[key].balance)
                            tmpBalanceLog += ' ' + pub[key].balance + '(' + key + ')'
                        }

                        if (pub[key].unconfirmed) {
                            try {
                                tmpUnconfirmed.add(pub[key].unconfirmed)
                            } catch (e) {
                                Log.errDaemon('UpdateAccountListDaemon error on tmpUnconfirmed ' + e.message)
                            }
                        }

                    }
                    const badAddresses = await accountDS.getAccountData({ derivationPath: 'm/49quote/0quote/0/1/0' })
                    if (badAddresses) {
                        let bad
                        for (bad of badAddresses) {

                            if (bad.balance) {
                                try {
                                    tmpBalance.add(bad.balance)
                                    tmpBalanceLog += ' ' + bad.balance + '(' + bad.address + ')'
                                } catch (e) {
                                    Log.errDaemon('UpdateAccountListDaemon error on tmpBalance ' + e.message)
                                }
                            }

                            if (bad.unconfirmed) {
                                try {
                                    tmpUnconfirmed.add(bad.unconfirmed)
                                } catch (e) {
                                    Log.errDaemon('UpdateAccountListDaemon error on tmpUnconfirmed2 ' + e.message)
                                }
                            }

                        }
                    }

                    tmpBalance = tmpBalance.get()
                    tmpUnconfirmed = tmpUnconfirmed.get()

                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance = tmpBalance
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed = tmpUnconfirmed
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceTxt = ''
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceFix = ''
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedTxt = ''
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedFix = ''
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog = tmpBalanceLog
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = tmpBalanceScanTime
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].transactionsScanTime = tmpTransactionsScanTime

                } else {
                    if (typeof reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] !== 'undefined') {
                        if (typeof alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] === 'undefined') {
                            if (reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime * 1 > 0) {
                                if (tmpCurrency.balanceScanTime * 1 > 0) {
                                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = Math.min(tmpCurrency.balanceScanTime * 1, reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime * 1)
                                } else {
                                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = 0
                                }
                            } else {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = tmpCurrency.balanceScanTime * 1
                            }
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].transactionsScanTime = 0
                            try {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance = BlocksoftUtils.add(reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balance, tmpCurrency.balance).toString()
                            } catch (e) {
                                Log.errDaemon('UpdateAccountListDaemon error on reformatted ' + e.message)
                            }
                            try {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed = BlocksoftUtils.add(reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmed, tmpCurrency.unconfirmed).toString()
                            } catch (e) {
                                Log.errDaemon('UpdateAccountListDaemon error on reformatted2 ' + e.message)
                            }
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceTxt = ''
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceFix = ''
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedTxt = ''
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].unconfirmedFix = ''
                            try {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog += ' ' + tmpCurrency.balance + ' (' + tmpCurrency.address + '/' + tmpCurrency.balanceScanTime + ')'
                            } catch (e) {
                                Log.errDaemon('UpdateAccountListDaemon error on balanceAddingLog ' + e.message)
                            }
                            alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] = 1
                        }
                    } else {
                        alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = {}
                        alreadyCounted[tmpCurrency.walletHash][tmpCurrency.currencyCode][tmpCurrency.address] = 1
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = tmpCurrency
                        try {
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog = tmpCurrency.balance + ' (' + tmpCurrency.address + '/' + tmpCurrency.balanceScanTime + ')'
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on balanceAddingLog2 ' + e.message)
                        }
                    }
                    const firstLetter = tmpCurrency.address.substr(0, 1)
                    if (firstLetter === '1') {
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].legacy = tmpCurrency.address
                    } else if (firstLetter === 'b') {
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].segwit = tmpCurrency.address
                    }
                }
            }

            let tmpWalletHash
            for (tmpWalletHash of tmpWalletHashes) {
                DaemonCache.CACHE_ALL_ACCOUNTS[tmpWalletHash] = {}
                DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash] = {
                    balance: 0,
                    unconfirmed: 0,
                    balanceAddingLog: '',
                    balanceAddingLogHidden : '',
                    balanceAddingLogZero : '',
                    basicCurrencySymbol: basicCurrency.symbol || '$'
                }
                DaemonCache.CACHE_WALLET_TOTAL.balance = 0
                DaemonCache.CACHE_WALLET_TOTAL.unconfirmed = 0
                DaemonCache.CACHE_WALLET_TOTAL.basicCurrencySymbol = basicCurrency.symbol || '$'
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
                if (currencyCode === 'BTC') {
                    Log.daemon('UpdateAccountListDaemon rate BTC ' + rate)
                }
                DaemonCache.CACHE_RATES[currencyCode] = {
                    basicCurrencyRate: rate,
                    basicCurrencySymbol: basicCurrency.symbol || '$'
                }

                for (tmpWalletHash of tmpWalletHashes) {
                    // console.log('updateAccounts ' + tmpWalletHash + ' ' + currencyCode + ' ' + rate, reformatted[tmpWalletHash][currencyCode])
                    if (typeof reformatted[tmpWalletHash][currencyCode] === 'undefined') {
                        if (currencyCode === 'BTC' && typeof walletPub[tmpWalletHash] !== 'undefined') {
                            Log.daemon('UpdateAccountListDaemon need to generate ' + tmpWalletHash + ' ' + currencyCode)

                            const res = await walletPubDS.discoverMoreAccounts({
                                currencyCode: 'BTC',
                                walletHash: tmpWalletHash,
                                needLegacy: true,
                                needSegwit: true
                            }, '_SET_ACCOUNT_LIST')

                            if (res && source !== 'regenerate') {
                                this._canUpdate = true
                                return this.updateAccountListDaemon({ source: 'regenerate' })
                            }
                        } else {
                            Log.daemon('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode)
                        }
                        continue
                    }
                    const accountWallet = allWallets.find(item => item.walletHash === tmpWalletHash)
                    if (typeof accountWallet !== 'undefined' && accountWallet) {
                        DaemonCache.CACHE_WALLET_NAMES_AND_CB[tmpWalletHash] = {
                            walletName: accountWallet.walletName,
                            walletCashback: accountWallet.walletCashback,
                            walletIsHd: accountWallet.walletIsHd,
                            walletUseUnconfirmed: accountWallet.walletUseUnconfirmed
                        }
                    }
                    const account = reformatted[tmpWalletHash][currencyCode]

                    const extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(account.currencyCode)
                    account.feesCurrencyCode = extendCurrencyCode.feesCurrencyCode || account.currencyCode
                    const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(account.feesCurrencyCode)
                    account.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode

                    account.feeRates = DaemonCache.getCacheRates(account.feesCurrencyCode)

                    try {
                        account.balanceRaw = (accountWallet && accountWallet.walletUseUnconfirmed === 1) ? BlocksoftUtils.add(account.balance, account.unconfirmed).toString() : account.balance
                    } catch (e) {
                        Log.errDaemon('UpdateAccountListDaemon error on account.balanceRaw ' + e.message)
                        account.balanceRaw = account.balance
                    }
                    account.currencySymbol = tmpCurrency.currencySymbol
                    account.basicCurrencyRate = rate
                    account.basicCurrencyCode = basicCurrencyCode
                    account.basicCurrencySymbol = basicCurrency.symbol || '$'
                    account.balancePretty = 0
                    if (account.balance > 0) {
                        try {
                            account.balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balance)
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.balance makePretty ' + e.message)
                        }
                    }
                    account.unconfirmedPretty = 0
                    if (account.unconfirmed > 0) {
                        try {
                            account.unconfirmedPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.unconfirmed)
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.unconfirmed makePretty ' + e.message)
                        }
                    }
                    if (rate > 0) {
                        account.basicCurrencyBalanceNorm = account.balancePretty
                        account.basicCurrencyUnconfirmedNorm = account.unconfirmedPretty
                        if (rate !== 1) {
                            account.basicCurrencyBalanceNorm = BlocksoftUtils.mul(account.balancePretty, rate)
                            account.basicCurrencyUnconfirmedNorm = BlocksoftUtils.mul(account.unconfirmedPretty, rate)
                        }
                        account.basicCurrencyBalance = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyBalanceNorm, 2).separated
                        account.basicCurrencyUnconfirmed = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyUnconfirmedNorm, 2).separated

                        let str = ''
                        str += account.balancePretty + ' ' + account.currencyCode
                        if (account.address) {
                            str += ' ' + account.address
                        }
                        str += ' ' + account.basicCurrencyBalance + ' ' + account.basicCurrencyCode + ', '

                        if (!tmpCurrency.isHidden) {

                            if (account.basicCurrencyBalanceNorm > 0) {
                                try {
                                    DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLog += str
                                    DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balance = BlocksoftUtils.add(DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balance, account.basicCurrencyBalanceNorm)
                                    DaemonCache.CACHE_WALLET_TOTAL.balance = BlocksoftUtils.add(DaemonCache.CACHE_WALLET_TOTAL.balance, account.basicCurrencyBalanceNorm)
                                } catch (e) {
                                    Log.errDaemon('UpdateAccountListDaemon error on sum ' + e.message)
                                }
                            } else {
                                DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLogZero += str
                            }


                            if (account.basicCurrencyUnconfirmedNorm > 0) {
                                try {
                                    DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed = BlocksoftUtils.add(DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed, account.basicCurrencyUnconfirmedNorm)
                                    DaemonCache.CACHE_WALLET_TOTAL.unconfirmed = BlocksoftUtils.add(DaemonCache.CACHE_WALLET_TOTAL.unconfirmed, account.basicCurrencyUnconfirmedNorm)
                                } catch (e) {
                                    Log.errDaemon('UpdateAccountListDaemon error on sum2 ' + e.message)
                                }
                            }

                        } else {
                            if (account.basicCurrencyBalanceNorm > 0) {
                                DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLogHidden += str
                            } else {
                                DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLogZero += str
                            }
                        }
                    } else {
                        account.basicCurrencyBalance = 0
                        account.basicCurrencyUnconfirmed = 0
                        account.basicCurrencyBalanceNorm = 0
                        account.basicCurrencyUnconfirmedNorm = 0
                    }

                    DaemonCache.CACHE_ALL_ACCOUNTS[tmpWalletHash][currencyCode] = account
                    DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balance = BlocksoftPrettyNumbers.makeCut(DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balance, 2).justCutted
                    DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed = BlocksoftPrettyNumbers.makeCut(DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].unconfirmed, 2).justCutted
                }
                DaemonCache.CACHE_WALLET_TOTAL.balance = BlocksoftPrettyNumbers.makeCut(DaemonCache.CACHE_WALLET_TOTAL.balance, 2).justCutted
                DaemonCache.CACHE_WALLET_TOTAL.unconfirmed = BlocksoftPrettyNumbers.makeCut(DaemonCache.CACHE_WALLET_TOTAL.unconfirmed, 2).justCutted
            }

            for (const tmpWalletHash in DaemonCache.CACHE_WALLET_SUMS) {
                const cacheBalanceString =  DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLog + DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLogHidden
                MarketingEvent.setBalance(tmpWalletHash, 'TOTAL', cacheBalanceString, {
                    totalBalance : DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balance,
                    totalBalanceString : DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLog,
                    hiddenBalanceString : DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash].balanceAddingLogHidden,
                    basicCurrencyCode,
                    walletHash : tmpWalletHash })
            }

            Log.daemon('UpdateAccountListDaemon CACHE_WALLET_SUMS', DaemonCache.CACHE_WALLET_SUMS)

            if (typeof DaemonCache.CACHE_ALL_ACCOUNTS !== 'undefined') {
                store.dispatch({
                    type: 'SET_ACCOUNT_LIST',
                    accountList: DaemonCache.CACHE_ALL_ACCOUNTS
                })
            }

            try {
                if (selectedAccount && typeof selectedAccount !== 'undefined' && typeof selectedAccount.currencyCode !== 'undefined' && typeof selectedAccount.walletHash !== 'undefined') {
                    if (typeof DaemonCache.CACHE_ALL_ACCOUNTS[selectedAccount.walletHash][selectedAccount.currencyCode] === 'undefined') {
                        Log.daemon('UpdateAccountListDaemon error when no selected ' + selectedAccount.currencyCode)
                    } else {
                        if (DaemonCache.CACHE_ALL_ACCOUNTS[selectedAccount.walletHash][selectedAccount.currencyCode].balance !== selectedAccount.balance) {
                            await setSelectedAccount()
                        }
                    }
                }
            } catch (e) {
                Log.errDaemon('UpdateAccountListDaemon error on setSelected ' + e.message)
            }

            this._canUpdate = true

        } catch (e) {
            this._canUpdate = true
            Log.errDaemon('UpdateAccountListDaemon error ' + e.message)
        }
        return DaemonCache.CACHE_ALL_ACCOUNTS
    }

}

export default new UpdateAccountListDaemon()
