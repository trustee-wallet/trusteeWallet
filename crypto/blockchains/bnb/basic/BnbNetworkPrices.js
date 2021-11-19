/**
 * @version 0.20
 *
 * https://beptools.org/fees
 * https://dex.binance.org/api/v1/fees
 * https://docs.binance.org/api-reference/dex-api/paths.html#apiv1fees
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_FEES = {
    send : {
        fee: 37500
    }
}
let CACHE_FEES_TIME = 0

class BnbNetworkPrices {


    async getFees() {
        const now = new Date().getTime()
        if (CACHE_FEES && now - CACHE_FEES_TIME < CACHE_VALID_TIME) {
            return CACHE_FEES
        }

        BlocksoftCryptoLog.log('BnbNetworkPricesProvider.getFees no cache load')

        const apiServer = await BlocksoftExternalSettings.getStatic('BNB_SERVER')
        const link = `${apiServer}/api/v1/fees`

        try {
            const tmp = await BlocksoftAxios.getWithoutBraking(link, 2)
            if (tmp.data) {
                // {"fee": 1000000, "fee_for": 1, "msg_type": "transferOwnership"}]
                const result = {}
                for (const row of tmp.data) {
                    if (typeof row.fixed_fee_params !== 'undefined') {
                        result[row.fixed_fee_params.msg_type] = { fee: row.fixed_fee_params.fee, for: row.fixed_fee_params.fee_for }
                    } else {
                        result[row.msg_type] = { fee: row.fee, for: row.fee_for }
                    }
                }
                if (typeof result['send'] !== 'undefined') {
                    CACHE_FEES = result
                    CACHE_FEES_TIME = now
                }
            }
        } catch (e) {
            BlocksoftCryptoLog.log('BnbNetworkPricesProvider.getOnlyFees loaded prev fee as error' + e.message)
            // do nothing
        }

        return CACHE_FEES
    }


}

const singleton = new BnbNetworkPrices()
export default singleton

