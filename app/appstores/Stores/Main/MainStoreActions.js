/**
 * @version 0.9
 */
import store from '@app/store'

import Log from '@app/services/Log/Log'

import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import walletPubDS from '@app/appstores/DataSource/Wallet/WalletPub'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import accountDS from '@app/appstores/DataSource/Account/Account'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

import DaemonCache from '@app/daemons/DaemonCache'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'


const { dispatch } = store

// @misha rething this selected wallet chain
export async function setSelectedWallet(source) {
    Log.log('ACT/MStore setSelectedWallet called ' + source)

    const walletHash = await cryptoWalletsDS.getSelectedWallet()

    if (!walletHash) {
        return false
    }

    await CashBackUtils.createWalletSignature(false)

    const wallet = await walletDS.getWalletByHash(walletHash)

    Log.log('ACT/MStore setSelectedWallet called ' + source + ' found ' + JSON.stringify(wallet))
    dispatch({
        type: 'SET_SELECTED_WALLET',
        wallet
    })
}

export function setLoaderStatus(visible) {

    dispatch({
        type: 'SET_LOADER_STATUS',
        visible
    })

}

export function setBlurStatus(visible) {

    dispatch({
        type: 'SET_BLUR_STATUS',
        visible
    })

}

export function setCurrentScreen(screen) {
    // for now only back and forward
    if (screen) {
        screen.changed = new Date().getTime()
    }
    dispatch({
        type: 'SET_NAV_CURRENT_SCREEN',
        screen
    })
}

export function setSelectedCryptoCurrency(data) {
    dispatch({
        type: 'SET_SELECTED_CRYPTO_CURRENCY',
        selectedCryptoCurrency: data
    })
}

export async function saveSelectedBasicCurrencyCode(currencyCode) {
    Log.log('ACT/MStore setSelectedBasicCurrency called ' + currencyCode)

    await settingsActions.setSettings('local_currency', currencyCode)

    await currencyActions.setSelectedBasicCurrencyCode(currencyCode)

    await UpdateAccountListDaemon.forceDaemonUpdate()

}


export async function setSelectedAccount(setting) {
    // Log.log('ACT/MStore setSelectedAccount called')

    const wallet = store.getState().mainStore.selectedWallet
    const currency = store.getState().mainStore.selectedCryptoCurrency
    let basicAccounts = store.getState().accountStore.accountList

    let accounts
    if (currency.currencyCode === 'BTC' || currency.currencyCode === 'LTC') {
        // Log.log('ACT/MStore setSelectedAccount BTC', { wallet, currency })

        accounts = await accountDS.getAccountData({
            walletHash: wallet.walletHash,
            currencyCode: currency.currencyCode,
            splitSegwit: true,
            notAlreadyShown: wallet.walletIsHd
        })
        if (currency.currencyCode === 'BTC' && wallet.walletIsHd) { // !!! no ltc hd for now
            let needSegwit = false
            let needLegacy = false
            if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
                needSegwit = true
            }
            if (typeof accounts.legacy === 'undefined' || !accounts.legacy || accounts.legacy.length === 0) {
                needLegacy = true
            }
            Log.log('ACT/MStore setSelectedAccount HD checked ' + JSON.stringify({ needSegwit, needLegacy }))
            if (needSegwit || needLegacy) {
                await walletPubDS.discoverMoreAccounts({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    needSegwit,
                    needLegacy
                }, '_SET_SELECTED')
                accounts = await accountDS.getAccountData({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    splitSegwit: true,
                    notAlreadyShown: wallet.walletIsHd
                })
            }
            if (!accounts) {
                accounts = await accountDS.getAccountData({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    splitSegwit: true
                })
            }
            if (!accounts || typeof accounts === 'undefined' || typeof accounts.legacy === 'undefined' || typeof accounts.legacy[0] === 'undefined') {
                Log.log('ACT/MStore setSelectedAccount GENERATE LEGACY 2')
                await walletPubDS.discoverMoreAccounts({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    needSegwit,
                    needLegacy: true
                }, '_SET_SELECTED_2')
                accounts = await accountDS.getAccountData({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    splitSegwit: true,
                    notAlreadyShown: wallet.walletIsHd
                })
            }
        } else if (!accounts || typeof accounts === 'undefined' || typeof accounts.legacy === 'undefined' || typeof accounts.legacy[0] === 'undefined') {

            await accountDS.discoverAccounts({ walletHash: wallet.walletHash, currencyCode: [currency.currencyCode], source: 'SET_SELECTED' }, 'SET_SELECTED')
            await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, source: 'SET_SELECTED' })

            accounts = await accountDS.getAccountData({
                walletHash: wallet.walletHash,
                currencyCode: currency.currencyCode,
                splitSegwit: true
            })

        }


        // Log.log('ACT/MStore setSelectedAccount rechecked')
        if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
            Log.log('ACT/MStore setSelectedAccount GENERATE SEGWIT')
            const tmp = await accountDS.discoverAccounts({
                walletHash: wallet.walletHash,
                currencyCode: [currency.currencyCode + '_SEGWIT']
            }, 'MS_SELECT_ACCOUNT')
            accounts.segwit = tmp.accounts
        }
        if (typeof accounts.segwit[0] === 'undefined') {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET ' + currency.currencyCode + ' SEGWIT ' + JSON.stringify(accounts.segwit))
        }
        if (typeof accounts.legacy[0] === 'undefined') {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET ' + currency.currencyCode + ' LEGACY ' + JSON.stringify(accounts.legacy))
        }
        const segwit = accounts.segwit[0]
        const legacy = accounts.legacy[0]

        accounts[0] = segwit
        accounts[0].legacyData = legacy
        accounts[0].segwitAddress = segwit.address
        accounts[0].legacyAddress = legacy.address

        // @misha to use in ui or not
        // accounts[0].activeAddresses = await accountDS.getAddressesList({ walletHash: wallet.walletHash, currencyCode: currency.currencyCode})
        // console.log('activeAddresses', accounts[0].activeAddresses)

        if (!accounts || !accounts[0]) {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET BTC ' + setting)
            // here could be more generation
        }
    } else {

        // Log.log('ACT/MStore setSelectedAccount OTHER', { wallet, currency })

        accounts = await accountDS.getAccountData({
            walletHash: wallet.walletHash,
            currencyCode: currency.currencyCode
        })

        if (!accounts || !accounts[0]) {
            const tmp = await accountDS.discoverAccounts({ walletHash: wallet.walletHash, fullTree: false, currencyCode: [currency.currencyCode], source: 'SET_SELECTED' }, 'SET_SELECTED')
            await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, source: 'SET_SELECTED' })
            accounts = tmp.accounts
            if (!accounts || !accounts[0]) {
                throw new Error('ACT/MStore setSelectedAccount NOTHING SET OTHER')
            }
        }
    }

    let basic = {}
    if (typeof basicAccounts[wallet.walletHash] === 'undefined' || typeof basicAccounts[wallet.walletHash][currency.currencyCode] === 'undefined') {
        basicAccounts = store.getState().accountStore.accountList
        if (typeof basicAccounts[wallet.walletHash] === 'undefined' || typeof basicAccounts[wallet.walletHash][currency.currencyCode] === 'undefined') {
            Log.log('No basicAccounts2 in ' + wallet.walletHash + ' ' + currency.currencyCode)
        } else {
            basic = basicAccounts[wallet.walletHash][currency.currencyCode]
        }
    } else {
        basic = basicAccounts[wallet.walletHash][currency.currencyCode]
    }



    const account = {
        ...basic,
        ...accounts[0]
    }

    try {

        if (typeof basic !== 'undefined') {
            account.balanceScanTime = basic.balanceScanTime || 0
            account.transactionsScanTime = basic.transactionsScanTime || 0
            account.balance = basic.balance || 0
            account.unconfirmed = basic.unconfirmed || 0
        } else {
            account.balanceScanTime = 0
            account.transactionsScanTime = 0
            account.balance = 0
            account.unconfirmed = 0
        }
        account.balanceRaw = account.balance || 0
        if (wallet.walletUseUnconfirmed === 1) {
            if (account.unconfirmed && account.unconfirmed.toString().indexOf('-') === -1) {
                account.balanceRaw = BlocksoftUtils.add(account.balance, account.unconfirmed).toString()
            }
        }


        const extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(currency.currencyCode)
        account.feesCurrencyCode = extendCurrencyCode.feesCurrencyCode || currency.currencyCode
        const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(account.feesCurrencyCode)
        account.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode

        account.feeRates = DaemonCache.getCacheRates(account.feesCurrencyCode)

        account.transactionsTotalLength = await DaemonCache.getCacheTxsCount(account, wallet)
        Log.log('ACT/MStore setSelectedAccount.transactionInfinity transactionsTotalLength cached ' + account.transactionsTotalLength)

        // cutpaste from account screen - to think about
        account.transactionsToView = []
        const params = {
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            limitFrom: 0,
            limitPerPage: 5
        }
        if (wallet.walletIsHideTransactionForFee !== null && +wallet.walletIsHideTransactionForFee === 1) {
            params.minAmount = 0
        }
        const tmp = await transactionDS.getTransactions(params, 'ACT/MStore setSelectedAccount.transactionInfinity list')
        if (tmp && tmp.length > 0) {
            if (account.transactionsTotalLength === 0) {
                // somehow cache = zero is possible
                account.transactionsTotalLength = await DaemonCache.getCacheTxsCount(account, wallet, true)
                Log.log('ACT/MStore setSelectedAccount.transactionInfinity transactionsTotalLength forced ' + account.transactionsTotalLength)
            }
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData, account.currencyCode)
                account.transactionsToView.push(transaction)
            }
        }

        dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: account
        })
    } catch (e) {
        throw new Error(e.message + ' account ' + JSON.stringify(account))
    }
}


export function setInitState(data) {
    Log.log('ACT/MStore setInitState called ' + JSON.stringify(data))
    return {
        type: 'SET_INIT_STATE',
        init: data
    }
}

export function setInitError(data) {
    Log.log('ACT/MStore setInitError called ' + JSON.stringify(data))
    return {
        type: 'SET_INIT_ERROR',
        initError: data
    }
}
