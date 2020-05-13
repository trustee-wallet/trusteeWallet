/**
 * @version 0.9
 */

import store from '../../../store'

import currencyDS from '../../DataSource/Currency/Currency'
import appTaskDS from '../../DataSource/AppTask/AppTask'
import accountDS from '../../DataSource/Account/Account'
import accountBalanceDS from '../../DataSource/AccountBalance/AccountBalance'
import walletDS from '../../DataSource/Wallet/Wallet'

import { setLoaderStatus } from '../Main/MainStoreActions'
import Log from '../../../services/Log/Log'

import updateAccountsDaemon from '../../../services/Daemon/elements/UpdateAccountsDaemon'

import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyLocalize from '../../../../crypto/common/BlocksoftPrettyLocalize'

import countries from '../../../assets/jsons/other/country-by-currency-code'
import settingsActions from '../Settings/SettingsActions'
import ApiRates from '../../../services/Api/ApiRates'

const { dispatch } = store

const BASIC_CURRENCIES_DICTS = {}

const currencyActions = {

    init: async function() {
        await currencyActions.setCryptoCurrencies()
        currencyActions.reloadDict()
        const currencyCode = await settingsActions.getSetting('local_currency')
        currencyActions.setSelectedBasicCurrencyCode(currencyCode)
    },

    reloadDict : async function() {
        const basicCurrencies = await ApiRates.getBasicCurrencies()
        const basicCountries = {}
        let tmp
        for (tmp of countries) {
            basicCountries[tmp.currencyCode] = tmp
        }

        for (tmp of basicCurrencies) {
            BASIC_CURRENCIES_DICTS[tmp.currencyCode] = {
                ...tmp,
                ...basicCountries[tmp.currencyCode]
            }
        }
    },

    setSelectedBasicCurrencyCode: function(currencyCode) {

        if (typeof BASIC_CURRENCIES_DICTS[currencyCode] === 'undefined') {
            currencyCode = 'USD'
        }

        dispatch({
            type: 'SET_SELECTED_BASIC_CURRENCY',
            selectedBasicCurrency: BASIC_CURRENCIES_DICTS[currencyCode]
        })
    },

    getBasicCurrencies: function() {
        return BASIC_CURRENCIES_DICTS
    },

    setCryptoCurrencies: async function() {

        const { walletHash } = store.getState().mainStore.selectedWallet

        Log.log('ACT/Currency setCryptoCurrencies called ' + walletHash)

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

    addCurrency: async (currencyToAdd, isHidden = 0, isLoader = 1) => {

        isLoader ? setLoaderStatus(true) : null

        Log.log('ACT/Currency addCurrency started')

        let errorStepMsg = ''

        try {
            errorStepMsg = 'walletDS.getWallets started'
            const wallets = await walletDS.getWallets()

            const accountBalanceInsertObjs = []

            for (const wallet of wallets) {

                const walletHash = wallet.walletHash

                errorStepMsg = 'accountsDS.discoverAddresses started'
                await accountDS.discoverAccounts({ walletHash, currencyCode: [currencyToAdd.currencyCode] }, 'CREATE_CURRENCY')
                errorStepMsg = 'accountsDS.discoverAddresses finished'

                const dbAccounts = await accountDS.getAccounts({ walletHash, currencyCode: currencyToAdd.currencyCode })

                const { id: insertID } = dbAccounts[0]

                accountBalanceInsertObjs.push({
                    balanceFix: 0,
                    unconfirmedFix: 0,
                    balanceScanTime: 0,
                    balanceScanLog: '',
                    status: 0,
                    currencyCode: currencyToAdd.currencyCode,
                    walletHash: walletHash,
                    accountId: insertID
                })
            }

            await accountBalanceDS.insertAccountBalance({ insertObjs: accountBalanceInsertObjs })

            await appTaskDS.clearTasksByCurrencyAdd({currencyCode: currencyToAdd.currencyCode})

            const currencyInsertObjs = {
                currencyCode: currencyToAdd.currencyCode,
                currencyRateScanTime: 0,
                isHidden: isHidden
            }

            await currencyDS.insertCurrency({ insertObjs: [currencyInsertObjs] })

            await currencyActions.setCryptoCurrencies()
            await updateAccountsDaemon.forceDaemonUpdate()

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
    },

    /**
     *
     * @param {string} params.currencyCode
     * @param {integer} params.isHidden
     * @returns {Promise<void>}
     */
    toggleCurrencyVisibility: async (params) => {

        setLoaderStatus(true)

        Log.log('ACT/Currency toggleCurrencyVisibility called')

        try {
            await currencyDS.updateCurrency({
                key: {
                    currencyCode: params.currencyCode
                },
                updateObj: {
                    isHidden: params.isHidden ? 0 : 1
                }
            })

            await appTaskDS.clearTasksByCurrencyAdd({currencyCode: params.currencyCode})

            await currencyActions.setCryptoCurrencies()

        } catch (e) {
            Log.err('ACT/Currency toggleCurrencyVisibility error ' + e.message)
        }

        Log.log('ACT/Currency toggleCurrencyVisibility finished')

        setLoaderStatus(false)
    }

}

export default currencyActions
