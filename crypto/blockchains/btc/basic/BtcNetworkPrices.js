/**
 * @version 0.5
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const ESTIMATE_PATH = 'https://mempool.space/api/v1/fees/recommended'


const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES_BTC_TIME = 0
let CACHE_FEES_BTC = {}
let CACHE_PREV_DATA = {
    fastestFee: 19,
    halfHourFee: 3,
    hourFee: 2,
    lastBlock: 0,
    timeFromBlock: 0,
    timeFromBlockDiff: 0,
    mempoolSize: 0
}
let CACHE_PREV_PREV_DATA = {
    fastestFee: 19,
    halfHourFee: 3,
    hourFee: 2,
    lastBlock: 0,
    timeFromBlock: 0,
    timeFromBlockDiff: 0,
    mempoolSize: 0
}


export default class BtcNetworkPrices {

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks)
        const logData = {
            currencyCode,
            source: 'fromCache',
            cacheTime: CACHE_FEES_BTC_TIME[blocks] + '',
            fee: CACHE_FEES_BTC[blocks] + ''
        }

        const now = new Date().getTime()
        if (CACHE_FEES_BTC[blocks] && now - CACHE_FEES_BTC_TIME < CACHE_VALID_TIME) {
            // noinspection ES6MissingAwait
            MarketingEvent.logEvent('estimate_fee_btc_result', logData)
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' used cache => ' + CACHE_FEES_BTC[blocks])
            return CACHE_FEES_BTC[blocks]
        }

        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' ' + blocks + ' no cache load')

        let link = `${ESTIMATE_PATH}`
        let timeFromBlock = false
        let timeFromBlockDiff = false
        let lastBlock = 0
        let mempoolSize = 0
        if (currencyCode !== 'BTC_TEST') {


            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.NetworkPrices')
            const linkTrezor = this._trezorServer + '/api/'

            let tmp = false
            try {
                tmp = await BlocksoftAxios.getWithoutBraking(linkTrezor)
                if (tmp && tmp.data) {
                    lastBlock = tmp.data.blockbook.bestHeight
                    mempoolSize = tmp.data.blockbook.mempoolSize
                    timeFromBlock = tmp.data.blockbook.lastBlockTime
                    timeFromBlockDiff = now - new Date(timeFromBlock).getTime()
                }
            } catch (e) {

            }

            BlocksoftCryptoLog.log('BtcNetworkPricesProvider lastBlock ' + lastBlock + ' mempool ' + mempoolSize + ' timeFromBlock ' + timeFromBlock + ' diff ' + timeFromBlockDiff)

            tmp = false
            try {
                tmp = await BlocksoftAxios.getWithoutBraking(link)
                if (tmp && tmp.data) {
                    logData.source = 'reloaded'
                    if (lastBlock > CACHE_PREV_DATA.lastBlock) {
                        CACHE_PREV_PREV_DATA = CACHE_PREV_DATA
                    }
                    CACHE_PREV_DATA = tmp.data
                    CACHE_PREV_DATA.lastBlock = lastBlock
                    CACHE_PREV_DATA.mempoolSize = mempoolSize
                    CACHE_PREV_DATA.timeFromBlock = timeFromBlock
                    CACHE_PREV_DATA.timeFromBlockDiff = timeFromBlockDiff
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
        BlocksoftCryptoLog.log('BtcNetworkPricesProvider CACHE_FEES', {
            CACHE_PREV_DATA,
            CACHE_PREV_PREV_DATA, ...logData
        })
        try {
            const cachedWithTime = CACHE_PREV_DATA
            if (timeFromBlock) {
                if (timeFromBlockDiff < 1000) { // 1 minute from block
                    if (cachedWithTime.fastestFee < CACHE_PREV_PREV_DATA.fastestFee) {
                        cachedWithTime.fastestFee = CACHE_PREV_PREV_DATA.fastestFee
                        BlocksoftCryptoLog.log('BtcNetworkPricesProvider change as block 1 minute ago and fastest no ok - used prev ', CACHE_PREV_PREV_DATA)
                    } else if (CACHE_PREV_DATA.mempoolSize < 10000) {
                        cachedWithTime.fastestFee = cachedWithTime.fastestFee * 1.5
                        BlocksoftCryptoLog.log('BtcNetworkPricesProvider change as block 1 minute ago and fastest no ok - mempool is small')
                    } else {
                        cachedWithTime.fastestFee = cachedWithTime.fastestFee * 3
                        BlocksoftCryptoLog.log('BtcNetworkPricesProvider change as block 1 minute ago and fastest no ok - mempool is ok')
                    }
                } else if (timeFromBlockDiff < 5000) { // 2 minute from block
                    if (cachedWithTime.fastestFee < CACHE_PREV_PREV_DATA.fastestFee) {
                        cachedWithTime.fastestFee = CACHE_PREV_PREV_DATA.fastestFee
                        BlocksoftCryptoLog.log('BtcNetworkPricesProvider change as block 5 minute ago and fastest no ok - used prev ', CACHE_PREV_PREV_DATA)
                    }
                }
            }
            await this._parseLoaded(blocks, currencyCode, cachedWithTime, link)
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

        const externalSettings = await BlocksoftExternalSettings.getAll('BTC.getNetworkPrices')
        addMultiply(2, json.fastestFee * 1, externalSettings)
        addMultiply(6, json.halfHourFee * 1, externalSettings)
        addMultiply(12, json.hourFee * 1, externalSettings)

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

function addMultiply(blocks, fee, externalSettings) {
    if (typeof externalSettings['BTC_CURRENT_PRICE_' + blocks] !== 'undefined' && externalSettings['BTC_CURRENT_PRICE_' + blocks] > 0) {
        CACHE_FEES_BTC[blocks] = externalSettings['BTC_CURRENT_PRICE_' + blocks]
    } else if (typeof externalSettings['BTC_MULTI_V3_' + blocks] !== 'undefined' && externalSettings['BTC_MULTI_V3_' + blocks] > 0) {
        CACHE_FEES_BTC[blocks] = BlocksoftUtils.mul(fee, externalSettings['BTC_MULTI_V3_' + blocks]) * 1
    } else if (typeof externalSettings.BTC_MULTI_V3 !== 'undefined' && externalSettings.BTC_MULTI_V3 > 0) {
        CACHE_FEES_BTC[blocks] = BlocksoftUtils.mul(fee, externalSettings.BTC_MULTI_V3) * 1
        BlocksoftCryptoLog.log('BtcNetworkPricesProvider addMultiply result', {
            blocks,
            fee,
            mul: externalSettings.BTC_MULTI_V3,
            res: CACHE_FEES_BTC[blocks]
        })
    } else {
        CACHE_FEES_BTC[blocks] = fee
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
