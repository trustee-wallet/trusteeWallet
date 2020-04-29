/**
 * @version 0.5
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const ESTIMATE_PATH = 'https://mempool.space/api/v1/fees/recommended'


const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES_BTC_TIME = 0
let CACHE_FEES_BTC = {}
let CACHE_PREV_DATA = { fastestFee: 19, halfHourFee: 3, hourFee: 2 }


export default class BtcNetworkPrices {

    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks)
        const logData = { currencyCode, source: 'fromCache', cacheTime: CACHE_FEES_BTC_TIME[blocks] + '', fee: CACHE_FEES_BTC[blocks] + '' }

        const now = new Date().getTime()
        if (CACHE_FEES_BTC[blocks] && now - CACHE_FEES_BTC_TIME < CACHE_VALID_TIME) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_btc_result', logData)
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' used cache => ' + CACHE_FEES_BTC[blocks])
            return CACHE_FEES_BTC[blocks]
        }

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' no cache load')

        let link = `${ESTIMATE_PATH}`
        if (currencyCode !== 'BTC_TEST') {
            let tmp = false
            try {
                tmp = await BlocksoftAxios.getWithoutBraking(link)
                if (tmp.data) {
                    logData.source = 'reloaded'
                    CACHE_PREV_DATA = tmp.data
                } else {
                    logData.source = 'fromLoadCache'
                    link = 'prev'
                }
            } catch (e) {
                // noinspection ES6MissingAwait
                MarketingEvent.logEvent('estimate_fee_btc_load_error', { currencyCode, link, data: e.toString() })
                // do nothing
            }
        }
        try {
            await this._parseLoaded(blocks, currencyCode, CACHE_PREV_DATA, link)
        } catch (e) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_btc_parse_error', { currencyCode, link, data: e.toString() })
            // do nothing
        }
        // noinspection ES6MissingAwait
        MarketingEvent.logEvent('estimate_fee_btc_result', logData)
        return CACHE_FEES_BTC[blocks]
    }

    async _parseLoaded(blocks, currencyCode, json, link) {

        CACHE_FEES_BTC = {}
        // noinspection PointlessArithmeticExpressionJS
        CACHE_FEES_BTC[2] = json.fastestFee * 1
        // noinspection PointlessArithmeticExpressionJS
        CACHE_FEES_BTC[6] = json.halfHourFee * 1
        // noinspection PointlessArithmeticExpressionJS
        CACHE_FEES_BTC[12] = json.hourFee * 1

        const externalSettings = await BlocksoftExternalSettings.getAll()
        addMultiply(2, externalSettings)
        addMultiply(6, externalSettings)
        addMultiply(12, externalSettings)

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

        if (CACHE_FEES_BTC[6] < CACHE_FEES_BTC[12]) {
            const t = CACHE_FEES_BTC[6]
            CACHE_FEES_BTC[6] = CACHE_FEES_BTC[12]
            CACHE_FEES_BTC[12] = t
        }

        CACHE_FEES_BTC_TIME = new Date().getTime()
        if (CACHE_FEES_BTC[2] > 0) {
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' => ' + CACHE_FEES_BTC)
        } else {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_btc_error', { currencyCode, link, json, externalSettings })
        }
    }
}

function addMultiply(blocks, externalSettings) {
    if (typeof externalSettings['BTC_CURRENT_PRICE_' + blocks] !== 'undefined' && externalSettings['BTC_CURRENT_PRICE_' + blocks] > 0) {
        CACHE_FEES_BTC[blocks] = externalSettings['BTC_CURRENT_PRICE_' + blocks]
    } else if (typeof externalSettings['BTC_MULTI_' + blocks] !== 'undefined' && externalSettings['BTC_MULTI_' + blocks] > 0) {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * externalSettings['BTC_MULTI_' + blocks])
    } else if (typeof externalSettings.BTC_MULTI !== 'undefined' && externalSettings.BTC_MULTI > 0) {
        CACHE_FEES_BTC[blocks] = Math.round(CACHE_FEES_BTC[blocks] * externalSettings.BTC_MULTI)
    }
    if (typeof externalSettings['BTC_MIN_' + blocks] !== 'undefined' && externalSettings['BTC_MIN_' + blocks] > 0) {
        if (externalSettings['BTC_MIN_' + blocks] > CACHE_FEES_BTC[blocks]) {
            CACHE_FEES_BTC[blocks] = externalSettings['BTC_MIN_' + blocks]
        }
    } else if (typeof externalSettings.BTC_MIN !== 'undefined' && externalSettings.BTC_MIN > 0) {
        if (externalSettings.BTC_MIN > CACHE_FEES_BTC[blocks]) {
            CACHE_FEES_BTC[blocks] = externalSettings.BTC_MIN
        }
    }
}
