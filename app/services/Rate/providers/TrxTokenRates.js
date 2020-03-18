/**
 * TrxToken scanner realization
 */
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'
import Log from '../../Log/Log'

const axios = require('axios')

export default class TrxTokenRates {

    /**
     * could be changed to some our proxy later
     * @type {string}
     * @private
     */
    _URL = 'https://apilist.tronscan.org/api/tokens/overview?start=0&limit=&order=desc&filter=all&sort=volume24hInTrx&order_current=descend'

    _URL_ONE = 'https://apilist.tronscan.org/api/token?showAll=1&id='
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
        let provider = 'tronscan'
        if (now - this._cachedTime > this._CACHE_VALID_TIME) {
            Log.log('DMN/TrxTokenRates link ' + this._URL)
            /**
             * @param {string} resData.data[].currency
             * @param {string} resData.data[].usd
             * @param {string} resData.data[].uah
             * @param {string} resData.data[].usd
             * @param {string} resData.data[].btc
             * @param {string} resData.data[].eur
             * @param {string} resData.data[].rub
             */
            const resData = await axios.get(this._URL)
            if (!resData.data || !resData.data.tokens || !resData.data.tokens[0]) {
                throw new Error(resData.data)
            }
            this._cachedData = {}
            for(let row of resData.data.tokens) {
                this._cachedData[row.abbr] = row
                if (typeof (row.contractAddress) !== 'undefined') {
                    this._cachedData[row.contractAddress] = row
                }
                if (typeof (row.tokenId) !== 'undefined') {
                    this._cachedData[row.tokenId] = row
                }
            }
            this._cachedTime = now
        } else {
            // do nothing and take from cache
            provider += 'Cache'
        }

        if (typeof this._cachedData[params.currencyCode] === 'undefined') {
            const resData = await axios.get(this._URL_ONE + params.currencyCode)
            let row
            for(row of resData.data.data) {
                row.priceInTrx = BlocksoftUtils.toUnified(row.price, 3)
                this._cachedData[row.abbr] = row
                if (typeof (row.id) !== 'undefined') {
                    this._cachedData[row.id] = row
                }
                provider = 'tronscanOne'
            }
        }


        if (typeof this._cachedData[params.currencyCode] === 'undefined') {
            let tmp = JSON.stringify(Object.keys(this._cachedData))
            tmp = tmp.substr(0, 30)
            throw new Error('TrxTokenRates ' + params.currencyCode + ' ' + provider + ' doesnt exists ' + tmp)
        }
        const rate = this._cachedData[params.currencyCode]
        if (!rate) {
            let tmp = JSON.stringify(Object.keys(this._cachedData))
            tmp = tmp.substr(0, 30)
            throw new Error('TrxTokenRates ' + params.currencyCode + ' ' + provider + ' is null ' + tmp)
        }
        if (!rate.priceInTrx) {
            throw new Error('TrxTokenRates ' + params.currencyCode + ' doesnt trade with trx')
        }
        return { amount_trx: rate.priceInTrx, provider }
    }
}
