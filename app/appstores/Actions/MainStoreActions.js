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

import settingsActions from './SettingsActions'
import BlocksoftPrettyLocalize from '../../../crypto/common/BlocksoftPrettyLocalize'
import walletPubDS from '../DataSource/WalletPub/WalletPub'

const { dispatch } = store

export async function proceedSaveGeneratedWallet(wallet, source = 'GENERATION', walletIsBackedUp = 0) {

    let storedKey

    const prevWallet = await cryptoWalletsDS.getSelectedWallet()

    try {
        Log.log('ACT/MStore proceedSaveGeneratedWallet called prevWallet ' + prevWallet)

        storedKey = await cryptoWalletsDS.saveWallet(wallet)

        await cryptoWalletsDS.setSelectedWallet(storedKey)

        await walletDS.saveWallet(storedKey, wallet.walletName, '', walletIsBackedUp)

        let derivations = false
        if (source === 'IMPORT') {
            derivations = await walletPubDS.discoverOnImport({ walletHash: storedKey, derivations })
        }
        console.log(source, derivations)
        await accountDS.discoverAccounts({ walletHash: storedKey, fullTree: false, source, derivations }, source)

        await accountBalanceActions.initBalances(storedKey)

        Log.log('ACT/MStore proceedSaveGeneratedWallet finished storedWallet ' + storedKey)

    } catch (e) {

        await accountDS.clearAccounts({ walletHash: storedKey })

        await walletDS.clearWallet({ walletHash: storedKey })

        if (prevWallet && prevWallet !== storedKey) {
            await cryptoWalletsDS.setSelectedWallet(prevWallet)
        }

        Log.log('ACT/MStore proceedSaveGeneratedWallet tryWallet ' + storedKey + ' prevWallet ' + prevWallet + ' error ' + e.message)

        throw e
    }

    return storedKey
}

export async function proceedGenerateWallet() {

    Log.log('ACT/MStore proceedGenerateWallet called')

    const storedKey = await cryptoWalletsDS.generateWallet()

    await cryptoWalletsDS.setSelectedWallet(storedKey)

    await walletDS.saveWallet(storedKey, 'TRUSTEE', '')

    await accountDS.discoverAccounts({ walletHash: storedKey }, 'CREATE_WALLET')

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

    const { wallet_hash: walletHash } = store.getState().mainStore.selectedWallet

    Log.log('ACT/MStore setCurrencies called')

    const prepare = []

    const { array: currencies } = await currencyDS.getCurrencies()

    let currencyDBTmp
    for (currencyDBTmp of currencies) {

        const settings = BlocksoftDict.Currencies[currencyDBTmp.currency_code]

        if (typeof settings === 'undefined') continue

        currencyDBTmp.currencyBalanceAmount = ''

        let one
        if (typeof settings.extendsProcessor === 'undefined') {
            one = {
                ...settings,
                ...currencyDBTmp
            }
        } else {
            const extendsSettings = BlocksoftDict.Currencies[settings.extendsProcessor]
            one = {
                ...extendsSettings,
                ...settings,
                ...currencyDBTmp
            }
        }
        one.currencyExplorerLink = BlocksoftPrettyLocalize.makeLink(one.currencyExplorerLink)
        one.currencyExplorerTxLink = BlocksoftPrettyLocalize.makeLink(one.currencyExplorerTxLink)
        prepare.push(one)
    }

    try {

        const { array: currenciesBalanceAmount } = await currencyDS.getCurrencyBalanceAmount(walletHash)

        if (currenciesBalanceAmount) {
            let obj
            for (obj of prepare) {
                Log.log('ACT/MStore setCurrencies obj', JSON.stringify(obj).substr(0, 100))
                obj.walletHash = walletHash
                const tmpObj = currenciesBalanceAmount.find((item) => item.currency_code == obj.currency_code)
                if (tmpObj) {
                    obj.currencyBalanceAmountRaw = tmpObj.currencyBalanceAmount
                    obj.currencyBalanceAmount = BlocksoftPrettyNumbers.setCurrencyCode(obj.currency_code).makePrettie(tmpObj.currencyBalanceAmount)
                } else {
                    obj.currencyBalanceAmountRaw = 0
                    obj.currencyBalanceAmount = 0
                }
            }
        }

        Log.log('ACT/MStore setCurrencies finished')

    } catch (e) {
        Log.err('ACT/MStore setCurrencies error ' + e.message)
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


export async function setSelectedSegwitOrNot() {
    Log.log('ACT/MStore setSelectedSegwitOrNot called')
    let setting = await settingsActions.getSetting('btc_legacy_or_segwit')
    setting = setting === 'segwit' ? 'legacy' : 'segwit'
    await settingsActions.setSettings('btc_legacy_or_segwit', setting)
    Log.log('ACT/MStore setSelectedSegwitOrNot finished ' + setting)
    return setting
}

export async function setSelectedAccountAsUsed(address) {
    Log.log('ACT/MStore setSelectedAccountAsUsed called ' + address)
    const wallet = store.getState().mainStore.selectedWallet
    const count = await accountDS.countUsed({wallet_hash : wallet.wallet_hash, currency_code : 'BTC'})
    if (count > 9000) {
        return 'error.too.much.addresses'
    }
    await accountDS.massUpdateAccount([`'${address}'`], 'address', 'already_shown=1')
    const account = store.getState().mainStore.selectedAccount
    if (account) {
        if (account.address === address) {
            setSelectedAccount()
        }
    }
    Log.log('ACT/MStore setSelectedAccountAsUsed finished ' + address)
    return count > 8900 ? 'error.near.too.much.addresses' : false
}

export async function setSelectedAccount(setting) {
    Log.log('ACT/MStore setSelectedAccount called')

    const wallet = store.getState().mainStore.selectedWallet
    const currency = store.getState().mainStore.selectedCryptoCurrency

    let accounts
    if (currency.currency_code === 'BTC') {
        if (typeof setting === 'undefined') {
            setting = await settingsActions.getSetting('btc_legacy_or_segwit')
            if (!setting) {
                setting = 'legacy'
            }
        }

        Log.log('ACT/MStore setSelectedAccount BTC', { wallet, currency, setting })

        accounts = await accountDS.getAccountData({ wallet_hash: wallet.wallet_hash, currency_code: currency.currency_code, segwit: setting, not_already_shown: wallet.wallet_is_hd })
        if (wallet.wallet_is_hd) {
            let needSegwit = false
            let needLegacy = false
            if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
                needSegwit = true
            }
            if (typeof accounts.legacy === 'undefined' || !accounts.legacy || accounts.legacy.length === 0) {
                needLegacy = true
            }
            if (needSegwit || needLegacy) {
                await walletPubDS.discoverMoreAccounts({ walletHash: wallet.wallet_hash, currencyCode: currency.currency_code, needSegwit, needLegacy })
                accounts = await accountDS.getAccountData({ wallet_hash: wallet.wallet_hash, currency_code: currency.currency_code, segwit: setting, not_already_shown: wallet.wallet_is_hd })
            }
            if (!accounts) {
                accounts = await accountDS.getAccountData({ wallet_hash: wallet.wallet_hash, currency_code: currency.currency_code, segwit: setting})
            }
        }
        if (setting === 'segwit') {
            if (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0) {
                Log.log('ACT/MStore setSelectedAccount GENERATE SEGWIT')
                accounts.segwit = await accountDS.discoverAccounts({ walletHash: wallet.wallet_hash, currencyCode: ['BTC_SEGWIT'] })
            }
            accounts[0] = accounts.segwit[0]
            accounts[0].addressType = 'SegWit'
        } else {
            accounts[0] = accounts.legacy[0]
            accounts[0].addressType = 'Legacy'
        }


        if (!accounts || !accounts[0]) {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET BTC ' + setting)
            // here could be more generation
        }
    } else {

        Log.log('ACT/MStore setSelectedAccount OTHER', { wallet, currency })

        accounts = await accountDS.getAccountData({ wallet_hash: wallet.wallet_hash, currency_code: currency.currency_code })

        if (!accounts || !accounts[0]) {
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET OTHER')
        }

    }

    accounts[0].transactions = await transactionDS.getTransactions({ wallet_hash: wallet.wallet_hash, currency_code: currency.currency_code })
    //console.log('tx', accounts[0].transactions)
    accounts[0].balancePretty = 0
    try {
        accounts[0].balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(accounts[0].currency_code).makePrettie(accounts[0].balance)
    } catch (e) {
        Log.err('MainStoreActions error ' + e.message + ' with item ' + JSON.stringify(accounts[0]))
    }

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

export function setInitError(data) {
    Log.log('ACT/MStore setInitError called', data)
    return {
        type: 'SET_INIT_ERROR',
        initError: data
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
        Log.err('ACT/MStore deleteCard error ' + e.message)
    }

    setLoaderStatus(false)
}
