/**
 * @version 0.11
 */
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import Log from '@app/services/Log/Log'
import ApiRates from '@app/services/Api/ApiRates'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import currencyDS from '@app/appstores/DataSource/Currency/Currency'

const CACHE_SAVED = {}

class UpdateCurrencyRateDaemon {

    /**
     * @return {Promise<void>}
     */
    updateCurrencyRate = async (params) => {
        Log.daemon('UpdateCurrencyRateDaemon started ' + params.source)

        const res = await ApiRates.getRates(params)
        if (!res || typeof res.cryptoCurrencies === 'undefined') {
            return []
        }

        let currency
        const scanned = res.scanned

        const tmps = await currencyDS.getCurrencies()
        if (!tmps || tmps.length === 0) {
            Log.daemon('UpdateCurrencyRateDaemon warning - no currencies')
            return false
        }

        const indexed = {}
        const toSearch = {}
        const toAddToNews = {}
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

                if (currency.isHidden !== 1) {
                    toAddToNews[currency.currencyCode] = 1
                }
            }
        } catch (e) {
            e.message += ' in tmps '
            throw e
        }

        const updatedCurrencies = []
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
                    if (typeof CACHE_SAVED[code] === 'undefined' || CACHE_SAVED[code] !== updateObj.currencyRateScanTime) {
                        res = await currencyDS.updateCurrency({ updateObj, key: { currencyCode: code } })
                        updatedCurrencies.push({
                            ...updateObj,
                            currencyCode: code
                        })
                        CACHE_SAVED[code] = updateObj.currencyRateScanTime
                    } else {
                        res = true
                    }
                }
                if (!res) {
                    Log.daemon('UpdateCurrencyRateDaemon something wrong with updateCurrency ', currency)
                }
            }
        } catch (e) {
            e.message += ' in res.cryptoCurrencies'
            throw e
        }

        Log.daemon('UpdateCurrencyRateDaemon finished')

        try {
            if (updatedCurrencies.length) await currencyActions.updateCryptoCurrencies(updatedCurrencies)
        } catch (e) {
            e.message += 'in setCryptoCurrencies'
            throw e
        }
    }

}

export default new UpdateCurrencyRateDaemon
