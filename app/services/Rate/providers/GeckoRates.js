/**
 * CoinGecko Rates scanner realization
 *
 * Supported response format for one currency ticker
 *
 * https://api.coingecko.com/api/v3/ping
 * https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd
 *
 * https://www.coingecko.com/api/documentations/v3#/coins/get_coins_markets
 *
 * "id":"bitcoin",
 * "symbol":"btc",
 * "name":"Bitcoin",
 * "image":"https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
 * "current_price":9104.56,
 * "market_cap":166192478140,
 * "market_cap_rank":1,
 * "total_volume":41186355660,
 * "high_24h":9152.04,
 * "low_24h":9008.53,
 * "price_change_24h":6.16,
 * "price_change_percentage_24h":0.06769,
 * "market_cap_change_24h":-53160863.07449341,
 * "market_cap_change_percentage_24h":-0.03198,
 * "circulating_supply":18256600.0,
 * "total_supply":21000000.0,
 * "ath":19665.39,
 * "ath_change_percentage":-53.62329,
 * "ath_date":"2017-12-16T00:00:00.000Z",
 * "roi":null,
 * "last_updated":"2020-03-06T21:50:28.893Z"
 */
import Log from '../../Log/Log'

const axios = require('axios')

export default class GeckoRates {

    /**
     * could be changed to some our proxy later
     * @type {string}
     */
    URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd'

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
        let provider = 'gecko'
        if (now - this._cachedTime > this._CACHE_VALID_TIME) {
            Log.log('DMN/GeckoRates link ' + this.URL)
            /**
             * @param {string} resData.data[].symbol
             * @param {string} resData.data[].current_price
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
            throw new Error('GeckoRates ' + params.currencyCode + ' ' + provider + ' wrong code = doesnt exists ' + tmp)
        }
        const rate = this._cachedData[params.currencyCode]
        if (!rate) {
            let tmp = JSON.stringify(Object.keys(this._cachedData))
            tmp = tmp.substr(0, 30)
            throw new Error('GeckoRates ' + params.currencyCode + ' ' + provider + ' wrong code = is null ' + tmp)
        }
        if (!rate.current_price) {
            throw new Error('GeckoRates ' + params.currencyCode + ' ' + provider + ' wrong code = doesnt trade ' + JSON.stringify(rate))
        }
        return { amount: rate.current_price *1,
            price_high_24h : rate.high_24h,
            price_low_24h : rate.low_24h,
            price_change_24h : rate.price_change_24h,
            price_change_percentage_24h : rate.price_change_percentage_24h,
            price_last_updated : rate.last_updated,
            provider }
    }
}
