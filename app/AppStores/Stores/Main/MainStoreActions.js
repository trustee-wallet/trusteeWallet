/**
 * @version 0.9
 */
import _ from 'lodash'
import store from '../../../store'

import Log from '../../../services/Log/Log'

import walletDS from '../../DataSource/Wallet/Wallet'
import walletPubDS from '../../DataSource/Wallet/WalletPub'
import cryptoWalletsDS from '../../DataSource/CryptoWallets/CryptoWallets'
import accountDS from '../../DataSource/Account/Account'
import transactionDS from '../../DataSource/Transaction/Transaction'

import settingsActions from '../Settings/SettingsActions'
import currencyActions from '../Currency/CurrencyActions'
import transactionActions from '../../Actions/TransactionActions'

import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import UpdateAccountsDaemon from '../../../services/Daemon/elements/UpdateAccountsDaemon'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'


const { dispatch } = store

// @misha rething this selected wallet chain
export async function setSelectedWallet() {
    Log.log('ACT/MStore setSelectedWallet called')
    const wallets = await walletDS.getWallets()

    const walletHash = await cryptoWalletsDS.getSelectedWallet()

    const wallet = _.find(wallets, { walletHash })

    Log.log('ACT/MStore setSelectedWallet found', wallet)
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


export function setSelectedCryptoCurrency(data) {
    Log.log('ACT/MStore setSelectedCryptoCurrency called', data)
    dispatch({
        type: 'SET_SELECTED_CRYPTO_CURRENCY',
        selectedCryptoCurrency: data
    })
}

export async function saveSelectedBasicCurrencyCode(currencyCode) {
    Log.log('ACT/MStore setSelectedBasicCurrency called ' + currencyCode)

    await settingsActions.setSettings('local_currency', currencyCode)

    await currencyActions.setSelectedBasicCurrencyCode(currencyCode)

    await UpdateAccountsDaemon.forceDaemonUpdate()

}


export async function setSelectedAccount(setting) {
    Log.log('ACT/MStore setSelectedAccount called')

    const wallet = store.getState().mainStore.selectedWallet
    const currency = store.getState().mainStore.selectedCryptoCurrency
    const basicAccounts = store.getState().accountStore.accounts

    let accounts
    if (currency.currencyCode === 'BTC') {
        Log.log('ACT/MStore setSelectedAccount BTC', { wallet, currency })

        accounts = await accountDS.getAccountData({
            walletHash: wallet.walletHash,
            currencyCode: currency.currencyCode,
            splitSegwit: true,
            notAlreadyShown: wallet.walletIsHd
        })
        if (wallet.walletIsHd) {
            let needSegwit = false
            let needLegacy = false
            if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
                needSegwit = true
            }
            if (typeof accounts.legacy === 'undefined' || !accounts.legacy || accounts.legacy.length === 0) {
                needLegacy = true
            }
            if (needSegwit || needLegacy) {
                await walletPubDS.discoverMoreAccounts({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    needSegwit,
                    needLegacy
                })
                accounts = await accountDS.getAccountData({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    splitSegwit : true,
                    notAlreadyShown: wallet.walletIsHd
                })
            }
            if (!accounts) {
                accounts = await accountDS.getAccountData({
                    walletHash: wallet.walletHash,
                    currencyCode: currency.currencyCode,
                    splitSegwit : true
                })
            }
        }


        if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
            Log.log('ACT/MStore setSelectedAccount GENERATE SEGWIT')
            accounts.segwit = await accountDS.discoverAccounts({
                walletHash: wallet.walletHash,
                currencyCode: ['BTC_SEGWIT']
            }, 'MS_SELECT_ACCOUNT')
        }
        if (typeof accounts.segwit[0] === 'undefined') {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET BTC SEGWIT ' + JSON.stringify(accounts.segwit))
        }
        if (typeof accounts.legacy[0] === 'undefined') {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET BTC LEGACY ' + JSON.stringify(accounts.legacy))
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

        Log.log('ACT/MStore setSelectedAccount OTHER', { wallet, currency })

        accounts = await accountDS.getAccountData({
            walletHash: wallet.walletHash,
            currencyCode: currency.currencyCode
        })

        if (!accounts || !accounts[0]) {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET OTHER')
        }
    }

    const basic = basicAccounts[wallet.walletHash][currency.currencyCode]

    const account = {
        ...basic,
        ...accounts[0]
    }

    account.balanceScanTime = basic.balanceScanTime
    account.transactionsScanTime = basic.transactionsScanTime
    account.balance = basic.balance
    account.unconfirmed = basic.unconfirmed
    account.balanceRaw = wallet.walletUseUnconfirmed === 1 ? BlocksoftUtils.add(account.balance, account.unconfirmed).toString() : account.balance


    const extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(currency.currencyCode)
    account.feesCurrencyCode = extendCurrencyCode.feesCurrencyCode || currency.currencyCode
    const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(account.feesCurrencyCode)
    account.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode

    account.feeRates = UpdateAccountsDaemon.getCacheRates(account.feesCurrencyCode)

    account.transactions = await transactionDS.getTransactions({
        walletHash: wallet.walletHash,
        currencyCode: currency.currencyCode
    })
    if (account.transactions && account.transactions.length > 0) {
        let transaction
        for (transaction of account.transactions) {
            transaction = transactionActions.preformat(transaction, account)
        }
    }

    dispatch({
        type: 'SET_SELECTED_ACCOUNT',
        selectedAccount: account
    })
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
