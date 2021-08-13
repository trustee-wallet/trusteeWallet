/**
 * @version 0.41
 */
import _isEqual from 'lodash/isEqual'

import Log from '@app/services/Log/Log'
import ApiProxy from '@app/services/Api/ApiProxy'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import config from '@app/config/config'
import currencyBasicActions from '@app/appstores/Stores/CurrencyBasic/CurrencyBasicActions'

let CACHE_RATES_HASH = ''

let CACHE_BASIC = [
    { currencyCode: 'USD' },
    { currencyCode: 'UAH' },
    { currencyCode: 'RUB' },
    { currencyCode: 'EUR' },
    { currencyCode: 'KZT' },
    { currencyCode: 'NGN' },
    { currencyCode: 'USDT', currencyName: 'Usdt', symbol: '$*' },
    { currencyCode: 'BTC', currencyName: 'Btc', symbol: 'BTC' },
]


let CACHE_RATES = {}

export default {

    async getRates(params, dataUpdate = false) {
        try {
            if (typeof params !== 'undefined') {
                if (typeof params.force !== 'undefined') {
                    params.onlyRates = true

                    if (typeof params.source !== 'undefined') {
                        params.source += ' ApiRates.getRatesForce'
                    }
                } else {
                    if (typeof params.source !== 'undefined') {
                        params.source += ' ApiRates.getRates'
                    }
                }

            } else {
                params = { source: 'ApiRates.getRates' }
            }
            let res = false
            let asked = false
            if (!dataUpdate) {
                if (config.debug.appErrors) {
                    // console.log(new Date().toISOString() + ' ApiRates loading new')
                }
                asked = true
                res = await ApiProxy.getAll(params)
            } else {
                res = dataUpdate
            }
            if (!res || typeof res.rates === 'undefined' || typeof res.rates.data === 'undefined' || typeof res.ratesHash === 'undefined') {
                if (config.debug.appErrors) {
                    // console.log(new Date().toISOString() + ' ApiRates not loaded ')
                }
                return false
            }
            if (res.ratesHash === CACHE_RATES_HASH) {
                if (config.debug.appErrors) {
                    // console.log(new Date().toISOString() + ' ApiRates same ratesHash ')
                }
                return false
            }
            if (!asked) {
                if (config.debug.appErrors) {
                    // console.log(new Date().toISOString() + ' ApiRates loaded proxy')
                }
            }
            CACHE_RATES = res.rates.data
            CACHE_RATES_HASH = res.ratesHash
            if (typeof res.rates.data.basicCurrencies !== 'undefined') {
                if (!_isEqual(CACHE_BASIC, res.rates.data.basicCurrencies)) {
                    CACHE_BASIC = res.rates.data.basicCurrencies
                    currencyBasicActions.reloadDict()
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ApiRates error ' + e.message, e)
            }
            Log.daemon('ApiRates error ' + e.message)
        }
        return CACHE_RATES
    },

    /**
     * @returns {{usdtobtc: number, usdtoeuro: number, usdtokzt: number, usdtouah: number, usdttousd: number, usdtorub: number}}
     */
    getRatesWithLocal() {
        const tmp = {
            usdtoeuro: 1,
            usdtorub: 1,
            usdtouah: 1,
            usdtokzt: 1,
            usdtobtc: 1,
            usdttousd: 1
        }
        if (!CACHE_RATES || typeof CACHE_RATES.rate === 'undefined' || typeof CACHE_RATES.cryptoCurrencies === 'undefined') {
            return false
        }
        for (const key in CACHE_RATES.rate) {
            tmp[key.toLowerCase()] = CACHE_RATES.rate[key]
        }
        for (const key of CACHE_RATES.cryptoCurrencies) {
            tmp[key.currencyCode.toLowerCase()] = key.currencyRateUsd
        }
        return tmp
    },

    async getBasicCurrencies() {
        return CACHE_BASIC
    }
}
