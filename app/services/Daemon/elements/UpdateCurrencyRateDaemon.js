/**
 * @version 0.9
 */
import Update from './Update'

import currencyDS from '../../../appstores/DataSource/Currency/Currency'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'

import Log from '../../Log/Log'
import currencyActions from '../../../appstores/Stores/Currency/CurrencyActions'
import ApiRates from '../../Api/ApiRates'

let CACHE_ERROR = 0
let CACHE_ERROR_COUNT = 0
const CACHE_ERROR_VALID_TIME = 600000 // 10 minute


class UpdateCurrencyRateDaemon extends Update {


    constructor(props) {
        super(props)
        this.updateFunction = this.updateCurrencyRate
    }

    /**
     * @namespace Flow.updateRates
     * @return {Promise<void>}
     */
    updateCurrencyRate = async () => {
        const now = new Date().getTime()
        if (now - CACHE_ERROR < CACHE_ERROR_VALID_TIME) return false

        Log.daemon('UpdateCurrencyRateDaemon started')
        const res = await ApiRates.getRates()
        if (!res || typeof res.cryptoCurrencies === 'undefined') return []
        let currency
        const scanned = res.scanned

        const tmps = await currencyDS.getCurrencies()
        if (!tmps || tmps.length === 0) {
            Log.daemon('UpdateCurrencyRateDaemon warning - no currencies')
            return false
        }
        const indexed = {}
        const toSearch = {}
        try {
            for (currency of tmps) {
                const code = currency.currencyCode

                if (typeof BlocksoftDict.Currencies[code] === 'undefined') continue

                const dict = BlocksoftDict.Currencies[code]

                if (typeof dict.ratesCurrencyCode !== 'undefined') {
                    if (dict.ratesCurrencyCode === 'SKIP') {
                        continue
                    }
                    if (typeof indexed[dict.ratesCurrencyCode] === 'undefined') {
                        indexed[dict.ratesCurrencyCode] = []
                    }
                    indexed[dict.ratesCurrencyCode].push(code)
                }

                if (typeof indexed[code] === 'undefined') {
                    indexed[code] = []
                }
                indexed[code].push(code)

                if (typeof dict.tokenAddress !== 'undefined') {
                    indexed[dict.tokenAddress] = [code]
                }
                toSearch[code] = 1
            }
        } catch (e) {
            e.message += ' in tmps '
            throw e
        }

        try {
            for (currency of res.cryptoCurrencies) {
                let codes = false
                if (typeof indexed[currency.currencyCode] !== 'undefined') {
                    codes = indexed[currency.currencyCode]
                }
                if (!codes && typeof currency.tokenAddress !== 'undefined' && typeof indexed[currency.tokenAddress] !== 'undefined') {
                    codes = indexed[currency.tokenAddress]
                }
                if (!codes) continue

                const updateObj = {
                    currencyRateUsd: currency.currencyRateUsd,
                    currencyRateJson: currency.currencyRateJson,
                    priceProvider: currency.priceProvider,
                    priceChangePercentage24h: currency.priceChangePercentage24h,
                    priceLastUpdated: currency.priceLastUpdated,
                    currencyRateScanTime: scanned
                }
                let res
                let code
                for (code of codes) {
                    delete toSearch[code]
                    res = await currencyDS.updateCurrency({ updateObj, key: { currencyCode: code } })
                }
                if (!res) {
                    CACHE_ERROR = now
                    CACHE_ERROR_COUNT++
                    if (CACHE_ERROR_COUNT > 10) {
                        Log.errDaemon('UpdateCurrencyRateDaemon something wrong with updateCurrency ', currency)
                    } else {
                        Log.daemon('UpdateCurrencyRateDaemon something wrong with updateCurrency ', currency)
                    }
                    break
                }
            }
        } catch (e) {
            e.message += ' in res.cryptoCurrencies'
            throw e
        }

        CACHE_ERROR_COUNT = 0
        Log.daemon('UpdateCurrencyRateDaemon finished')

        try {
            await currencyActions.setCryptoCurrencies()
        } catch (e) {
            e.message += 'in setCryptoCurrencies'
            throw e
        }
    }

}

export default new UpdateCurrencyRateDaemon
