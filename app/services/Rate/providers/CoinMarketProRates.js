import Log from '../../Log/Log'

/**
 * CoinMarket Rates Pro scanner realization
 *
 * https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
 *
 * curl -H "X-CMC_PRO_API_KEY: 23b9071f-1298-42ce-88b3-8c9b75801b33"  -G https://pro-api.coinmarketcap.com/v1/cryptocurrency/map >> pro.json
 */

const axios = require('axios')

export default class CoinMarketProRates {

    /**
     * could be changed to some our proxy later
     * @type {string}
     * @private
     */
    _URL = 'https://microscanners.trustee.deals/pro/'

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
        let provider = 'coinmarketPro'
        if (now - this._cachedTime > this._CACHE_VALID_TIME) {
            Log.log('DMN/CoinMarketProRates link ' + this._URL)
            const resData = await axios.get(this._URL)
            if (!resData.data.data || !resData.data.data[0] || !resData.data.data[0].id || !resData.data.data[0].quote) {
                throw new Error(resData.data.data)
            }
            this._cachedData = {}
            for(let row of resData.data.data) {
                let price_usd = row.quote.USD.price
                this._cachedData[row.name] = {price_usd}
                this._cachedData[row.symbol.toLowerCase()] = {price_usd}
            }
            this._cachedTime = now
        } else {
            // do nothing and take from cache
            provider += 'Cache'
        }

        if (typeof this._cachedData[params.currencyCode] === 'undefined') {
            throw new Error('CoinMarketProRates ' + params.currencyCode + ' ' + provider + ' doesnt exists ' + JSON.stringify(Object.keys(this._cachedData)))
        }
        const rate = this._cachedData[params.currencyCode]
        if (!rate) {
            throw new Error('CoinMarketProRates ' + params.currencyCode + ' ' + provider + ' is null ' + JSON.stringify(Object.keys(this._cachedData)))
        }
        if (!rate.price_usd) {
            throw new Error('CoinMarketProRates ' + params.currencyCode + ' ' + provider + ' doesnt trade with usd ' + JSON.stringify(rate))
        }
        return { amount: rate.price_usd*1, provider }
    }
}
