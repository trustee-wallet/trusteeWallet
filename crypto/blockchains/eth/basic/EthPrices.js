/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const ESTIMATE_API_PATH = 'https://ethgasstation.info/json/ethgasAPI.json'
const ESTIMATE_MAX_TRY = 50 // max tries before error appear in axios get
const MAGIC_TX_DIVIDER = BlocksoftUtils.toBigNumber(10)

const CACHE_VALID_TIME = 120000 // 2 minute
let CACHE_FEES = false
let CACHE_FEES_TIME = 0

class EthPrices {

    /**
     * @returns {{ price_0: BigNumber, price_1: BigNumber, price_2: BigNumber, average: int, fast: int, safeLow: int}}
     */
    async get() {
        const now = new Date().getTime()
        if (CACHE_FEES && now - CACHE_FEES_TIME < CACHE_VALID_TIME) {
            BlocksoftCryptoLog.log('EthPricesCache.get used cache')
            return CACHE_FEES
        }
        BlocksoftCryptoLog.log('EthPricesCache.get no cache')
        let tmp = await BlocksoftAxios.getWithoutBraking(ESTIMATE_API_PATH, ESTIMATE_MAX_TRY)
        if (tmp && typeof(tmp.data) != 'undefined' && tmp.data) {
            CACHE_FEES = this._normalize(tmp.data)
            CACHE_FEES_TIME = now
            if (!tmp.data.fast) {
                throw new Error('something wrong in fees ' + ESTIMATE_API_PATH + ' no fast data in ' + JSON.stringify(tmp.data))
            }
        }

        let result = CACHE_FEES
        if (!CACHE_FEES) {
            result = this._normalize({ 'fast': 100.0, 'safeLow': 13.0, 'average': 30.0 })
        }
        return result
    }

    /**
     * @param {int} gasPrice.safeLow
     * @param {int} gasPrice.average
     * @param {int} gasPrice.fast
     * @returns {{ price_0: BigNumber, price_1: BigNumber, price_2: BigNumber, average: int, fast: int, safeLow: int}}
     * @private
     */
    _normalize(gasPrice) {
        let price_0 = gasPrice.safeLow
        let price_1 = gasPrice.average
        let price_2 = gasPrice.fast
        if (price_0 === price_1) {
            if (price_1 === price_2) {
                price_1 = Math.round(price_0 * 1.1)
                price_2 = Math.round(price_1 * 1.1)
            } else {
                price_1 = Math.round(price_0 * 1.1)
            }
        } else if (price_1 === price_2) {
            price_2 = Math.round(price_1 * 1.1)
        }
        if (price_1 > price_2) {
            let tmp = price_1
            price_1 = price_2
            price_2 = tmp
        }

        price_0 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_0, 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        price_1 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_1, 'gwei')).div(MAGIC_TX_DIVIDER)
        price_2 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_2, 'gwei')).div(MAGIC_TX_DIVIDER)

        // noinspection JSValidateTypes
        return {
            price_0,
            price_1,
            price_2,
            safeLow : gasPrice.safeLow,
            average : gasPrice.average,
            fast : gasPrice.fast
        }

    }
}

let singleton = new EthPrices()
export default singleton
