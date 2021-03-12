/**
 * @version 0.41
 */
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'

const feeTitles = function(item, dict) {
    const { currencySymbol, currencyCode, basicCurrencySymbol, basicCurrencyRate } = dict

    let feeCurrencyCode = currencyCode
    let feeCurrencySymbol = currencySymbol
    let feeCurrencyRate = basicCurrencyRate

    let fee = item.feeForTx
    let feePretty = BlocksoftPrettyNumbers.setCurrencyCode(feeCurrencyCode).makePretty(fee)
    let fiatFee = RateEquivalent.mul({ value: feePretty, currencyCode: feeCurrencyCode, basicCurrencyRate: feeCurrencyRate })

    if (Number(fiatFee) < 0.01) {
        fiatFee = `< ${basicCurrencySymbol} 0.01`
    } else {
        fiatFee = `${basicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(fiatFee).justCutted}`
    }

    return { feePretty, feeCurrencySymbol, fiatFee }

}

export {
    feeTitles
}
