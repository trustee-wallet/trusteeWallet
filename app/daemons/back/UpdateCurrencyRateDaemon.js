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
        try {
            for (const row of res.cryptoCurrencies) {
                if (typeof row.tokenAddress !== 'undefined') {
                    indexed[row.tokenAddress] = row
                }
                indexed[row.currencyCode] = row
            }
        } catch (e) {
            e.message += ' in tmps '
            throw e
        }

        const scanned = res.scanned
        const updatedCurrencies = []
        try {
            for (const dbCurrency of currencies) {
                let currency = false
                if (dbCurrency.currencyCode.indexOf('CUSTOM_') === 0) {
                    if (typeof dbCurrency.tokenName !== 'undefined' && typeof indexed[dbCurrency.tokenName] !== 'undefined') {
                        currency = indexed[dbCurrency.tokenName]
                    }
                    if (typeof dbCurrency.tokenAddress !== 'undefined' && typeof indexed[dbCurrency.tokenAddress] !== 'undefined') {
                        currency = indexed[dbCurrency.tokenAddress]
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
                    if (!currency && typeof dbCurrency.tokenAddress !== 'undefined') {
                        if (typeof indexed[dbCurrency.tokenAddress] !== 'undefined') {
                            currency = indexed[dbCurrency.tokenAddress]
                        }
                    }
                }

                if (!currency) {
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
