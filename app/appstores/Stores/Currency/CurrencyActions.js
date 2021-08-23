/**
 * @version 0.9
 */

import store from '@app/store'

import currencyDS from '@app/appstores/DataSource/Currency/Currency'
import accountDS from '@app/appstores/DataSource/Account/Account'
import accountBalanceDS from '@app/appstores/DataSource/AccountBalance/AccountBalance'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'

import { setLoaderStatus } from '../Main/MainStoreActions'
import Log from '@app/services/Log/Log'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftPrettyLocalize from '@crypto/common/BlocksoftPrettyLocalize'

import UpdateCurrencyRateDaemon from '@app/daemons/back/UpdateCurrencyRateDaemon'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
const { dispatch } = store

const currencyActions = {

    init: async function () {
        await currencyActions.setCryptoCurrencies()
    },

    updateCryptoCurrencies: async function (data) {
        dispatch({
            type: 'UPDATE_CRYPTO_CURRENCIES',
            cryptoCurrencies: data
        })
    },

    setCryptoCurrencies: async function () {
        const prepare = []

        const currencies = await currencyDS.getCurrencies()

        let currencyDBTmp
        for (currencyDBTmp of currencies) {

            const settings = BlocksoftDict.Currencies[currencyDBTmp.currencyCode]

            if (typeof settings === 'undefined') continue

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

        dispatch({
            type: 'SET_CRYPTO_CURRENCIES',
            cryptoCurrencies: prepare
        })

        return prepare
    },

    /**
     * @param params.cryptoCurrency
     * @param params.account
     * @returns {boolean}
     */
    checkIsCurrencySynchronized: (params) => {
        try {

            return !(typeof params.account === 'undefined' || !params.account.balanceScanTime)

        } catch (e) {
            Log.err('ACT/Currency checkIsCurrencySynchronized error ' + e.message, JSON.stringify(e))
        }
    },

    addOrShowMainCurrency : async (currencyCode, tokenType)  => {
        if (currencyCode === 'VET') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'VTHO', newIsHidden : 0, currentIsHidden : 0})
        } else if (currencyCode === 'VTHO') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'VET', newIsHidden : 0, currentIsHidden : 0})
        } else if (tokenType === 'BITCOIN') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'BTC', newIsHidden : 0, currentIsHidden : 0})
        } else if (tokenType === 'SOLANA') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'SOL', newIsHidden : 0, currentIsHidden : 0})
        } else if (tokenType === 'TRX' || tokenType === 'TRON') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'TRX', newIsHidden : 0, currentIsHidden : 0})
        } else if (tokenType === 'BNB_SMART_20' || tokenType === 'BNB') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'BNB_SMART', newIsHidden : 0, currentIsHidden : 0})
        } else if (tokenType === 'ETH_ERC_20' || tokenType === 'ETHEREUM') {
            await currencyActions.toggleCurrencyVisibility({ currencyCode : 'ETH', newIsHidden : 0, currentIsHidden : 0})
        }
    },

    addCurrency: async (currencyToAdd, isHidden = 0, isLoader = 1) => {

        isLoader ? setLoaderStatus(true) : null

        Log.log('ACT/Currency addCurrency started')

        let errorStepMsg = ''
        let mainCurrencyNotAdded = true
        try {
            errorStepMsg = 'walletDS.getWallets started'
            const wallets = await walletDS.getWallets()

            const accountBalanceInsertObjs = []

            let tmpCodes = [currencyToAdd.currencyCode]

            const settings = BlocksoftDict.getCurrencyAllSettings(currencyToAdd.currencyCode)
            if (typeof settings.addressCurrencyCode !== 'undefined' && typeof settings.tokenBlockchain !== 'undefined' && settings.tokenBlockchain !== 'BITCOIN' ) {
                const { accountList } = store.getState().accountStore
                for (const wallet of wallets) {
                    const walletHash = wallet.walletHash
                    if (typeof accountList[walletHash] === 'undefined' || typeof accountList[walletHash][settings.addressCurrencyCode] === 'undefined') {
                        tmpCodes = [settings.addressCurrencyCode, currencyToAdd.currencyCode]
                        mainCurrencyNotAdded = false
                        break
                    }
                }
            }

            for (const wallet of wallets) {

                const walletHash = wallet.walletHash

                errorStepMsg = 'accountsDS.discoverAddresses started'

                await accountDS.discoverAccounts({ walletHash, currencyCode: tmpCodes }, 'CREATE_CURRENCY')
                errorStepMsg = 'accountsDS.discoverAddresses finished'

                for (const tmpCode of tmpCodes) {
                    const dbAccounts = await accountDS.getAccounts({ walletHash, currencyCode: tmpCode })
                    if (dbAccounts && typeof dbAccounts[0] !== 'undefined' && typeof dbAccounts[0].id !== 'undefined') {

                        const { id: insertID } = dbAccounts[0]

                        accountBalanceInsertObjs.push({
                            balanceFix: 0,
                            unconfirmedFix: 0,
                            balanceScanTime: 0,
                            balanceScanLog: '',
                            status: 0,
                            currencyCode: tmpCode,
                            walletHash: walletHash,
                            accountId: insertID
                        })
                    }
                }
            }
            if (accountBalanceInsertObjs && accountBalanceInsertObjs.length > 0) {
                errorStepMsg = 'accountBalanceDS.insertAccountBalance started'
                await accountBalanceDS.insertAccountBalance({ insertObjs: accountBalanceInsertObjs })
                errorStepMsg = 'accountBalanceDS.insertAccountBalance finished'
            }

            for (const tmpCode of tmpCodes) {
                const currencyInsertObjs = {
                    currencyCode: tmpCode,
                    currencyRateScanTime: 0,
                    isHidden: isHidden
                }
                try {
                    await currencyDS.insertCurrency({ insertObjs: [currencyInsertObjs] })
                } catch (e) {
                    Log.log('ACT/Currency addCurrency insertCurrency error ' + e.message + ' in ' + tmpCode)
                }
            }



            await currencyActions.setCryptoCurrencies()
            await UpdateCurrencyRateDaemon.updateCurrencyRate({ source: 'ACT/Currency addCurrency' })
            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: currencyToAdd.currencyCode })

            Log.log('ACT/Currency addCurrency finished')
        } catch (e) {

            if (e.message) {
                e.message = errorStepMsg + ' ' + e.message
            } else {
                e.message = errorStepMsg
            }
            e.message += ' currencyToAdd = ' + JSON.stringify(currencyToAdd)

            Log.err('ACT/Currency addCurrency error ' + e.message)
        }

        setLoaderStatus(false)
        return mainCurrencyNotAdded
    },

    /**
     *
     * @param {string} params.currencyCode
     * @param {integer} params.newIsHidden
     * @param {integer} params.currentIsHidden
     * @returns {Promise<void>}
     */
    toggleCurrencyVisibility: async (params) => {

        setLoaderStatus(true)

        Log.log('ACT/Currency toggleCurrencyVisibility called ', params)

        try {

            // binary from int - for support of old stored values
            const selectedWalletNumber = store.getState().mainStore.selectedWallet.walletNumber
            const currentIsHidden = Number(params.currentIsHidden || 0).toString(2).split('').reverse() // split to binary
            for (let i = 0; i <= MarketingEvent.DATA.LOG_WALLETS_COUNT; i++) {
                if (typeof currentIsHidden[i] === 'undefined') {
                    currentIsHidden[i] = 0
                }
            }
            currentIsHidden[selectedWalletNumber] = params.newIsHidden
            const isHidden = parseInt(currentIsHidden.reverse().join(''), 2)
            Log.log('ACT/Currency toggleCurrencyVisibility selectedWalletNumber ' + selectedWalletNumber + ' isHidden ' + isHidden, JSON.stringify(currentIsHidden))
            await currencyDS.updateCurrency({
                key: {
                    currencyCode: params.currencyCode
                },
                updateObj: {
                    isHidden
                }
            })
            await currencyActions.updateCryptoCurrencies([{ currencyCode: params.currencyCode, isHidden }])

        } catch (e) {
            Log.err('ACT/Currency toggleCurrencyVisibility error ' + e.message)
        }

        Log.log('ACT/Currency toggleCurrencyVisibility finished')

        setLoaderStatus(false)
    }

}

export default currencyActions
