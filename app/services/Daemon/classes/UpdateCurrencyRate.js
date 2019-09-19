import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import currencyDS from '../../../appstores/DataSource/Currency/Currency'

import Update from './Update'
import Log from '../../Log/Log'
import Rate from '../../Rate/Rate'

const BALANCE_CACHE = {}

class UpdateCurrencyRate extends Update {


    constructor(props) {
        super(props)
        this.updateFunction = this.updateCurrencyRate
    }


    /**
     * @namespace Flow.updateRates
     * @return {Promise<void>}
     */
    updateCurrencyRate = async () => {

        let newData = {}

        let cacheUpdated = false

        let currencies = await currencyDS.getCurrenciesForScanRates()

        if (!currencies) {
            // nothing to scan
            return true
        }
        
        for (let currency of currencies) {

            let toSaveCurrencyCode = currency.currencyCode
            let toScanCurrencyCode = currency.currencyCode
            let currencyCode = currency.currencyCode

            let settings = BlocksoftDict.Currencies[currencyCode]

            if (typeof settings === 'undefined') {
                settings = BlocksoftDict.CurrenciesForTests[currencyCode]
            }
            if (typeof settings.network === 'undefined') {
                if (typeof settings.extendsProcessor === 'undefined') {
                    throw new Error('DMN/UpdateCurrencyRate not found network for ' + currencyCode)
                } else {
                    if (!(BlocksoftDict.Currencies[settings.extendsProcessor].network === 'mainnet')) continue
                }
            } else {
                if (!(settings.network === 'mainnet') && typeof settings.rateUiScanner === 'undefined') continue
            }


            if (settings.ratesCurrencyCode) {
                toScanCurrencyCode = settings.ratesCurrencyCode
                Log.daemon('DMN/UpdateCurrencyRate actually will change ' + currencyCode + ' => ' + toScanCurrencyCode)
            } else {
                Log.daemon('DMN/UpdateCurrencyRate called ' + currencyCode)
            }

            try {

                Rate.setCurrencyCode(toScanCurrencyCode)

                const { amount } = await Rate.getRate()

                if (!BALANCE_CACHE[toSaveCurrencyCode] || BALANCE_CACHE[toSaveCurrencyCode] !== amount) {
                    cacheUpdated = true
                    newData[toSaveCurrencyCode] = amount
                    await currencyDS.updateCurrency({
                        key: {
                            currency_code: toSaveCurrencyCode
                        },
                        updateObj: {
                            currency_rate_usd: amount
                        }
                    })
                    BALANCE_CACHE[toSaveCurrencyCode] = amount
                }
                if (
                    toSaveCurrencyCode != toScanCurrencyCode && // if was replaced in the dict
                    (!BALANCE_CACHE[toScanCurrencyCode] || BALANCE_CACHE[toScanCurrencyCode] !== amount)
                ) {
                    cacheUpdated = true
                    newData[toScanCurrencyCode] = amount
                    await currencyDS.updateCurrency({
                        key: {
                            currency_code: toScanCurrencyCode
                        },
                        updateObj: {
                            currency_rate_usd: amount
                        }
                    })
                    BALANCE_CACHE[toScanCurrencyCode] = amount
                }

                Log.daemon('DMN/UpdateCurrencyRate finished ' + currencyCode + ' scanned ' + toScanCurrencyCode + ' => ' + amount)

            } catch (e) {

                Log.errDaemon('DMN/UpdateCurrencyRate error ' + currencyCode + ' scanned ' + toScanCurrencyCode, e)
            }
        }

        if (cacheUpdated) {

            this.updateEventHandler({ newData, allData: BALANCE_CACHE })
        }

    }

}

export default new UpdateCurrencyRate
