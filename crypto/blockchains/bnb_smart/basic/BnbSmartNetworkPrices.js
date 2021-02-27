/**
 * @version 0.20
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES = 0
let CACHE_FEES_TIME = 0

class BnbSmartNetworkPrices {

    async getFees() {
        const now = new Date().getTime()
        if (CACHE_FEES && now - CACHE_FEES_TIME < CACHE_VALID_TIME) {
            return CACHE_FEES
        }

        BlocksoftCryptoLog.log('BnbSmartNetworkPricesProvider.getFees no cache load')

        try {
            const res = await BlocksoftAxios.getWithoutBraking('https://api.bscscan.com/api?module=proxy&action=eth_gasPrice&apikey=YourApiKeyToken')
            if (res && typeof res.data !== 'undefined' && typeof res.data.result !== 'undefined') {
                const tmp = BlocksoftUtils.hexToDecimal(res.data.result)
                if (tmp * 1 > 0) {
                    CACHE_FEES = (tmp * 1).toString().substr(0, 11)
                    CACHE_FEES_TIME = now
                } else if (!CACHE_FEES) {
                    CACHE_FEES = await BlocksoftExternalSettings.getStatic('BNB_SMART_PRICE')
                }
            }
        } catch (e) {
            BlocksoftCryptoLog.log('BnbSmartNetworkPricesProvider.getOnlyFees loaded prev fee as error' + e.message)
            // do nothing
        }

        return CACHE_FEES
    }

}



const singleton = new BnbSmartNetworkPrices()
export default singleton
