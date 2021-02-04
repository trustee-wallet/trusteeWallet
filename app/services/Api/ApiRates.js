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

    _cachedBasicCurrencies =   [{ currencyCode: 'USD'}, { currencyCode: 'UAH' }, { currencyCode: 'RUB' }, { currencyCode: 'USDT', currencyName: 'Usdt' }]

    _inited = false

    async getRates(params) {
        try {
            if (typeof params !== 'undefined' && typeof params.force !== 'undefined') {
                params.onlyRates = true
            }
            const res = await ApiProxy.getAll(params)
            if (!res || typeof res.rates === 'undefined' || typeof res.rates.data === 'undefined' || typeof res.ratesHash === 'undefined' || res.ratesHash === CACHE_RATES_HASH ) {
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
            Log.daemon('ApiRates error ' + e.message )
        }
        return this._cachedData
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

export default new ApiRates()
