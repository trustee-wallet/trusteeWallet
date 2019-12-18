/**
 * @typedef {Object} trusteeStore
 * @property {*} mainStore
 * @property {*} mainStore.init
 * @property {*} mainStore.wallets
 * @property {*} mainStore.cards
 * @property {*} mainStore.accounts
 * @property {*} mainStore.currencies
 * @property {*} mainStore.currencies[].currencyName
 * @property {*} mainStore.currencies[].currencyCode
 * @property {*} mainStore.currencies[].currencySumbol
 * @property {*} mainStore.currencies[].network
 * @property {*} mainStore.currencies[].currencyExplorerLink
 * @property {*} mainStore.currencies[].currencyExplorerTxLink
 * @property {*} mainStore.currencies[].currency_rate_scan_time
 * @property {*} mainStore.currencies[].currency_rate_json
 * @property {*} mainStore.currencies[].currency_rate_usd
 * @property {*} mainStore.currencies[].currency_code
 * @property {*} mainStore.currencies[].currencyBalanceAmount
 * @property {*} mainStore.currencies[].currencyBalanceAmountRaw
 * @property {*} mainStore.selectedWallet
 * @property {*} mainStore.selectedWallet.wallet_json
 * @property {*} mainStore.selectedWallet.wallet_name
 * @property {*} mainStore.selectedWallet.wallet_hash
 * @property {*} mainStore.selectedCurrency
 * @property {*} mainStore.selectedAccount
 * @property {*} daemonStore.currencyRateDaemonData
 * @property {*} daemonStore.currencyRateDaemonData.updated
 * @property {*} daemonStore.currencyRateDaemonData.rates
 * @property {*} daemonStore.accountBalanceDaemonData
 * @property {*} daemonStore.accountBalanceDaemonData.updated
 * @property {*} daemonStore.accountBalanceDaemonData.accounts
 * @property {*} daemonStore.accountBalanceDaemonData.accounts[].balance
 * @property {*} daemonStore.accountBalanceDaemonData.accounts[].balanceScanTime
 * @property {*} daemonStore.accountBalanceDaemonData.accounts[].currencyCode
 * @property {*} daemonStore.accountBalanceDaemonData.accounts[].walletHash
 * @property {*} daemonStore.accountBalanceDaemonData.accounts[].id
 * @property {*} daemonStore.accountTransactionsDaemonData
 * @property {*} daemonStore.accountTransactionsDaemonData.updated
 * @property {*} daemonStore.accountTransactionsDaemonData.accounts
 * @property {*} daemonStore.walletFiatBalanceAmount
 *
 */
import store from '../../../store'
import currencyDS from '../../DataSource/Currency/Currency'
import transactionDS from '../../DataSource/Transaction/Transaction'
import accountDS from '../../DataSource/Account/Account'

import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import Log from '../../../services/Log/Log'


const { dispatch } = store

store.subscribe(() => {

    /**
     * @type {trusteeStore}
     */
    const state = store.getState()

    const { wallet_hash } = state.mainStore.selectedWallet

    // @todo ksu optimize and move to some subclass
    if (state.mainStore.currencies && state.mainStore.currencies.length > 0) {

        if (state.daemonStore.currencyRateDaemonData.rates.newData
            && state.daemonStore.currencyRateDaemonData.updated
            && state.daemonStore.currencyRateDaemonData.updated > currencyRateDaemonDataUpdated
        ) {
            afterCurrencyRateDaemonData(state.daemonStore.currencyRateDaemonData.rates.newData)
        }

        if (state.daemonStore.accountBalanceDaemonData.accounts
            && state.daemonStore.accountBalanceDaemonData.accounts.length > 0
            && state.daemonStore.accountBalanceDaemonData.updated
            && state.daemonStore.accountBalanceDaemonData.updated > accountBalanceDaemonDataUpdated
        ) {
            let letsUpdateAllCurrenciesInCurrentWallet = false
            try {
                for (let account of state.daemonStore.accountBalanceDaemonData.accounts) {
                    if (account.walletHash !== wallet_hash) continue
                    letsUpdateAllCurrenciesInCurrentWallet = true
                    break
                }
            } catch (e) {
                throw new Error('Store.subscribe state.daemonStore.accountBalanceDaemonData.accounts iterator error ' + e.message)
            }

            if (letsUpdateAllCurrenciesInCurrentWallet) {
                accountBalanceDaemonDataUpdated = state.daemonStore.accountBalanceDaemonData.updated
                afterAccountBalanceDaemonData(wallet_hash)
            }
        }


        if (state.daemonStore.accountTransactionsDaemonData.accounts
            && state.daemonStore.accountTransactionsDaemonData.updated
            && state.daemonStore.accountTransactionsDaemonData.updated > accountTransactionsDaemonDataUpdated
        ) {
            accountTransactionsDaemonDataUpdated = state.daemonStore.accountTransactionsDaemonData.updated
            afterAccountTransactionsDaemonData(state.daemonStore.accountTransactionsDaemonData.accounts)
        }

    }
})

/**
 * @namespace Flow.updateRates
 */
let currencyRateDaemonDataUpdated = 0

async function afterCurrencyRateDaemonData(rates) {
    /**
     * @type {trusteeStore}
     */
    const state = store.getState()

    const currencies = JSON.parse(JSON.stringify(state.mainStore.currencies))

    let msg = ''
    for (let obj of currencies) {
        if (!rates[obj.currency_code]) continue
        if (obj.currency_rate_usd == rates[obj.currency_code]) continue
        obj.currency_rate_usd = rates[obj.currency_code]
        msg += ' ' + obj.currency_code + ' => ' + obj.currency_rate_usd
    }
    if (msg) {
        dispatch({
            type: 'SET_CURRENCIES',
            currencies
        })
    }

}

/**
 * @namespace Flow.updateAccountBalance
 */
let accountBalanceDaemonDataUpdated = 0

async function afterAccountBalanceDaemonData(walletHash) {
    /**
     * @type {trusteeStore}
     */
    const state = store.getState()

    Log.daemon('SB/afterAccountBalanceDaemonData called', walletHash)

    const currencies = JSON.parse(JSON.stringify(state.mainStore.currencies))

    const selectedCryptoCurrency = JSON.parse(JSON.stringify(state.mainStore.selectedCryptoCurrency))

    const selectedAccount = JSON.parse(JSON.stringify(state.mainStore.selectedAccount))

    let selectedCryptoCurrencyChanged = false

    let selectedAccountChanged = false

    const { array: tmps } = await currencyDS.getCurrencyBalanceAmount(walletHash)

    let currenciesBalanceAmount = {}
    for (let tmp of tmps) {
        currenciesBalanceAmount[tmp.currency_code] = tmp
    }
    Log.daemon('SB/afterAccountBalanceDaemonData currenciesBalanceAmount ', currenciesBalanceAmount)
    let msg = ''

    try {
        for (let objIndex in currencies) {
            const obj = currencies[objIndex]
            if (typeof currenciesBalanceAmount[obj.currency_code] === 'undefined') {
                Log.daemon('SB/afterAccountBalanceDaemonData not found ' + obj.currency_code + ' in ' + walletHash)
                continue
            }
            const tmpObj = currenciesBalanceAmount[obj.currency_code]
            Log.daemon('SB/afterAccountBalanceDaemonData found ' + obj.currency_code + ' in ' + walletHash)
            try {
                let balanceRaw = tmpObj.currencyBalanceAmount
                let balancePrettie =  BlocksoftPrettyNumbers.setCurrencyCode(obj.currencyCode).makePrettie(tmpObj.currencyBalanceAmount)
                currencies[objIndex].currencyBalanceAmountRaw = balanceRaw
                currencies[objIndex].currencyBalanceAmount = balancePrettie
                if (selectedCryptoCurrency && selectedCryptoCurrency.currencyCode === obj.currencyCode && selectedCryptoCurrency.walletHash === walletHash && selectedCryptoCurrency.currencyBalanceAmountRaw !== balanceRaw) {
                    selectedCryptoCurrencyChanged = true
                    selectedCryptoCurrency.currencyBalanceAmountRaw = balanceRaw
                    selectedCryptoCurrency.currencyBalanceAmount = balancePrettie
                }
                if (selectedAccount && selectedAccount.currency_code === obj.currencyCode && selectedAccount.wallet_hash === walletHash && selectedAccount.balance !== balanceRaw) {
                    selectedAccountChanged = true
                    selectedAccount.balance_fix = balanceRaw
                    selectedAccount.balance_txt = balanceRaw
                    selectedAccount.balance = balanceRaw
                    selectedAccount.balancePretty = balancePrettie
                }
                msg += ' ' + obj.currencyCode + ' => ' + currencies[objIndex].currencyBalanceAmount
            } catch (e) {
                Log.daemon('SB/afterAccountBalanceDaemonData currenciesBalanceAmount could not update ' + e.message)
            }
        }
    } catch (e) {
        throw new Error('Store.subscribe.afterAccountBalanceDaemonData iterator error ' + e.message)
    }

    if (msg) {
        Log.daemon('SB/afterAccountBalanceDaemonData finished', msg)
        dispatch({
            type: 'SET_CURRENCIES',
            currencies
        })
    }
    if (selectedCryptoCurrencyChanged) {
        Log.daemon('SB/afterSelectedCryptoCurrencyChanged finished')
        dispatch({
            type: 'SET_SELECTED_CRYPTOCURRENCY',
            selectedCryptoCurrency: selectedCryptoCurrency
        })
    }

    if (selectedAccountChanged) {
        Log.daemon('SB/afterSelectedAccountChanged finished')
        dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: selectedAccount
        })
    }
}

/**
 * @namespace Flow.updateAccountTransactions
 */
let accountTransactionsDaemonDataUpdated = 0

async function afterAccountTransactionsDaemonData(accounts) {
    /**
     * @type {trusteeStore}
     */
    const state = store.getState()

    const account = JSON.parse(JSON.stringify(state.mainStore.selectedAccount))

    const isOpened = accounts.find((item) => item.id == account.id)

    if (!isOpened) {
        Log.log('')
        Log.log('')
        Log.log('')
        Log.log('!!! MAIN STORE UPDATE NOT OPENED !!!')
        Log.log('')
        Log.log('')
        Log.log('')
        Log.log('')

        return false
    }

    const { array: transactions } = await transactionDS.getTransactions({ account_id: account.id })
    account.transactions = transactions
    account.balance = await accountDS.getAccountBalance(account.id)
    account.balancePretty = BlocksoftPrettyNumbers.setCurrencyCode(account.currency_code).makePrettie(account.balance)

    Log.log('')
    Log.log('')
    Log.log('')
    Log.log('!!! MAIN STORE UPDATE !!!')
    Log.log(account)
    Log.log('')
    Log.log('')
    Log.log('')

    dispatch({
        type: 'SET_SELECTED_ACCOUNT',
        selectedAccount: account
    })

    /*const account = JSON.parse(JSON.stringify(state.mainStore.account))

    const transactions = Transaction.getTransactions({account_id: account.account_id})
    /*dispatch({
      type: 'SET_CURRENCIES',
      transactions
    })*/

}
