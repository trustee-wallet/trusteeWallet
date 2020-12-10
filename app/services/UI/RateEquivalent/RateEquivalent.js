import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

const CACHE_FOR_MUL = {
    key : '',
    value : ''
} // to make 1 usd => crypto => 1 usd back on confirm screen

export default class {
    /**
     *
     * @param params.value
     * @param params.currencyCode
     * @param params.basicCurrencyRate
     * @returns {*}
     */
    static mul(params) {
        const betterValue = params.value.toString().replace(' ', '')
        if (typeof params.basicCurrencyRate === 'undefined' || !params.basicCurrencyRate || params.basicCurrencyRate === 0) {
            return 0
        }
        if (params.basicCurrencyRate === 1 || params.basicCurrencyRate === '1') {
            return betterValue
        }
        if (betterValue === "0") {
            return betterValue
        }
        if (CACHE_FOR_MUL.key  === params.basicCurrencyRate + '_' + betterValue) {
            return CACHE_FOR_MUL.value
        }
        const valueRaw = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makeUnPretty(betterValue)
        let rate = params.basicCurrencyRate
        let toUnifyRate = false
        if (rate < 1) {
            toUnifyRate = true
            rate =  BlocksoftUtils.fromUnified(params.basicCurrencyRate, 6) // ETH is enough
        }
        if (valueRaw === "") {
            return 0
        }
        let amount = BlocksoftUtils.mul(valueRaw, rate).toString()
        amount = BlocksoftUtils.fromENumber(amount)
        if (toUnifyRate) {
            amount = BlocksoftUtils.toUnified(amount, 6)
        }
        amount = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makePretty(amount, 'rateEquivalent.amount2')
        return amount
    }

    /**
     *
     * @param params.value
     * @param params.currencyCode
     * @param params.basicCurrencyRate
     * @returns {*}
     */
    static div(params) {
        const betterValue = params.value.toString().replace(' ', '')
        if (typeof params.basicCurrencyRate === 'undefined' || !params.basicCurrencyRate || params.basicCurrencyRate === 0) {
            return 0
        }
        if (params.basicCurrencyRate === 1 || params.basicCurrencyRate === '1') {
            return betterValue
        }
        const valueRaw = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makeUnPretty(betterValue)
        let rate =  params.basicCurrencyRate
        let toUnifyRate = false
        if (rate < 1) {
            toUnifyRate = true
            rate =  BlocksoftUtils.fromUnified(params.basicCurrencyRate, 6) // ETH is enough
        }
        let amount = BlocksoftUtils.div(valueRaw, rate).toString()
        amount = BlocksoftUtils.fromENumber(amount)
        if (toUnifyRate) {
            amount = BlocksoftUtils.fromUnified(amount, 6)
        }
        amount = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makePretty(amount, 'rateEquivalent.amount')
        CACHE_FOR_MUL.key = params.basicCurrencyRate + '_' + amount
        CACHE_FOR_MUL.value = betterValue
        return amount
    }
}
