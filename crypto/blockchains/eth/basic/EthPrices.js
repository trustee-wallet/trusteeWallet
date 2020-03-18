/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const API_PATH = 'https://microscanners.trustee.deals/fees'

const ESTIMATE_API_PATH = 'https://ethgasstation.info/json/ethgasAPI.json'
const ESTIMATE_MAX_TRY = 50 // max tries before error appear in axios get
const MAGIC_TX_DIVIDER = BlocksoftUtils.toBigNumber(10)

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES = false
let CACHE_FEES_TIME = 0

const CACHE_VALID_CUSTOM_TIME = 60000 // 1 minute
const CACHE_FEES_CUSTOM = {
    'ETH_MULTI' : 1
}
let CACHE_FEES_CUSTOM_TIME = 0

class EthPrices {

    /**
     * @returns {{ price0: BigNumber, price1: BigNumber, price2: BigNumber, average: int, fast: int, safeLow: int}}
     */
    async get() {
        const now = new Date().getTime()
        if (CACHE_FEES && now - CACHE_FEES_TIME < CACHE_VALID_TIME) {
            BlocksoftCryptoLog.log('EthPricesCache.get used cache')
            return CACHE_FEES
        }

        if (now - CACHE_FEES_CUSTOM_TIME > CACHE_VALID_CUSTOM_TIME) {
            try {
                const tmp = await BlocksoftAxios.getWithoutBraking(API_PATH)
                if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
                    CACHE_FEES_CUSTOM_TIME = now
                    this._setCache(tmp.data.data)
                }
            } catch (e) {
                // do nothing
            }
        }

        BlocksoftCryptoLog.log('EthPricesCache.get no cache')
        const tmp = await BlocksoftAxios.getWithoutBraking(ESTIMATE_API_PATH, ESTIMATE_MAX_TRY)
        if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
            CACHE_FEES = this._normalize(tmp.data)
            CACHE_FEES_TIME = now
            if (!tmp.data.fastest) {
                throw new Error('something wrong in fees ' + ESTIMATE_API_PATH + ' no fastest data in ' + JSON.stringify(tmp.data))
            }
        }

        let result = CACHE_FEES
        if (!CACHE_FEES) {
            result = this._normalize({ 'fast': 100.0, 'safeLow': 13.0, 'average': 30.0 })
        }
        BlocksoftCryptoLog.log('EthPrices.get result', result)
        return result
    }

    _setCache(json) {
        let key
        for (key in json) {
            CACHE_FEES_CUSTOM[key] = json[key]
        }
    }

    /**
     * @param {int} gasPrice.safeLow
     * @param {int} gasPrice.average
     * @param {int} gasPrice.fast
     * @param {int} gasPrice.fastest
     * @returns {{ price0: BigNumber, price1: BigNumber, price2: BigNumber, average: int, fast: int, safeLow: int}}
     * @private
     */
    _normalize(gasPrice) {
        let price0 = gasPrice.safeLow
        let price1 = gasPrice.average
        let price2 = gasPrice.fastest
        if (typeof CACHE_FEES_CUSTOM.ETH !== 'undefined' && CACHE_FEES_CUSTOM.ETH) {
            price0 = CACHE_FEES_CUSTOM.ETH[12]
            price1 = CACHE_FEES_CUSTOM.ETH[6]
            price2 = CACHE_FEES_CUSTOM.ETH[2]
        } else if (typeof CACHE_FEES_CUSTOM.ETH_MULTI !== 'undefined' && CACHE_FEES_CUSTOM.ETH_MULTI) {
            price0 = Math.round(price0 * CACHE_FEES_CUSTOM.ETH_MULTI)
            price1 = Math.round(price1 * CACHE_FEES_CUSTOM.ETH_MULTI)
            price2 = Math.round(price2 * CACHE_FEES_CUSTOM.ETH_MULTI)
        }
        if (price0 === price1) {
            if (price1 === price2) {
                price1 = Math.round(price0 * 1.1)
                price2 = Math.round(price1 * 1.1)
            } else {
                price1 = Math.round(price0 * 1.1)
            }
        } else if (price1 === price2) {
            price2 = Math.round(price1 * 1.1)
        }
        if (price1 > price2) {
            const tmp = price1
            price1 = price2
            price2 = tmp
        }

        try {
            price0 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price0, 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        } catch (e) {
            e.message += ' in EthPrice.0'
            throw e
        }

        try {
            price1 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price1, 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        } catch (e) {
            e.message += ' in EthPrice.1'
            throw e
        }

        try {
            price2 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price2, 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        } catch (e) {
            e.message += ' in EthPrice.2'
            throw e
        }

        // noinspection JSValidateTypes
        return {
            price0 ,
            price1,
            price2,
            safeLow : price0.toString(),
            average : price1.toString(),
            fastest : price2.toString()
        }

    }
}

const singleton = new EthPrices()
export default singleton
