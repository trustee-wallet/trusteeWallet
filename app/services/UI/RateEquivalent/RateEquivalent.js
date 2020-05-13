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
        if (typeof params.basicCurrencyRate === 'undefined' || !params.basicCurrencyRate || params.basicCurrencyRate === 0) {
            return 0
        }
        if (params.basicCurrencyRate === 1 || params.basicCurrencyRate === '1') {
            return params.value
        }
        if (CACHE_FOR_MUL.key  === params.basicCurrencyRate + '_' + params.value) {
            return CACHE_FOR_MUL.value
        }
        const valueRaw = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makeUnPretty(params.value)
        let rate = params.basicCurrencyRate
        let toUnifyRate = false
        if (rate < 1) {
            toUnifyRate = true
            rate =  BlocksoftUtils.fromUnified(params.basicCurrencyRate, 6) // ETH is enough
        }
        let amount = BlocksoftUtils.mul(valueRaw, rate).toString()
        amount = BlocksoftUtils.fromENumber(amount)
        if (toUnifyRate) {
            amount = BlocksoftUtils.toUnified(amount, 6)
        }
        amount = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makePretty(amount)
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
        if (typeof params.basicCurrencyRate === 'undefined' || !params.basicCurrencyRate || params.basicCurrencyRate === 0) {
            return 0
        }
        if (params.basicCurrencyRate === 1 || params.basicCurrencyRate === '1') {
            return params.value
        }
        const valueRaw = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makeUnPretty(params.value)
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
        amount = BlocksoftPrettyNumbers.setCurrencyCode(params.currencyCode).makePretty(amount)
        CACHE_FOR_MUL.key = params.basicCurrencyRate + '_' + amount
        CACHE_FOR_MUL.value = params.value
        return amount
    }
}
