/**
 * @version 0.50
 */
import { createSelector } from 'reselect'
import { strings, sublocale } from '@app/services/i18n'

export const getCurrenciesBasic = createSelector(
    [state => state.currencyBasicStore.currenciesBasic],
    (currenciesBasic => {
        const suffix = sublocale()
        const result = []
        for (const currencyCode in currenciesBasic) {
            const tmp = currenciesBasic[currencyCode]
            if (typeof tmp.currencyNameSuffixed !== 'undefined' && typeof tmp.currencyNameSuffixed[suffix] !== 'undefined') {
                tmp.currencyName = tmp.currencyNameSuffixed[suffix]
            } else if (typeof tmp.currencyName === 'undefined') {
                tmp.currencyName = strings(`currencyList.${currencyCode}.currency`)
            }
            result.push(tmp)
        }
        return result
    })
)
