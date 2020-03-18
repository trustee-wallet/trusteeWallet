/**
 * CoinMarket Rates scanner realization
 *
 * Supported response format for one currency ticker
 *
 * { currency: 'eth', usd: 246.55, uah: 6640, btc: 0.03154, eur: 218.55, rub: 16143.64 }
 */
import Log from '../../Log/Log'

const axios = require('axios')

export default class CoinMarketRates {

    /**
     * could be changed to some our proxy later
     * @type {string}
     */
    URL = 'https://api.coinmarketcap.com/v1/ticker/'

    /**
     * time to store cached response not to ask twice (ms)
     * @type {number}
     * @private
     */
    _CACHE_VALID_TIME = 60000 // 1 minute

    /**
     * last response array of rates
     * @type {array}
     * @private
     */
    _cachedData = []

    /**
     * last response time
     * @type {number}
     * @private
     */
    _cachedTime = 0

    /**
     * @param params.currencyCode
     * @return {Promise<{amount}>}
     */
    async getRate(params) {
        const now = new Date().getTime()
        let provider = 'coinmarket'
        if (now - this._cachedTime > this._CACHE_VALID_TIME) {
            Log.log('DMN/CoinMarketRates link ' + this.URL)
            /**
             * @param {string} resData.data[].currency
             * @param {string} resData.data[].usd
             * @param {string} resData.data[].uah
             * @param {string} resData.data[].usd
             * @param {string} resData.data[].btc
             * @param {string} resData.data[].eur
             * @param {string} resData.data[].rub
             */
            const resData = await axios.get(this.URL)
            if (!resData.data || !resData.data[0] || !resData.data[0].id) {
                throw new Error(resData.data)
            }
            this._cachedData = {}
            let row
            for(row of resData.data) {
                this._cachedData[row.id] = row
                this._cachedData[row.symbol.toLowerCase()] = row
            }
            this._cachedTime = now
        } else {
            // do nothing and take from cache
            provider += 'Cache'
        }

        if (typeof this._cachedData[params.currencyCode] === 'undefined') {
            let tmp = JSON.stringify(Object.keys(this._cachedData))
            tmp = tmp.substr(0, 30)
            throw new Error('CoinMarketRates ' + params.currencyCode + ' ' + provider + ' wrong code = doesnt exists ' + tmp)
        }
        const rate = this._cachedData[params.currencyCode]
        if (!rate) {
            let tmp = JSON.stringify(Object.keys(this._cachedData))
            tmp = tmp.substr(0, 30)
            throw new Error('CoinMarketRates ' + params.currencyCode + ' ' + provider + ' wrong code = is null ' + tmp)
        }
        if (!rate.price_usd) {
            throw new Error('CoinMarketRates ' + params.currencyCode + ' ' + provider + ' wrong code = doesnt trade with usd ' + JSON.stringify(rate))
        }
        return { amount: rate.price_usd*1, provider }
    }
}
