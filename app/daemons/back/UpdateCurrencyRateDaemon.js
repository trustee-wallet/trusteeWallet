/**
 * @version 0.41
 */

import Log from '@app/services/Log/Log'
import ApiRates from '@app/services/Api/ApiRates'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import currencyDS from '@app/appstores/DataSource/Currency/Currency'
import store from '@app/store'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

const CACHE_SAVED = {}

class UpdateCurrencyRateDaemon {

    /**
     * @return {Promise<void>}
     */
    updateCurrencyRate = async (params, dataUpdate = false) => {
        Log.daemon('UpdateCurrencyRateDaemon started ' + params.source)

        const res = await ApiRates.getRates(params, dataUpdate)
        if (!res || typeof res.cryptoCurrencies === 'undefined') {
            return []
        }

        const currencies = store.getState().currencyStore.cryptoCurrencies
        if (typeof currencies === 'undefined' || !currencies || currencies.length === 0) {
            Log.daemon('UpdateCurrencyRateDaemon warning - no currencies')
            return false
        }

        const indexed = {}
        let row = false
        try {
            for (row of res.cryptoCurrencies) {
                if (typeof row === 'undefined' || !row) continue
                if (typeof row.tokenAddress !== 'undefined' && row.tokenAddress) {
                    indexed['token_' + row.tokenAddress.toUpperCase()] = row
                }
                if (typeof row.currencyCode !== 'undefined') {
                    indexed[row.currencyCode] = row
                }
            }
        } catch (e) {
            e.message += ' in indexing cryptoCurrencies ' + (row ? JSON.stringify(row) : ' no row')
            throw e
        }

        const scanned = res.scanned
        const updatedCurrencies = []
        try {
            for (const dbCurrency of currencies) {
                let currency = false

                if (typeof dbCurrency.tokenAddress !== 'undefined' && dbCurrency.tokenAddress) {
                    if (typeof indexed['token_' + dbCurrency.tokenAddress.toUpperCase()] !== 'undefined') {
                        currency = indexed['token_' + dbCurrency.tokenAddress.toUpperCase()]
                    }
                }

                if (!currency) {
                    if (dbCurrency.currencyCode.indexOf('CUSTOM_') === 0) {
                        if (typeof dbCurrency.tokenName !== 'undefined' && typeof indexed[dbCurrency.tokenName] !== 'undefined') {
                            currency = indexed[dbCurrency.tokenName]
                        }
                    } else {
                        if (typeof dbCurrency.ratesCurrencyCode !== 'undefined' && dbCurrency.ratesCurrencyCode) {
                            if (typeof indexed[dbCurrency.ratesCurrencyCode] !== 'undefined') {
                                currency = indexed[dbCurrency.ratesCurrencyCode]
                            }
                        } else {
                            if (typeof indexed[dbCurrency.currencyCode] !== 'undefined') {
                                currency = indexed[dbCurrency.currencyCode]
                            }
                        }
                    }
                }

                if (!currency) {
                    Log.daemon('UpdateCurrencyRateDaemon warning - no currency rate for ' + dbCurrency.currencyCode)
                    continue
                }
                if (typeof CACHE_SAVED[dbCurrency.currencyCode] !== 'undefined' && CACHE_SAVED[dbCurrency.currencyCode] === currency.currencyRateScanTime) {
                    continue
                }
                const updateObj = {
                    currencyRateUsd: currency.currencyRateUsd,
                    currencyRateJson: currency.currencyRateJson,
                    priceProvider: currency.priceProvider,
                    priceChangePercentage24h: currency.priceChangePercentage24h,
                    priceLastUpdated: currency.priceLastUpdated,
                    currencyRateScanTime: scanned
                }
                updatedCurrencies.push({
                    ...updateObj,
                    currencyCode: dbCurrency.currencyCode
                })

                CACHE_SAVED[dbCurrency.currencyCode] = updateObj.currencyRateScanTime
                await currencyDS.updateCurrency({ updateObj, key: { currencyCode: dbCurrency.currencyCode } })
            }
        } catch (e) {
            e.message += ' in res.cryptoCurrencies'
            throw e
        }

        try {
            if (updatedCurrencies.length) {
                await currencyActions.updateCryptoCurrencies(updatedCurrencies)
                await UpdateAccountListDaemon.updateAccountListDaemon({force: true, source: 'UpdateCurrencyRateDaemon'})
            }
        } catch (e) {
            e.message += 'in setCryptoCurrencies'
            throw e
        }
    }

}

export default new UpdateCurrencyRateDaemon
