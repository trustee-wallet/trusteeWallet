/**
 * Rates provider init with one realization for now
 */

import KunaRates from './providers/KunaRates'
import CoinMarketRates from './providers/CoinMarketRates'

const ratesProvider = new CoinMarketRates()
const secondaryProvider = new KunaRates()

class Rates {

    /**
     * @type {{currencyCode, address}}
     * @private
     */
    _data = {}

    /**
     * @param {string} currencyCode
     * @return {Rates}
     */
    async setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode.toLowerCase()
        return this
    }

    /**
     * @return {Promise<{amount}>}
     */
    async getRate() {
        let res = false

        try {
            res = await ratesProvider.getRate({currencyCode : this._data.currencyCode})
        } catch (e) {
            res = await secondaryProvider.getRate({currencyCode : this._data.currencyCode})
        }
        
        return res
    }
}

export default new Rates()

