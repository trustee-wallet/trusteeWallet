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

        let rateTRX = false
        let insertHistoryData = []
        for (let currency of currencies) {

            let toSaveCurrencyCode = currency.currencyCode
            let toScanCurrencyCode = currency.currencyCode
            let currencyCode = currency.currencyCode

            let settings = BlocksoftDict.getCurrencyAllSettings(currencyCode)

            try {
                if (typeof settings === 'undefined') {
                    settings = BlocksoftDict.CurrenciesForTests[currencyCode]
                }

                if (settings.network === 'mainnet' || typeof settings.rateUiScanner !== 'undefined') {
                    // do nothing
                } else if (settings.network === 'trx') {
                    if (!rateTRX) {
                        Rate.setCurrencyCode('TRX')
                        rateTRX = (await Rate.getRate()).amount
                        if (!rateTRX) {
                            // do only if trx rate is ok
                            continue
                        }
                    }
                } else {
                    // do nothing
                    continue
                }

                if (settings.ratesCurrencyCode) {
                    toScanCurrencyCode = settings.ratesCurrencyCode
                    Log.daemon('DMN/UpdateCurrencyRate actually will change ' + currencyCode + ' => ' + toScanCurrencyCode)
                } else {
                    Log.daemon('DMN/UpdateCurrencyRate called ' + currencyCode)
                }


                Rate.setCurrencyCode(toScanCurrencyCode)

                let now = new Date().getTime()

                let { amount, amount_trx, provider } = await Rate.getRate(settings)

                if (typeof (amount_trx) != 'undefined' && amount_trx > 0 && rateTRX > 0) {
                    amount = amount_trx * rateTRX

                    Log.daemon(`DMN/UpdateCurrencyRate trx rates transform ${toScanCurrencyCode} ${amount_trx}*${rateTRX} => ${amount}`)
                }

                if (typeof (amount) != 'undefined') {

                    if (!BALANCE_CACHE[toSaveCurrencyCode] || BALANCE_CACHE[toSaveCurrencyCode] !== amount) {
                        cacheUpdated = true
                        newData[toSaveCurrencyCode] = amount
                        let res = await currencyDS.updateCurrency({
                            key: {
                                currency_code: toSaveCurrencyCode
                            },
                            updateObj: {
                                currency_rate_usd: amount,
                                currency_rate_scan_time: now
                            }
                        })
                        if (res) {
                            insertHistoryData.push({
                                currency_code: toSaveCurrencyCode,
                                currency_rate_usd: amount,
                                currency_rate_scan_time: now
                            })
                        }
                        BALANCE_CACHE[toSaveCurrencyCode] = amount
                    }
                    if (
                        toSaveCurrencyCode !== toScanCurrencyCode && // if was replaced in the dict
                        (!BALANCE_CACHE[toScanCurrencyCode] || BALANCE_CACHE[toScanCurrencyCode] !== amount)
                    ) {
                        cacheUpdated = true
                        newData[toScanCurrencyCode] = amount
                        BALANCE_CACHE[toScanCurrencyCode] = amount
                    }


                    Log.daemon('DMN/UpdateCurrencyRate finished ' + currencyCode + ' scanned ' + toScanCurrencyCode + ' => ' + amount + ' from ' + provider)

                } else {

                    Log.daemon('DMN/UpdateCurrencyRate finished ' + currencyCode + ' scanned ' + toScanCurrencyCode + ' with undefined amount')

                }

            } catch (e) {

                Log.errDaemon('DMN/UpdateCurrencyRate error ' + currencyCode + ' as ' + toScanCurrencyCode + ' ' + e.message)
            }
        }

        if (insertHistoryData && insertHistoryData.length > 0) {
            await currencyDS.insertCurrencyHistory({insertObjs : insertHistoryData})
        }
        if (cacheUpdated) {
            this.updateEventHandler({ newData, allData: BALANCE_CACHE })
        }

    }

}

export default new UpdateCurrencyRate
