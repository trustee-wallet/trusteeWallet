/**
 * @version 0.9
 */
import store from '@app/store'

import Log from '@app/services/Log/Log'

import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import walletPubDS from '@app/appstores/DataSource/Wallet/WalletPub'
import accountDS from '@app/appstores/DataSource/Account/Account'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import DaemonCache from '@app/daemons/DaemonCache'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import transactionActions from '@app/appstores/Actions/TransactionActions'
import UIDict from '@app/services/UIDict/UIDict'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import Database from '@app/appstores/DataSource/Database/main'


const { dispatch } = store

export async function setSelectedWallet(source, walletHash = false) {
    Log.log('ACT/MStore setSelectedWallet called ' + source)

    let settingsWalletHash = false
    if (typeof walletHash === 'undefined' || !walletHash) {
        settingsWalletHash = await settingsActions.getSelectedWallet('setSelectedWallet')
    }
    if (settingsWalletHash) {
        walletHash = settingsWalletHash
    }

    const oldData = store.getState().walletStore.wallets
    let wallet = false
    let lastWalletHash = false
    let lastWallet = false
    if (oldData) {
        for (const tmp of oldData) {
            lastWalletHash = tmp.walletHash
            lastWallet = tmp
            if (tmp.walletHash === walletHash) {
                wallet = tmp
                break
            }
        }
    }
    if (!walletHash) {
        walletHash = lastWalletHash
        wallet = lastWallet
    }
    if (!wallet) {
        wallet = await walletDS.getWalletByHash(walletHash)
        if (!wallet) {
            walletHash = lastWalletHash
            wallet = lastWallet
        }
    }
    if (settingsWalletHash !== walletHash) {
        await settingsActions.setSelectedWallet(walletHash)
    }

    dispatch({
        type: 'SET_NFTS_LOADED',
        loaded: false,
        nfts : false,
        address : false
    })

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


export function setSelectedCryptoCurrency(data) {
    const dict = new UIDict(data.currencyCode)
    data.mainColor = dict.settings.colors['mainColor']
    data.darkColor = dict.settings.colors['darkColor']

    dispatch({
        type: 'SET_SELECTED_CRYPTO_CURRENCY',
        selectedCryptoCurrency: data
    })
}

export async function setSelectedAccount(source) {
    // console.log('ACT/MStore setSelectedAccount called ' + source)

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
            throw new Error('ACT/MStore setSelectedAccount NOTHING SET BTC ' + source)
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

        dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: account
        })
    } catch (e) {
        throw new Error(e.message + ' account ' + JSON.stringify(account))
    }
}
export async function setSelectedAccountAddress(accountNew) {
    const wallet = store.getState().mainStore.selectedWallet
    const account = store.getState().mainStore.selectedAccount
    if (wallet.walletHash === accountNew.walletHash && account.currencyCode === accountNew.currencyCode) {
        Log.log('ACT/MStore setSelectedAccountAddress will update', accountNew)
        dispatch({
            type: 'SET_SELECTED_ACCOUNT_BALANCE',
            selectedAccount: accountNew
        })
    } else {
        Log.log('ACT/MStore setSelectedAccountAddress will not update')
    }
}
export async function setSelectedAccountBalance(accountNew) {
    const account = store.getState().mainStore.selectedAccount
    if (account.address === accountNew.address && account.currencyCode === accountNew.currencyCode) {
        let sql2
        if (typeof accountNew?.balanceStaked !== 'undefined') {
            sql2 = `
                UPDATE account_balance
                SET balance_fix=${accountNew.balance},
                balance_txt="${accountNew.balance}",
                balance_staked_txt="${accountNew.balanceStaked}"
                WHERE currency_code="${accountNew.currencyCode}" AND account_id=${account.accountId}
            `
        } else {
            sql2 = `
                UPDATE account_balance
                SET balance_fix=${accountNew.balance},
                balance_txt="${accountNew.balance}"
                WHERE currency_code="${accountNew.currencyCode}" AND account_id=${account.accountId}
            `
        }
        await Database.query(sql2)



        dispatch({
            type: 'SET_SELECTED_ACCOUNT_BALANCE',
            selectedAccount: accountNew
        })
    }
}

export async function setSelectedAccountTransactions(source) {
    try {
        const wallet = store.getState().mainStore.selectedWallet
        const account = store.getState().mainStore.selectedAccount
        const filter = store.getState().mainStore.filter
        const transactionsToView = []

        const params = {
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            limitFrom: 0,
            limitPerPage: 1,
            startTime: filter?.startTime || null,
            endTime: filter?.endTime || null,
            startAmount: filter?.startAmount || null,
            endAmount: filter?.endAmount || null,
            searchQuery: filter?.searchQuery || null,
            filterDirectionHideIncome: filter?.filterDirectionHideIncome || null,
            filterDirectionHideOutcome: filter?.filterDirectionHideOutcome || null,
            filterStatusHideCancel: filter?.filterStatusHideCancel || null,
            filterTypeHideFee: filter?.filterTypeHideFee || null,
            filterTypeHideSwap: filter?.filterTypeHideSwap || null,
            filterTypeHideStake: filter?.filterTypeHideStake || null,
            filterTypeHideWalletConnect: filter?.filterTypeHideWalletConnect || null,
            filterTypeShowSpam: filter?.filterTypeShowSpam || null
        }

        const tmp = await transactionDS.getTransactions(params, 'ACT/MStore setSelectedAccount.transactionInfinity list')
        if (tmp && tmp.length > 0) {
            for (let transaction of tmp) {
                transaction = transactionActions.preformatWithBSEforShow(transactionActions.preformat(transaction, { account }), transaction.bseOrderData, account.currencyCode)
                transactionsToView.push(transaction)
            }
        }
        dispatch({
            type: 'SET_SELECTED_ACCOUNT_TRANSACTIONS',
            selectedAccountTransactions: {
                transactionsToView,
                transactionsLoaded: new Date().getTime()
            }
        })
    } catch (e) {
        e.message += ' while setSelectedAccountTransactions from ' + source
        throw e
    }
}

export function setSelectedTransaction(tx, source) {
    try {

        const transactions = store.getState().mainStore.selectedAccountTransactions

        const transactionsToView = transactions.transactionsToView.map(item => {
            if (item.id === tx.id) {
                return tx
            }
            return item
        })

        dispatch({
            type: 'SET_SELECTED_ACCOUNT_TRANSACTIONS',
            selectedAccountTransactions: {
                transactionsToView,
                transactionsLoaded: new Date().getTime()
            }
        })

    } catch (e) {
        e.message += ' while setSelectedTransaction from ' + source
        throw e
    }
}

export function setSelectedWalletName(walletName) {
    dispatch({
        type: 'SET_SELECTED_WALLET_NAME',
        walletName
    })
}

export function setBseLink(bseLink) {
    dispatch({
        type: 'SET_BSE_LINK',
        bseLink
    })
}

export function setLoaderFromBse(loaderFromBse) {
    dispatch({
        type: 'SET_LOADER_BSE',
        loaderFromBse
    })
}

export function setSolValidator(solValidator) {
    dispatch({
        type: 'SET_SOL_VALIDATOR',
        solValidator
    })
}

export function setFilter(filter, source = '') {
    dispatch({
        type: 'SET_FILTER',
        filter
    })
}

export function setSortValue(sortValue) {
    dispatch({
        type: 'SET_SORT_VALUE',
        sortValue
    })
}

export async function setStakingCoins() {

    const stakingCoins = await BlocksoftExternalSettings.get('STAKING_COINS_PERCENT')

    dispatch({
        type: 'SET_STAKING_COINS',
        stakingCoins
    })
}

export function setHomeFilterWithBalance(homeFilterWithBalance) {
    dispatch({
        type: 'SET_HOME_FILTER_WITH_BALANCE',
        homeFilterWithBalance
    })
}
