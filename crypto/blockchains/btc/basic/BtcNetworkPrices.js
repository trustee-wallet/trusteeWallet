/**
 * @version 0.5
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const API_PATH = 'https://microscanners.trustee.deals/fees'
const ESTIMATE_PATH = 'https://mempool.space/api/v1/fees/recommended'

const CACHE_VALID_CUSTOM_TIME = 60000 // 1 minute
const CACHE_VALID_TIME = 60000 // 1 minute

const CACHE_FEES_CUSTOM = {
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 100, '6': 4, '12': 2 },
    'LTC': { '2': 100, '6': 2, '12': 1 },
    'XVG': { '2': 700, '6': 600, '12': 300 }
}
let CACHE_FEES_CUSTOM_TIME = 0

const CACHE_FEES_BTC = { '2': 19, '6': 3, '12': 2 }
let CACHE_FEES_BTC_TIME = 0


export default class BtcNetworkPrices {
    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks)
        const now = new Date().getTime()

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

        const logData = { currencyCode, source: 'fromCache', cacheTime: CACHE_FEES_BTC_TIME[blocks] + '', fee: CACHE_FEES_BTC[blocks] + '' }
        if (CACHE_FEES_BTC[blocks] && now - CACHE_FEES_BTC_TIME < CACHE_VALID_TIME) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_per_byte_result', logData)
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' used cache => ' + CACHE_FEES_BTC[blocks])
            return CACHE_FEES_BTC[blocks]
        }
        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' no cache load')

        const link = `${ESTIMATE_PATH}`
        let tmp = false
        try {
            tmp = await BlocksoftAxios.getWithoutBraking(link)
            if (tmp.data) {
                this._parseLoaded(blocks, currencyCode, tmp.data, link)
            }
        } catch (e) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_per_byte_error', { currencyCode, link, data: e.toString() })
            // do nothing
        }
        // noinspection ES6MissingAwait
        MarketingEvent.logEvent('estimate_fee_per_byte_result', logData)
        return CACHE_FEES_BTC[blocks]
    }

    _setCache(json) {
        let key
        for (key in json) {
            CACHE_FEES_CUSTOM[key] = json[key]
        }
    }

    async _parseLoaded(blocks, currencyCode, json, link) {

        CACHE_FEES_BTC[2] = json.fastestFee * 1
        CACHE_FEES_BTC[6] = json.halfHourFee * 1
        CACHE_FEES_BTC[12] = json.hourFee * 1

        addMultiply(2)
        addMultiply(6)
        addMultiply(12)

        if (CACHE_FEES_BTC[2] === 1) {
            CACHE_FEES_BTC[2] = 4
        }
        if (CACHE_FEES_BTC[6] === CACHE_FEES_BTC[2]) {
            if (CACHE_FEES_BTC[12] === CACHE_FEES_BTC[6]) {
                CACHE_FEES_BTC[6] = Math.round(CACHE_FEES_BTC[6] / 2)
                CACHE_FEES_BTC[12] = Math.round(CACHE_FEES_BTC[6] / 2)
            } else {
                CACHE_FEES_BTC[6] = Math.round(CACHE_FEES_BTC[2] / 2)
            }
        } else if (CACHE_FEES_BTC[12] === CACHE_FEES_BTC[6]) {
            CACHE_FEES_BTC[12] = Math.round(CACHE_FEES_BTC[6] / 2)
        }


        if (CACHE_FEES_BTC[12] === 0 || CACHE_FEES_BTC[6] === 1) {
            CACHE_FEES_BTC[12] = 1
            if (CACHE_FEES_BTC[6] === 1) {
                CACHE_FEES_BTC[6] = 2
            }
        }

        if (CACHE_FEES_BTC[6] < CACHE_FEES_BTC[12]) {
            const t = CACHE_FEES_BTC[6]
            CACHE_FEES_BTC[6] = CACHE_FEES_BTC[12]
            CACHE_FEES_BTC[12] = t
        }

        if (CACHE_FEES_BTC[2] < CACHE_FEES_BTC[6]) {
            const t = CACHE_FEES_BTC[6]
            CACHE_FEES_BTC[6] = CACHE_FEES_BTC[2]
            CACHE_FEES_BTC[2] = t
        }

        const now = new Date().getTime()
        CACHE_FEES_BTC_TIME = now
        if (CACHE_FEES_BTC[2] > 0) {
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' => ' + CACHE_FEES_BTC)
        } else {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_per_byte_error', { currencyCode, link, data: JSON.stringify(tmp.data) })
        }
    }

}

function addMultiply(blocks) {
    if (typeof CACHE_FEES_CUSTOM['BTC_MULTI_NEW_' + blocks] !== 'undefined') {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * CACHE_FEES_CUSTOM['BTC_MULTI_NEW_' + blocks])
    } else if (typeof CACHE_FEES_CUSTOM.BTC_MULTI_NEW !== 'undefined') {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * CACHE_FEES_CUSTOM.BTC_MULTI_NEW)
    } else if (typeof CACHE_FEES_CUSTOM['BTC_MULTI_' + blocks] !== 'undefined') {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * CACHE_FEES_CUSTOM['BTC_MULTI_' + blocks])
    } else if (typeof CACHE_FEES_CUSTOM.BTC_MULTI !== 'undefined') {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * CACHE_FEES_CUSTOM.BTC_MULTI)
    }
    if (typeof CACHE_FEES_CUSTOM['BTC_MIN_' + blocks] !== 'undefined') {
        if (CACHE_FEES_CUSTOM['BTC_MIN_' + blocks] > CACHE_FEES_BTC[blocks]) {
            CACHE_FEES_BTC[blocks] = CACHE_FEES_CUSTOM['BTC_MIN_' + blocks]
        }
    } else if (typeof CACHE_FEES_CUSTOM.BTC_MIN !== 'undefined') {
        if (CACHE_FEES_CUSTOM.BTC_MIN > CACHE_FEES_BTC[blocks]) {
            CACHE_FEES_BTC[blocks] = CACHE_FEES_CUSTOM.BTC_MIN
        }
    }
}
