/**
 * @version 0.5
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

const API_PATH = 'https://microscanners.trustee.deals/fees'
const CACHE_VALID_CUSTOM_TIME = 120000 // 2 minutes

const CACHE_FEES_CUSTOM = {
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 100, '6': 4, '12': 2 },
    'LTC': { '2': 100, '6': 2, '12': 1 },
    'XVG': { '2': 700, '6': 600, '12': 300 }
}
let CACHE_FEES_CUSTOM_TIME = 0



export default class DogeNetworkPrices {
    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('DogeNetworkPricesProvider ' + currencyCode + ' ' + blocks)
        const now = new Date().getTime()

        if (now - CACHE_FEES_CUSTOM_TIME > CACHE_VALID_CUSTOM_TIME) {
            try {
                const tmp = await BlocksoftAxios.getWithoutBraking(API_PATH)
                if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
                    CACHE_FEES_CUSTOM_TIME = now
                    let key
                    for (key in tmp.data.data) {
                        CACHE_FEES_CUSTOM[key] = tmp.data.data[key]
                    }
                }
            } catch (e) {
                // do nothing
            }
        }

        if (!CACHE_FEES_CUSTOM || typeof CACHE_FEES_CUSTOM[currencyCode] === 'undefined') {
            throw new Error('DogeNetworkPricesProvider ' + currencyCode + ' not defined')
        }
        if (typeof CACHE_FEES_CUSTOM[currencyCode][blocks] !== 'undefined') {
            return CACHE_FEES_CUSTOM[currencyCode][blocks]
        } else if (blocks <= 2) {
            return CACHE_FEES_CUSTOM[currencyCode][2]
        } else if (blocks <= 12) {
            return CACHE_FEES_CUSTOM[currencyCode][6]
        } else {
            return CACHE_FEES_CUSTOM[currencyCode][12]
        }

    }

}
