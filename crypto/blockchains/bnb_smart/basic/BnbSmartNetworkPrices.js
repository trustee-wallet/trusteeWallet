/**
 * @version 0.20
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import config from '@app/config/config'

const CACHE_VALID_TIME = 120000 // 2 minute
const CACHE_FEES = {
    'BNB' : {
        fee : 5000000000,
        ts : 0
    }
}

class BnbSmartNetworkPrices {
    async getFees(mainCurrencyCode, etherscanApiPath, defaultFee = 5000000000, source = '') {
        const now = new Date().getTime()
        if (typeof CACHE_FEES[mainCurrencyCode] !== 'undefined' && now - CACHE_FEES[mainCurrencyCode].ts < CACHE_VALID_TIME) {
            return CACHE_FEES[mainCurrencyCode].fee
        }
        const tmp = etherscanApiPath.split('/')
        const feesApiPath = `https://${tmp[2]}/api?module=proxy&action=eth_gasPrice&apikey=YourApiKeyToken`
        BlocksoftCryptoLog.log(mainCurrencyCode + ' BnbSmartNetworkPricesProvider.getFees no cache load')
        try {
            const res = await BlocksoftAxios.getWithoutBraking(feesApiPath)
            if (res && typeof res.data !== 'undefined' && typeof res.data.result !== 'undefined') {
                const tmp = BlocksoftUtils.hexToDecimal(res.data.result)
                if (tmp * 1 > 0) {
                    CACHE_FEES[mainCurrencyCode] = {
                        fee : (tmp * 1).toString().substr(0, 11),
                        time : now
                    }
                } else if (typeof CACHE_FEES[mainCurrencyCode] === 'undefined' || !CACHE_FEES[mainCurrencyCode].fee) {
                    CACHE_FEES[mainCurrencyCode].fee = await BlocksoftExternalSettings.getStatic('BNB_SMART_PRICE')
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(mainCurrencyCode + ' BnbSmartNetworkPricesProvider.getOnlyFees loaded prev fee as error' + e.message)
            }
            BlocksoftCryptoLog.log(mainCurrencyCode + ' BnbSmartNetworkPricesProvider.getOnlyFees loaded prev fee as error' + e.message)
            // do nothing
        }

        return typeof CACHE_FEES[mainCurrencyCode] !== 'undefined' ? CACHE_FEES[mainCurrencyCode].fee : defaultFee
    }
}


const singleton = new BnbSmartNetworkPrices()
export default singleton
