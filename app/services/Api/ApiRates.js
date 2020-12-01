/**
 * @version 0.9
 */
import Log from '../Log/Log'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

class ApiRates {

    /**
     * could be changed to some our proxy later
     * @type {string}
     */
    URL = 'https://microscanners.trustee.deals/rates'

    /**
     * time to store cached response not to ask twice (ms)
     * @type {number}
     * @private
     */
    _CACHE_VALID_TIME = 30000 // 30 sec

    /**
     * last response array of rates
     * @type {array}
     * @private
     */
    _cachedData = {}

    /**
     * last response time
     * @type {number}
     * @private
     */
    _cachedTime = 0

    _cachedBasicCurrencies =   [{ currencyCode: 'USD'}, { currencyCode: 'UAH' }, { currencyCode: 'RUB' }, { currencyCode: 'USDT', currencyName: 'Usdt' }]

    _inited = false

    async getRates() {
        const now = new Date().getTime()
        if (now - this._cachedTime < this._CACHE_VALID_TIME) {
            return this._cachedData
        }
        try {
            const res = await BlocksoftAxios.getWithoutBraking(this.URL)
            if (!res || typeof res.data === 'undefined' || typeof res.data.data === 'undefined') {
                return this._cachedData
            }
            this._cachedData = res.data.data
            this._cachedTime = now
            if (typeof this._cachedData.basicCurrencies !== 'undefined') {
                if (this._cachedData.basicCurrencies !== this._cachedBasicCurrencies) {
                    this._cachedBasicCurrencies = this._cachedData.basicCurrencies
                    await settingsActions.setSettings('basicCurrencies', JSON.stringify(this._cachedBasicCurrencies))
                    currencyActions.reloadDict()
                }
            }
        } catch (e) {
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
