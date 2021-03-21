/**
 * @version 0.41
 */
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'

const feesTitles = function(item, dict) {
    let { currencySymbol, currencyCode, basicCurrencySymbol, basicCurrencyRate, feesBasicCurrencyRate, feesBasicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol } = dict

    if (typeof feesCurrencyCode === 'undefined' || !feesCurrencyCode) feesCurrencyCode = currencyCode
    if (typeof feesCurrencySymbol === 'undefined' || !feesCurrencySymbol) feesCurrencySymbol = currencySymbol
    if (typeof feesBasicCurrencyRate === 'undefined' || !feesBasicCurrencyRate) feesBasicCurrencyRate = basicCurrencyRate
    if (typeof feesBasicCurrencySymbol === 'undefined' || !feesBasicCurrencySymbol) feesBasicCurrencySymbol = basicCurrencySymbol

    let feesPretty, fiatFee
    if (typeof item.feeForTxDelegated !== 'undefined') {
        feesPretty = item.feeForTxCurrencyAmount
        feesCurrencyCode = currencyCode
        feesCurrencySymbol = currencySymbol
        fiatFee = item.feeForTxBasicAmount
        feesBasicCurrencySymbol = item.feeForTxBasicSymbol
    } else {
        feesPretty = BlocksoftPrettyNumbers.makeCut(BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(item.feeForTx)).separated
        fiatFee = RateEquivalent.mul({ value: feesPretty, currencyCode: feesCurrencyCode, basicCurrencyRate: feesBasicCurrencyRate })
    }

    if (Number(fiatFee) < 0.01) {
        fiatFee = `< ${feesBasicCurrencySymbol} 0.01`
    } else {
        fiatFee = `${feesBasicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(fiatFee).justCutted}`
    }

    return { feesPretty, feesCurrencySymbol, fiatFee }
}

export {
    feesTitles
}
