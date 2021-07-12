/**
 * @version 0.50
 */
import store from '@app/store'

import countries from '@assets/jsons/other/country-by-currency-code'
import settingsActions from '../Settings/SettingsActions'
import ApiRates from '@app/services/Api/ApiRates'

const { dispatch } = store

const currencyBasicActions = {

    init: async function () {
        await currencyBasicActions.reloadDict()
        const currencyCode = await settingsActions.getSetting('local_currency')
        currencyBasicActions.setSelectedBasicCurrencyCode(currencyCode)
    },

    reloadDict: async function () {
        const basics = await ApiRates.getBasicCurrencies()
        const tmps = {}
        for (const tmp of countries) {
            tmps[tmp.currencyCode] = tmp
        }

        const currenciesBasic = {}
        for (const tmp of basics) {
            currenciesBasic[tmp.currencyCode] = {
                ...tmp,
                ...tmps[tmp.currencyCode]
            }
        }

        dispatch({
            type: 'SET_CURRENCIES_BASIC',
            currenciesBasic
        })
    },

    setSelectedBasicCurrencyCode: function (currencyCode) {
        const currenciesBasic = store.getState().currencyBasicStore.currenciesBasic
        if (typeof currenciesBasic === 'undefined' || typeof currenciesBasic[currencyCode] === 'undefined') {
            currencyCode = 'USD'
        }
        dispatch({
            type: 'SET_SELECTED_BASIC_CURRENCY',
            selectedBasicCurrency: currenciesBasic[currencyCode]
        })
    }

}

export default currencyBasicActions
