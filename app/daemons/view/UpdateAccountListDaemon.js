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
import { setSelectedAccount, setSelectedAccountTransactions } from '../../appstores/Stores/Main/MainStoreActions'
import BlocksoftBN from '../../../crypto/common/BlocksoftBN'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'
import config from '@app/config/config'
import Database from '@app/appstores/DataSource/Database/main'

let CACHE_PAUSE = 0

const CACHE_VALID_TIME_PAUSE = 10000

let CACHE_STOPPED = false

class UpdateAccountListDaemon extends Update {

    constructor(props) {
        super(props)
        this.updateFunction = this.updateAccountListDaemon
        this._canUpdate = true
    }

    stop = () => {
        CACHE_STOPPED = true
    }

    unstop = () => {
        CACHE_STOPPED = false
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
        if (CACHE_STOPPED && !force) return false

        if (!force && DaemonCache.CACHE_WALLET_COUNT > 0) {
            if (
                (CACHE_PAUSE > 0 && now - CACHE_PAUSE < CACHE_VALID_TIME_PAUSE)
                || !this._canUpdate
            ) {
                if (store.getState().accountStore.accountList !== {}) {
                    // do nothing @todo testing if its the key
                } else {
                    store.dispatch({
                        type: 'SET_ACCOUNT_LIST',
                        accountList: DaemonCache.CACHE_ALL_ACCOUNTS
                    })
                }
                return false
            }
        }
        this._canUpdate = false
        try {

            const currentStore = store.getState()
            const allWallets = currentStore.walletStore.wallets
            const selectedAccount = currentStore.mainStore.selectedAccount

            let basicCurrency = currentStore.mainStore.selectedBasicCurrency
            if (!basicCurrency || typeof basicCurrency.symbol === 'undefined') {
                basicCurrency = {
                    currencyCode : 'USD',
                    symbol : '$'
                }
            }
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
                        reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].walletPubs = walletPub[tmpCurrency.walletHash]

                        if (tmpCurrency.address.indexOf(BlocksoftDict.Currencies[tmpCurrency.currencyCode].addressPrefix) === 0) {
                            if (typeof  reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].legacy === 'undefined') {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].legacy = tmpCurrency.address
                            }
                        } else if (tmpCurrency.address.indexOf(BlocksoftDict.CurrenciesForTests[tmpCurrency.currencyCode + '_SEGWIT'].addressPrefix) === 0) {
                            if (typeof reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].segwit  === 'undefined') {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].segwit = tmpCurrency.address
                            }
                        }

                        continue
                    }
                    const pub = walletPub[tmpCurrency.walletHash]
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode] = tmpCurrency

                    let tmpBalanceScanTime = 0
                    let tmpTransactionsScanTime = 0
                    let tmpBalance = new BlocksoftBN(0)
                    let tmpUnconfirmed = new BlocksoftBN(0)
                    let tmpBalanceLog = ''
                    let tmpBalanceScanError = ''
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
                                tmpTransactionsScanTime = Math.max(tmpTransactionsScanTime, pub[key].transactionsScanTime)
                            }
                        } else {
                            tmpTransactionsScanTime = pub[key].transactionsScanTime * 1
                        }

                        if (pub[key].balance) {
                            tmpBalance.add(pub[key].balance)
                            tmpBalanceLog += ' ' + pub[key].balance + '(' + key + ')'
                        }
                        if (pub[key].balanceScanError && pub[key].balanceScanError !== '' && pub[key].balanceScanError !== 'null') {
                            tmpBalanceScanError = pub[key].balanceScanError
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
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceStaked = ''
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceAddingLog = tmpBalanceLog
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanTime = tmpBalanceScanTime > tmpTransactionsScanTime ? tmpBalanceScanTime : tmpTransactionsScanTime
                    reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceScanError = tmpBalanceScanError
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
                            try {
                                reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceStaked = BlocksoftUtils.add(reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].balanceStaked, tmpCurrency.balanceStaked).toString()
                            } catch (e) {
                                Log.errDaemon('UpdateAccountListDaemon error on reformatted3 ' + e.message)
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

                    if (typeof BlocksoftDict.CurrenciesForTests[tmpCurrency.currencyCode + '_SEGWIT'] !== 'undefined') {
                        if (tmpCurrency.address.indexOf(BlocksoftDict.Currencies[tmpCurrency.currencyCode].addressPrefix) === 0) {
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].legacy = tmpCurrency.address
                        } else if (tmpCurrency.address.indexOf(BlocksoftDict.CurrenciesForTests[tmpCurrency.currencyCode + '_SEGWIT'].addressPrefix) === 0) {
                            reformatted[tmpCurrency.walletHash][tmpCurrency.currencyCode].segwit = tmpCurrency.address
                        }
                    }
                }
            }

            let tmpWalletHash
            DaemonCache.CACHE_WALLET_COUNT = 0
            for (tmpWalletHash of tmpWalletHashes) {
                DaemonCache.CACHE_ALL_ACCOUNTS[tmpWalletHash] = {}
                DaemonCache.CACHE_WALLET_SUMS[tmpWalletHash] = {
                    balance: 0,
                    unconfirmed: 0,
                    balanceStaked : 0,
                    balanceAddingLog: '',
                    balanceAddingLogHidden : '',
                    balanceAddingLogZero : '',
                    basicCurrencySymbol: basicCurrency.symbol || '$'
                }
                DaemonCache.CACHE_WALLET_TOTAL.balance = 0
                DaemonCache.CACHE_WALLET_TOTAL.unconfirmed = 0
                DaemonCache.CACHE_WALLET_TOTAL.basicCurrencySymbol = basicCurrency.symbol || '$'
                DaemonCache.CACHE_WALLET_COUNT++
            }

            for (tmpCurrency of currentStore.currencyStore.cryptoCurrencies) {
                const currencyCode = tmpCurrency.currencyCode
                if (currencyCode === 'NFT' || currencyCode==='CASHBACK') continue
                let rate = 0
                if (!tmpCurrency.currencyRateJson || typeof tmpCurrency.currencyRateJson[basicCurrencyCode] === 'undefined') {
                    if (basicCurrencyCode === 'USD') {
                        rate = tmpCurrency.currencyRateUsd || 0
                    }
                } else {
                    rate = tmpCurrency.currencyRateJson[basicCurrencyCode] || 0
                }
                if (rate.toString().indexOf('e-')) {
                    rate = BlocksoftUtils.fromENumber(rate.toString())
                }
                if (currencyCode === 'BTC') {
                    Log.daemon('UpdateAccountListDaemon rate BTC ' + rate + ' with ' + JSON.stringify(basicCurrency))
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
                            if (config.debug.appErrors) {
                                //console.log('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' but started regeneration')
                            }
                            //Log.daemon('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' but started regeneration')

                            // low code as something strange if no account but there is currency
                            const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(tmpWalletHash, 'UpdateAccountListDaemon')
                            let accounts = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree: false, fromIndex: 0, toIndex: 1, currencyCode }, 'APP_ACCOUNTS_LIST')
                            if (typeof accounts[currencyCode] === 'undefined') {
                                if (config.debug.appErrors) {
                                    //console.log('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' fail regeneration')
                                }
                                //Log.daemon('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' fail regeneration')
                            } else {
                                const prepare = []
                                for (const account of accounts[currencyCode]) {
                                    const derivationPath = Database.escapeString(account.path)
                                    let accountJson = ''
                                    if (typeof (account.addedData) !== 'undefined') {
                                        accountJson = Database.escapeString(JSON.stringify(account.addedData))
                                    }
                                    const tmp = {
                                        address: account.address,
                                        name: '',
                                        derivationPath: derivationPath,
                                        derivationIndex: account.index,
                                        derivationType: account.type,
                                        alreadyShown: account.alreadyShown ? 1 : 0,
                                        status: 0,
                                        currencyCode,
                                        walletHash: tmpWalletHash,
                                        walletPubId: 0,
                                        accountJson: accountJson,
                                        transactionsScanTime: 0
                                    }
                                    if (typeof account.walletPubId !== 'undefined') {
                                        tmp.walletPubId = account.walletPubId
                                        params.walletPubId = tmp.walletPubId
                                    } else if (typeof params.walletPubId !== 'undefined') {
                                        tmp.walletPubId = params.walletPubId
                                    }
                                    prepare.push(tmp)
                                }
                                if (prepare.length === 0) {
                                    if (config.debug.appErrors) {
                                        console.log('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' fail prepare')
                                    }
                                    Log.daemon('UpdateAccountListDaemon skip as no account ' + tmpWalletHash + ' ' + currencyCode + ' fail prepare')
                                } else {
                                    await Database.setTableName('account').setInsertData({ insertObjs: prepare }).insert()
                                }
                            }
                            // end low code
                        }
                        continue
                    }
                    const accountWallet = allWallets.find(item => item.walletHash === tmpWalletHash)
                    const account = reformatted[tmpWalletHash][currencyCode]

                    const extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(account.currencyCode)
                    account.feesCurrencyCode = extendCurrencyCode.feesCurrencyCode || account.currencyCode
                    const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(account.feesCurrencyCode)
                    account.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode

                    account.feeRates = DaemonCache.getCacheRates(account.feesCurrencyCode)
                    account.walletUseUnconfirmed = accountWallet?.walletUseUnconfirmed
                    try {
                        account.balanceRaw =
                            BlocksoftTransferUtils.getBalanceForTransfer({
                                balance : account.balance,
                                unconfirmed : (accountWallet && accountWallet?.walletUseUnconfirmed === 1) ? account.unconfirmed : false,
                                balanceStaked: account.balanceStaked,
                                currencyCode
                            })
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
                            account.balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balance, 'updateAccountListDaemon.balance')
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.balance makePretty ' + e.message)
                        }
                    }
                    account.unconfirmedPretty = 0
                    if (account.unconfirmed > 0) {
                        try {
                            account.unconfirmedPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.unconfirmed, 'updateAccountListDaemon.unconfirmed')
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.unconfirmed makePretty ' + e.message)
                        }
                    }
                    account.balanceStakedPretty = 0
                    if (account.balanceStaked > 0) {
                        try {
                            account.balanceStakedPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balanceStaked, 'updateAccountListDaemon.balanceStaked')
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.balanceStaked makePretty ' + e.message)
                        }
                    }
                    account.balanceTotalPretty = 0
                    if (account.balanceRaw > 0) {
                        try {
                            account.balanceTotalPretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balanceRaw, 'updateAccountListDaemon.balanceRaw')
                        } catch (e) {
                            Log.errDaemon('UpdateAccountListDaemon error on account.balanceRaw makePretty ' + e.message)
                        }
                    }
                    if (rate > 0) {
                        account.basicCurrencyBalanceNorm = account.balancePretty
                        account.basicCurrencyUnconfirmedNorm = account.unconfirmedPretty
                        account.basicCurrencyBalanceTotalNorm = account.balanceTotalPretty
                        if (rate !== 1) {
                            account.basicCurrencyBalanceNorm = BlocksoftUtils.mul(account.balancePretty, rate)
                            account.basicCurrencyUnconfirmedNorm = BlocksoftUtils.mul(account.unconfirmedPretty, rate)
                            account.basicCurrencyBalanceTotalNorm = BlocksoftUtils.mul(account.balanceTotalPretty, rate)
                        }
                        account.basicCurrencyBalance = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyBalanceNorm, 2).separated
                        account.basicCurrencyUnconfirmed = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyUnconfirmedNorm, 2).separated
                        account.basicCurrencyBalanceTotal = BlocksoftPrettyNumbers.makeCut(account.basicCurrencyBalanceTotalNorm, 2).separated

                        let str = ''
                        str += account.balancePretty + ' ' + account.currencyCode
                        if (account.address) {
                            str += ' ' + account.address
                        }
                        str += ' ' + account.basicCurrencyBalance + ' ' + account.basicCurrencyCode + ', '

                        const mask = Number(tmpCurrency.isHidden || 0).toString(2).split('').reverse() // split to binary
                        let maskedHidden = true
                        if (accountWallet) {
                            if (typeof mask[accountWallet?.walletNumber] === 'undefined') {
                                maskedHidden = mask.length === 1 ? (mask[mask.length - 1] === '1') : false
                            } else {
                                maskedHidden = mask[accountWallet?.walletNumber] === '1'
                            }
                        }

                        if (!maskedHidden) {

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
                        account.basicCurrencyBalanceTotal = 0
                        account.basicCurrencyBalanceTotalNorm = 0
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

            if (typeof DaemonCache.CACHE_ALL_ACCOUNTS !== 'undefined') {
                store.dispatch({
                    type: 'SET_ACCOUNT_LIST',
                    accountList: DaemonCache.CACHE_ALL_ACCOUNTS
                })
            }
            walletActions.setWalletsGeneralData(DaemonCache.CACHE_WALLET_TOTAL.balance, DaemonCache.CACHE_WALLET_TOTAL.basicCurrencySymbol)

            try {
                if (selectedAccount && typeof selectedAccount !== 'undefined'
                    && typeof selectedAccount.currencyCode !== 'undefined'
                    && typeof selectedAccount.walletHash !== 'undefined'
                    && selectedAccount.currencyCode !== 'NFT'
                    && selectedAccount.currencyCode !== 'CASHBACK'
                ) {
                    if (typeof DaemonCache.CACHE_ALL_ACCOUNTS[selectedAccount.walletHash][selectedAccount.currencyCode] === 'undefined') {
                        Log.daemon('UpdateAccountListDaemon error when no selected ' + selectedAccount.currencyCode)
                    } else {
                        if (DaemonCache.CACHE_ALL_ACCOUNTS[selectedAccount.walletHash][selectedAccount.currencyCode].balance !== selectedAccount.balance) {
                            await setSelectedAccount('UpdateAccountListDaemon')
                            await setSelectedAccountTransactions('UpdateAccountListDaemon')
                        }
                    }
                }
            } catch (e) {
                Log.errDaemon('UpdateAccountListDaemon error on setSelected ' + e.message)
            }

            // FIXME: remove it, temporary solution to fix UI changing on home screen when user change local currency
            store.dispatch({
                type: 'SET_SELECTED_BASIC_CURRENCY',
                selectedBasicCurrency: currentStore.mainStore.selectedBasicCurrency
            })

            this._canUpdate = true

        } catch (e) {
            this._canUpdate = true
            Log.errDaemon('UpdateAccountListDaemon error ' + e.message)
        }
        return DaemonCache.CACHE_ALL_ACCOUNTS
    }

}

export default new UpdateAccountListDaemon()
