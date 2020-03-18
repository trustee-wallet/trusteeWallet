import AsyncStorage from '@react-native-community/async-storage'

import store from '../../store'

import settingsActions from './SettingsActions'

import api from '../../services/api'
import Log from '../../services/Log/Log'

const { dispatch } = store

import currencies from '../../assets/jsons/other/country-by-currency-code'
import utils from '../../services/utils'

export default new class FiatRatesActions {

    tryCounter = 0

    async init() {

        let nbuRates = null

        try {
            const res = await api.getNBURates()
            let nbuRatesTmp = []

            nbuRates = res.data

            nbuRates.push({
                cc: 'UAH',
                rate: 1,
                r030: 804
            })

            nbuRates.forEach(item1 => currencies.forEach(item2 => {
                if(item1.cc === item2.currencyCode) nbuRatesTmp.push({...item1, symbol: item2.symbol })
            }))

            await AsyncStorage.setItem('fiatRates', JSON.stringify(nbuRatesTmp))

            if(nbuRatesTmp.length < 5){
                throw new Error("NBU rates less than 5!!!! Check api!!!")
            }

            this.setNBURates(nbuRatesTmp)
            this.tryCounter = 0
            return
        } catch (e) {

            nbuRates = null

            if (Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.log('ACT/FiatRates.init network try ' + this.tryCounter + ' ' + e.message)
            } else {
                let error = ' ' + e.message
                if (typeof (e._response) != 'undefined') {
                    error += ' ' + e._response
                }
                Log.err('ACT/FiatRates.init error' + error)
            }
        }

        if (nbuRates === null) {
            try {
                nbuRates = await AsyncStorage.getItem('fiatRates')
                nbuRates = JSON.parse(nbuRates)

                if(nbuRates === null){
                    dispatch({
                        type: 'SET_INIT_DATA',
                        fiatRates: [
                            {
                                cc: "USD",
                                rate: 1,
                                symbol: "$"
                            }
                        ],
                        uahRate: 1,
                        localCurrencyRate: 1,
                        localCurrencySymbol: "$"
                    })
                } else {
                    this.setNBURates(nbuRates)
                }
            } catch (e) {
                Log.err('ACT/FiatRates init second try error ' + e.message)
            }
        }


    }

    convertFromCurrencyTo = (fromCurrency, toCurrency, amount) => {

        const fiatRates = JSON.parse(JSON.stringify(store.getState().fiatRatesStore.fiatRates))

        let fromCurrencyRate = fiatRates.filter(item => item.cc === fromCurrency)
        fromCurrencyRate = fromCurrencyRate[0]
        let toCurrencyRate = fiatRates.filter(item => item.cc === toCurrency)
        toCurrencyRate = toCurrencyRate[0]

        return (amount * fromCurrencyRate.rate) / toCurrencyRate.rate
    }

    setNBURates = (nbuRates) => {
        if (!nbuRates) return false
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

    toLocalCurrency = (amount, fixed = true, fractionDigits = 2) => {
        const { fiatRatesStore } = store.getState()

        let toLocal = (amount * fiatRatesStore.uahRate) / fiatRatesStore.localCurrencyRate
        toLocal = fixed ? toLocal.toFixed(fractionDigits) : toLocal

        return toLocal
    }

    /**
     * @param {string} params.localCurrency = 'UAH'
     * @param {string} params.currencyCode = 'ETH'
     * @param {int} params.currencyBalanceAmount
     * @param {int} params.currencyRateUsd
     * @returns {string|number}
     */
    toGeneralLocalCurrency = (params) => {
        if (params.currencyCode === 'ETH_UAX') {
            if (typeof params.localCurrency !== 'undefined' && params.localCurrency === 'UAH') {
                return params.currencyBalanceAmount
            }
        }
        const fiatEquivalent = params.currencyRateUsd * params.currencyBalanceAmount
        return utils.prettierNumber(this.toLocalCurrency(fiatEquivalent, false), 2)
    }

    setLocalCurrency = async (localCurrency) => {
        await settingsActions.setSettings('local_currency', localCurrency)
        this.init()
    }

}
