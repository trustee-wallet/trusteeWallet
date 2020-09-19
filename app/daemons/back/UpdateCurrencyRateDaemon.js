/**
 * @version 0.11
 */
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import Log from '../../services/Log/Log'
import ApiRates from '../../services/Api/ApiRates'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

import currencyDS from '../../appstores/DataSource/Currency/Currency'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'

const CACHE_SAVED = {}

class UpdateCurrencyRateDaemon {

    /**
     * @return {Promise<void>}
     */
    updateCurrencyRate = async (params) => {
        Log.daemon('UpdateCurrencyRateDaemon started ' + params.source)
        const res = await ApiRates.getRates()
       // console.log('rates', res.cryptoCurrencies[0])
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

        let addedNews = false
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
                        if (code === 'BTC') {
                            Log.daemon('UpdateCurrencyRateDaemon scanned BTC ' + updateObj.currencyRateUsd)
                        }
                        res = await currencyDS.updateCurrency({ updateObj, key: { currencyCode: code } })
                        CACHE_SAVED[code] = updateObj.currencyRateScanTime
                        if (typeof toAddToNews[code] !== 'undefined') {
                            addedNews = true
                            await appNewsDS.saveAppNews({ onlyOne: true, currencyCode: code, newsGroup: 'ONE_BY_ONE_SCANNER', newsName: 'CURRENCY_RATE_UPDATED', newsJson: updateObj })
                        }
                    } else {
                        res = true
                        if (code === 'BTC') {
                            Log.daemon('UpdateCurrencyRateDaemon ignored BTC ' + updateObj.currencyRateUsd)
                        }
                    }
                }
                if (!res) {
                    Log.daemon('UpdateCurrencyRateDaemon something wrong with updateCurrency ', currency)
                }
            }
            if (!addedNews) {
                await appNewsDS.saveAppNews({ onlyOne: true, currencyCode: 'BTC', newsGroup: 'ONE_BY_ONE_SCANNER', newsName: 'CURRENCY_RATE_SCANNED_LAST_TIME', newsJson: {} })
            }
        } catch (e) {
            e.message += ' in res.cryptoCurrencies'
            throw e
        }

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
