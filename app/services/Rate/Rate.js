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

    tryCounter1 = 0
    tryCounter2 = 0
    tryCounter3 = 0

    tryTimer1 = 0
    tryTimer2 = 0
    tryTimer3 = 0

    _ERROR_VALID_TIME = 60000 // 1 minute

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
            }
            return res
        }

        let totalError = ''
        if (this.tryTimer1 === 0 || new Date().getTime() - this.tryTimer1 > this._ERROR_VALID_TIME ) {
            try {
                res = await ratesProvider1.getRate({ currencyCode: this._data.currencyCode })
                this.tryCounter1 = 0
                this.tryTimer1 = 0
            } catch (e) {
                if (Log.isNetworkError(e.message) && this.tryCounter1 < 10) {
                    this.tryCounter1++
                    this.tryTimer1 = new Date().getTime()
                }
                totalError += '\n 1: ' + e.message + ' ' + ratesProvider1.URL
            }
        }

        if (!res && (this.tryTimer2 === 0 || new Date().getTime() - this.tryTimer2 > this._ERROR_VALID_TIME)) {
            try {
                res = await ratesProvider2.getRate({ currencyCode: this._data.currencyCode })
                this.tryCounter2 = 0
                this.tryTimer2 = 0
            } catch (e) {
                if (Log.isNetworkError(e.message)) {
                    this.tryCounter2++
                    this.tryTimer2 = new Date().getTime()
                }
                totalError += '\n 2: ' + e.message + ' ' + ratesProvider2.URL
            }
        }

        if (!res && (this.tryTimer3 === 0 || new Date().getTime() - this.tryTimer3 > this._ERROR_VALID_TIME)) {
            try {
                res = await ratesProvider3.getRate({ currencyCode: this._data.currencyCode })
                this.tryCounter3 = 0
                this.tryTimer3 = 0
            } catch (e) {
                if (Log.isNetworkError(e.message) && this.tryCounter3 < 10) {
                    this.tryCounter3++
                    this.tryTimer3 = new Date().getTime()
                }
                totalError += '\n 3: ' + e.message + ' ' + ratesProvider3.URL
            }
        }

        if (res) {
            this.tryCounter = 0
            this.tryLogs = ''
        } else {
            if (Log.isNetworkError(totalError) && this.tryCounter < 100) {
                this.tryCounter++
                let date = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                this.tryLogs += ' [' + date + '] ' + totalError
                Log.log('DMN/Rate network try ' + this.tryCounter + ' ' + totalError)
            } else if (totalError.indexOf('wrong code') === -1) {
                Log.err('DMN/Rate error ' + totalError + ' prev try ' + this.tryLogs)
            } else {
                Log.err(`DMN/Rate error ` + this._data.currencyCode + ' ' + totalError + (this.tryLogs ? (' prev try ' + this.tryLogs) : ''))
            }
        }

        return res
    }
}

export default new Rate()

