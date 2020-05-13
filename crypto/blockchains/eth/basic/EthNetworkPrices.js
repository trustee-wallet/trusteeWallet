/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const ESTIMATE_PATH = 'https://ethgasstation.info/json/ethgasAPI.json'
const ESTIMATE_MAX_TRY = 50 // max tries before error appear in axios get
const MAGIC_TX_DIVIDER = BlocksoftUtils.toBigNumber(10)

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES_ETH = false
let CACHE_FEES_ETH_TIME = 0

let CACHE_PREV_DATA = { 'fastest': 100.0, 'safeLow': 13.0, 'average': 30.0 }

class EthNetworkPrices {

    /**
     * @returns {{ price0: BigNumber, price1: BigNumber, price2: BigNumber, average: int, fast: int, safeLow: int}}
     */
    async get() {

        BlocksoftCryptoLog.log('EthNetworkPricesProvider started')
        const logData = { source: 'fromCache', cacheTime: CACHE_FEES_ETH_TIME + '', fee: JSON.stringify(CACHE_FEES_ETH)}

        const now = new Date().getTime()
        if (CACHE_FEES_ETH && now - CACHE_FEES_ETH_TIME < CACHE_VALID_TIME) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_eth_result', logData)
            BlocksoftCryptoLog.log('EthNetworkPricesProvider used cache => ' + JSON.stringify(CACHE_FEES_ETH))
            return this._format()
        }

        BlocksoftCryptoLog.log('EthNetworkPricesProvider no cache load')

        let link = `${ESTIMATE_PATH}`
        let tmp = false
        try {
            tmp = await BlocksoftAxios.getWithoutBraking(link, ESTIMATE_MAX_TRY)
            if (tmp.data && tmp.data.fastest) {
                logData.source = 'reloaded'
                CACHE_PREV_DATA = tmp.data
            } else {
                logData.source = 'fromLoadCache'
                link = 'prev'
            }
        } catch (e) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_eth_load_error', { link, data: e.toString() })
            // do nothing
        }

        try {
            await this._parseLoaded(CACHE_PREV_DATA, link)
        } catch (e) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_eth_parse_error', {link, data: e.toString() })
            // do nothing
        }
        // noinspection ES6MissingAwait
        MarketingEvent.logEvent('estimate_fee_eth_result', logData)

        return this._format()
    }

    _format() {
        return {
            price0 : CACHE_FEES_ETH[12],
            price1 : CACHE_FEES_ETH[6],
            price2 : CACHE_FEES_ETH[2],
            safeLow : CACHE_FEES_ETH[12].toString(),
            average : CACHE_FEES_ETH[6].toString(),
            fastest : CACHE_FEES_ETH[2].toString()
        }
    }


    /**
     * @param {int} json.safeLow
     * @param {int} json.average
     * @param {int} json.fastest
     * @returns {{ price0: BigNumber, price1: BigNumber, price2: BigNumber, average: int, fast: int, safeLow: int}}
     * @private
     */
    async _parseLoaded(json) {

        CACHE_FEES_ETH = {}
        CACHE_FEES_ETH[2] = json.fastest * 1
        CACHE_FEES_ETH[6] = json.average * 1
        CACHE_FEES_ETH[12] = json.safeLow * 1

        const externalSettings = await BlocksoftExternalSettings.getAll('ETH.getNetworkPrices')
        addMultiply(2, externalSettings)
        addMultiply(6, externalSettings)
        addMultiply(12, externalSettings)

        if (CACHE_FEES_ETH[12] === CACHE_FEES_ETH[6]) {
            if (CACHE_FEES_ETH[6] === CACHE_FEES_ETH[2]) {
                CACHE_FEES_ETH[6] = Math.round(CACHE_FEES_ETH[12] * 1.1)
                CACHE_FEES_ETH[2] = Math.round(CACHE_FEES_ETH[6] * 1.1)
            } else {
                CACHE_FEES_ETH[6] = Math.round(CACHE_FEES_ETH[12] * 1.1)
            }
        } else if (CACHE_FEES_ETH[6] === CACHE_FEES_ETH[2]) {
            CACHE_FEES_ETH[2] = Math.round(CACHE_FEES_ETH[6] * 1.1)
        }
        if (CACHE_FEES_ETH[6] > CACHE_FEES_ETH[2]) {
            const tmp = CACHE_FEES_ETH[6]
            CACHE_FEES_ETH[6] = CACHE_FEES_ETH[2]
            CACHE_FEES_ETH[2] = tmp
        }

        try {
            CACHE_FEES_ETH[12] = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(CACHE_FEES_ETH[12], 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
            CACHE_FEES_ETH[6] = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(CACHE_FEES_ETH[6], 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
            CACHE_FEES_ETH[2] = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(CACHE_FEES_ETH[2], 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        } catch (e) {
            e.message += ' in EthPrice Magic divider'
            throw e
        }

        CACHE_FEES_ETH_TIME = new Date().getTime()
    }
}

function addMultiply(blocks, externalSettings) {
    if (typeof externalSettings['ETH_CURRENT_PRICE_' + blocks] !== 'undefined' && externalSettings['ETH_CURRENT_PRICE_' + blocks] > 0) {
        CACHE_FEES_ETH[blocks] = externalSettings['ETH_CURRENT_PRICE_' + blocks]
    } else if (typeof externalSettings['ETH_MULTI_' + blocks] !== 'undefined' && externalSettings['ETH_MULTI_' + blocks] > 0) {
        CACHE_FEES_ETH[blocks] = Math.round(CACHE_FEES_ETH[blocks] * externalSettings['ETH_MULTI_' + blocks])
    } else if (typeof externalSettings.ETH_MULTI !== 'undefined' && externalSettings.ETH_MULTI > 0) {
        CACHE_FEES_ETH[blocks] = Math.round(CACHE_FEES_ETH[blocks] * externalSettings.ETH_MULTI)
    }
    if (typeof externalSettings['ETH_MIN_' + blocks] !== 'undefined' &&  externalSettings['ETH_MIN_' + blocks] > 0) {
        if (externalSettings['ETH_MIN_' + blocks] > CACHE_FEES_ETH[blocks]) {
            CACHE_FEES_ETH[blocks] = externalSettings['ETH_MIN_' + blocks]
        }
    } else if (typeof externalSettings.ETH_MIN !== 'undefined' && externalSettings.ETH_MIN > 0) {
        if (externalSettings.ETH_MIN > CACHE_FEES_ETH[blocks]) {
            CACHE_FEES_ETH[blocks] = externalSettings.ETH_MIN
        }
    }
}


const singleton = new EthNetworkPrices()
export default singleton

