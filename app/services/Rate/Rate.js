/**
 * Rates provider init with one realization for now
 */
import Log from '../Log/Log'

import TrxTokenRates from './providers/TrxTokenRates'
import KunaRates from './providers/KunaRates'
import CoinMarketRates from './providers/CoinMarketRates'
import CoinMarketProRates from './providers/CoinMarketProRates'

const ratesProviderTrxTokens = new TrxTokenRates()

const ratesProvider1 = new CoinMarketRates()
const ratesProvider2 = new KunaRates()
const ratesProvider3 = new CoinMarketProRates()

class Rate {

    /**
     * @type {{currencyCode, address}}
     * @private
     */
    _data = {}

    tryCounter = 0

    tryLogs = ''

    trxTryCounter = 0

    trxTryLogs = ''

    /**
     * @param {string} currencyCode
     * @return {Rate}
     */
    async setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode.toLowerCase()
        return this
    }

    /**
     * @param {string} settings.network
     * @return {Promise<{amount}>}
     */
    async getRate(settings = {}) {
        let res = false

        if (settings.network === 'trx') {
            try {
                res = await ratesProviderTrxTokens.getRate({ currencyCode: settings.tokenName})
                this.trxTryCounter = 0
                this.trxTryLogs = ''
            } catch (e) {
                if (Log.isNetworkError(e.message) && this.trxTryCounter < 20) {
                    this.trxTryCounter++
                    let date = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    this.trxTryLogs += ' [' + date + '] ' + e.message
                    Log.log('DMN/Rate trx network try ' + this.trxTryCounter + ' ' + e.message)
                } else {
                    Log.err(`DMN/Rate trx error ` + this._data.currencyCode + ' ' + e.message + ' prev try ' + this.trxTryLogs)
                }
                Log.err(`DMN/Rate error trxmainnet ` + e.message)
            }
            return res
        }

        let totalError = ''
        try {
            res = await ratesProvider1.getRate({currencyCode : this._data.currencyCode})
        } catch (e) {
            totalError += '\n 1: ' + e.message
        }

        if (!res) {
            try {
                res = await ratesProvider2.getRate({ currencyCode: this._data.currencyCode })
            } catch (e) {
                totalError += '\n 2: ' + e.message
            }
        }

        if (!res) {
            try {
                res = await ratesProvider3.getRate({ currencyCode: this._data.currencyCode })
            } catch (e) {
                totalError += '\n 3: ' + e.message
            }
        }

        if (res) {
            this.tryCounter = 0
            this.tryLogs = ''
        } else {
            if (Log.isNetworkError(totalError) && this.tryCounter < 200) {
                this.tryCounter++
                let date = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                this.tryLogs += ' [' + date + '] ' + totalError
                Log.log('DMN/Rate network try ' + this.tryCounter + ' ' + totalError)
            } else {
                Log.err(`DMN/Rate error ` + this._data.currencyCode + ' ' + totalError + ' prev try ' + this.tryLogs)
            }
        }

        return res
    }
}

export default new Rate()

