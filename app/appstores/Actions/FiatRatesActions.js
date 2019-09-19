import AsyncStorage from '@react-native-community/async-storage'

import store from '../../store'

import settingsActions from './SettingsActions'

import api from '../../services/api'
import Log from '../../services/Log/Log'

const { dispatch } = store

import currencies from '../../assets/jsons/other/country-by-currency-code'

export default new class FiatRatesActions {

    async init() {

        let nbuRates = null

        try {

            const res = await api.getNBURates()

            if (res.data.state === 'success') {
                nbuRates = res.data.data
                nbuRates.push({
                    cc: 'UAH',
                    rate: 1
                })

                await AsyncStorage.setItem('fiatRates', JSON.stringify(nbuRates))
            } else {
                nbuRates = await AsyncStorage.getItem('fiatRates')
                nbuRates = JSON.parse(nbuRates)
            }

            this.setNBURates(nbuRates)

        } catch (e) {
            Log.err('ACT/FiatRates init error', e)
        }

        if (nbuRates === null) {
            try {
                nbuRates = await AsyncStorage.getItem('fiatRates')
                nbuRates = JSON.parse(nbuRates)
                this.setNBURates(nbuRates)
            } catch (e) {
                Log.err('ACT/FiatRates init second try error', e)
            }
        }
    }

    setNBURates = (nbuRates) => {

        const { settingsStore } = store.getState()

        const uahRate = nbuRates.find(item => item.cc === 'USD')
        const localCurrency = nbuRates.find(item => item.cc === settingsStore.data.local_currency)
        const localCurrencySymbol = currencies.find(item => item.currencyCode === settingsStore.data.local_currency)

        dispatch({
            type: 'SET_INIT_DATA',
            fiatRates: nbuRates,
            uahRate: uahRate.rate,
            localCurrencyRate: localCurrency.rate,
            localCurrencySymbol: localCurrencySymbol.symbol
        })

    }

    toLocalCurrency = (amount) => {
        const { fiatRatesStore } = store.getState()

        return ((amount * fiatRatesStore.uahRate) / fiatRatesStore.localCurrencyRate).toFixed(2)
    }

    setLocalCurrency = async (localCurrency) => {
        await settingsActions.setSettings('local_currency', localCurrency)
        this.init()
    }

}
