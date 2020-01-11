/**
 * @version 0.5
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const API_PATH = 'https://microscanners.trustee.deals/fees'
const ESTIMATE_PATH = 'https://estimatefee.com/n'

const CACHE_VALID_CUSTOM_TIME = 60000 // 1 minute
const CACHE_VALID_TIME = 60000 // 1 minute

let CACHE_FEES_CUSTOM = {
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 100, '6': 4, '12': 2 },
    'LTC': { '2': 100, '6': 2, '12': 1 },
    'XVG': { '2': 700, '6': 600, '12': 300 }
}
let CACHE_FEES_CUSTOM_TIME = 0

let CACHE_FEES_BTC = { '2': 19, '6': 3, '12': 2 }
let CACHE_FEES_BTC_TIME = []



export default class BtcNetworkPrices {
    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks)
        const now = new Date().getTime()

        if (now - CACHE_FEES_CUSTOM_TIME > CACHE_VALID_CUSTOM_TIME) {
            try {
                let tmp = await BlocksoftAxios.getWithoutBraking(API_PATH)
                if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
                    CACHE_FEES_CUSTOM_TIME = now
                    CACHE_FEES_CUSTOM = tmp.data.data
                }
            } catch (e) {
                //do nothing
            }
        }

        let logData = {currencyCode, source: "fromCache", cacheTime : CACHE_FEES_BTC_TIME[blocks] + "", fee : CACHE_FEES_BTC[blocks] + ""}
        if (CACHE_FEES_BTC[blocks] && now - CACHE_FEES_BTC_TIME[blocks] < CACHE_VALID_TIME) {
            MarketingEvent.logEvent('estimate_fee_per_byte_result', logData)
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' used cache => ' + CACHE_FEES_BTC[blocks])
            return CACHE_FEES_BTC[blocks]
        }
        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' no cache load')

        const link = `${ESTIMATE_PATH}/${blocks}`
        let tmp = false
        try {
            tmp = await BlocksoftAxios.get(link, true)
            if (tmp.data) {
                let value = Math.round(tmp.data * 100000)
                if (value > 0) {
                    CACHE_FEES_BTC_TIME[blocks] = now
                    logData.cacheTime = now + ""
                    logData.estimateFee = value + ""
                    logData.estimateLink = link + ""
                    logData.source = "loadedNew"
                    if (typeof CACHE_FEES_CUSTOM['BTC_MULTI_' + blocks] != 'undefined') {
                        CACHE_FEES_BTC[blocks] = Math.round(value * CACHE_FEES_CUSTOM['BTC_MULTI'])
                        logData.correctedEstimateFee = CACHE_FEES_BTC[blocks] + ""
                        logData.source = "loadedNewMultiFor" + blocks
                    } else if (typeof CACHE_FEES_CUSTOM['BTC_MULTI'] != 'undefined') {
                        CACHE_FEES_BTC[blocks] = Math.round(value * CACHE_FEES_CUSTOM['BTC_MULTI'])
                        logData.correctedEstimateFee = CACHE_FEES_BTC[blocks] + ""
                        logData.source = "loadedNewMulti"
                    } else {
                        CACHE_FEES_BTC[blocks] = value
                    }
                    BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' => ' + CACHE_FEES_BTC[blocks])
                } else {
                    MarketingEvent.logEvent('estimate_fee_per_byte_error', {currencyCode, link, data : JSON.stringify(tmp.data)})
                }
            }
        } catch (e) {
            MarketingEvent.logEvent('estimate_fee_per_byte_error', {currencyCode, link, data : e.toString()})
            //do nothing
        }
        MarketingEvent.logEvent('estimate_fee_per_byte_result', logData)
        return CACHE_FEES_BTC[blocks]

    }

}
