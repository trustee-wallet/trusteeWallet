/**
 * @version 0.9
 */
import Log from '../Log/Log'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import ApiProxy from './ApiProxy'
import config from '../../config/config'

let CACHE_RATES_HASH = ''

class ApiRates {

    /**
     * last response array of rates
     * @type {array}
     * @private
     */
    _cachedData = {}

    _cachedBasicCurrencies = [{ currencyCode: 'USD' }, { currencyCode: 'UAH' }, { currencyCode: 'RUB' }, { currencyCode: 'USDT', currencyName: 'Usdt' }]

    _inited = false

    async getRates(params) {
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
            const res = await ApiProxy.getAll(params)
            if (!res || typeof res.rates === 'undefined' || typeof res.rates.data === 'undefined' || typeof res.ratesHash === 'undefined' || res.ratesHash === CACHE_RATES_HASH) {
                return false
            }
            this._cachedData = res.rates.data
            CACHE_RATES_HASH = res.ratesHash
            if (typeof this._cachedData.basicCurrencies !== 'undefined') {
                if (this._cachedData.basicCurrencies !== this._cachedBasicCurrencies) {
                    this._cachedBasicCurrencies = this._cachedData.basicCurrencies
                    await settingsActions.setSettings('basicCurrencies', JSON.stringify(this._cachedBasicCurrencies))
                    currencyActions.reloadDict()
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ApiRates error ' + e.message, e)
            }
            Log.daemon('ApiRates error ' + e.message)
        }
        return this._cachedData
    }

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
        for (const key in this._cachedData.rate) {
            tmp[key.toLowerCase()] = this._cachedData.rate[key]
        }
        for (const key of this._cachedData.cryptoCurrencies) {
            tmp[key.currencyCode.toLowerCase()] = key.currencyRateUsd
        }
        return tmp
    }

    async getBasicCurrencies() {
        if (!this._inited) {
            let tmp = await settingsActions.getSetting('basicCurrencies')
            if (tmp) {
                try {
                    tmp = JSON.parse(tmp)
                    this._cachedBasicCurrencies = tmp
                    this._inited = true
                } catch (e) {
                    // do nothing
                }
            }
        }
        return this._cachedBasicCurrencies
    }
}

const singleApiRates = new ApiRates()
export default singleApiRates
