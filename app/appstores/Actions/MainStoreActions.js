/**
 * @todo Misha review
 */

import currencyDS from '../DataSource/Currency/Currency'
import store from '../../store'

import Log from '../../services/Log/Log'
import walletDS from '../DataSource/Wallet/Wallet'
import cryptoWalletsDS from '../DataSource/CryptoWallets/CryptoWallets'
import _ from 'lodash'
import accountDS from '../DataSource/Account/Account'
import cardDS from '../DataSource/Card/Card'
import accountBalanceActions from './AccountBalancesActions'

import transactionDS from '../DataSource/Transaction/Transaction'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

const { dispatch } = store


export async function proceedSaveGeneratedWallet(wallet) {

    Log.log('ACT/MStore proceedSaveGeneratedWallet called')

    const storedKey = await cryptoWalletsDS.saveWallet(wallet)

    await cryptoWalletsDS.setSelectedWallet(storedKey)

    await walletDS.saveWallet(storedKey, wallet.walletName, '')

    await accountDS.discoverAccounts(storedKey)

    await accountBalanceActions.initBalances(storedKey)

    Log.log('ACT/MStore proceedSaveGeneratedWallet finished', storedKey)
}

export async function proceedGenerateWallet() {

    Log.log('ACT/MStore proceedGenerateWallet called')

    const storedKey = await cryptoWalletsDS.generateWallet()

    await cryptoWalletsDS.setSelectedWallet(storedKey)

    await walletDS.saveWallet(storedKey, 'TRUSTEE', '')

    await accountDS.discoverAccounts(storedKey)

    await accountBalanceActions.initBalances(storedKey)

    Log.log('ACT/MStore proceedGenerateWallet finished', storedKey)
}

export async function setAvailableWallets() {
    const { array: wallets } = await walletDS.getWallets()

    dispatch({
        type: 'SET_WALLET_LIST',
        wallets
    })

    return wallets
}

export async function setSelectedWallet() {
    const { array: wallets } = await walletDS.getWallets()

    const walletHash = await cryptoWalletsDS.getSelectedWallet()

    const wallet = _.find(wallets, { wallet_hash: walletHash })

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

export async function setCurrencies() {

    const { fiatRatesStore, settingsStore } = store.getState()
    const { wallet_hash: walletHash } = store.getState().mainStore.selectedWallet

    Log.log('ACT/MStore setCurrencies called')

    let prepare = []

    const { array: currencies } = await currencyDS.getCurrencies()

    for (let currencyDBTmp of currencies) {

        let settings = BlocksoftDict.Currencies[currencyDBTmp.currency_code]

        if (typeof settings === 'undefined') continue

        currencyDBTmp.currencyBalanceAmount = ''

        if (typeof settings.extendsProcessor === 'undefined') {
            prepare.push({
                ...settings,
                ...currencyDBTmp
            })

        } else {
            let extendsSettings = BlocksoftDict.Currencies[settings.extendsProcessor]
            prepare.push({
                ...extendsSettings,
                ...settings,
                ...currencyDBTmp
            })
        }

    }

    try {

        const { array: currenciesBalanceAmount } = await currencyDS.getCurrencyBalanceAmount(walletHash)

        for (let obj of prepare) {
            const tmpObj = currenciesBalanceAmount.find((item) => item.currency_code == obj.currency_code)
            obj.currencyBalanceAmountRaw = tmpObj.currencyBalanceAmount
            obj.currencyBalanceAmount = BlocksoftPrettyNumbers.setCurrencyCode(obj.currency_code).makePrettie(tmpObj.currencyBalanceAmount)
        }

        Log.log('ACT/MStore setCurrencies finished')

    } catch (e) {
        Log.log('ACT/MStore setCurrencies error', e)
    }

    dispatch({
        type: 'SET_CURRENCIES',
        currencies: prepare
    })

    return prepare
}

export function setSelectedCryptocurrency(data) {
    Log.log('ACT/MStore setSelectedCryptocurrency called', data)
    dispatch({
        type: 'SET_SELECTED_CRYPTOCURRENCY',
        selectedCryptoCurrency: data
    })
}

export async function setSelectedAccount() {
    Log.log('ACT/MStore setSelectedAccount called')

    const wallet = store.getState().mainStore.selectedWallet
    const currency = store.getState().mainStore.selectedCryptoCurrency

    Log.log('ACT/MStore setSelectedAccount', { wallet, currency })

    const { array: accounts } = await accountDS.getAccountData(wallet.wallet_hash, currency.currency_code)

    const { array: transactions } = await transactionDS.getTransactions({ account_id: accounts[0].id })

    accounts[0].transactions = transactions
    accounts[0].balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(accounts[0].currency_code).makePrettie(accounts[0].balance)

    dispatch({
        type: 'SET_SELECTED_ACCOUNT',
        selectedAccount: accounts[0]
    })
}

export function setSelectedCrypto(data) {
    Log.log('ACT/MStore setSelectedCrypto called', data)
    return {
        type: 'SET_SELECTED_CRYPTO',
        crypto: data
    }
}

export function setInitState(data) {
    Log.log('ACT/MStore setInitState called', data)
    return {
        type: 'SET_INIT_STATE',
        init: data
    }
}

export async function setCards() {
    Log.log('ACT/MStore setCards called')

    const { array: cards } = await cardDS.getCards()
    cards.unshift({
        name: 'Add new card',
        type: 'ADD'
    })


    dispatch({
        type: 'SET_CARDS',
        cards
    })

    Log.log('ACT/MStore setCards finished')
}

export async function deleteCard(cardID) {
    Log.log('ACT/MStore deleteCard called')

    setLoaderStatus(true)

    try {
        await cardDS.deleteCard(cardID)
        await setCards()
        Log.log('ACT/MStore deleteCard finished')
    } catch (e) {
        Log.err('ACT/MStore deleteCard error', e)
    }

    setLoaderStatus(false)
}
