/**
 * @version 0.20
 **/
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import config from '@app/config/config'

const PROXY_FEES = 'https://proxy.trustee.deals/btc/getFees'

const CACHE_FEES_BTC = {
    data : {
        speed_blocks_2: 10,
        speed_blocks_6: 5,
        speed_blocks_12: 1
    }
}
export default class BtcNetworkPrices implements BlocksoftBlockchainTypes.NetworkPrices {

    async getNetworkPrices(currencyCode: string): Promise<{ 'speed_blocks_2': number, 'speed_blocks_6': number, 'speed_blocks_12': number }> {
        BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' load started')
        let res = false
        try {
            res = await BlocksoftAxios.post(PROXY_FEES, { currencyCode })
            if (typeof res.data === 'undefined') {
                throw new Error('no data')
            }
            if (typeof res.data.data === 'undefined' || typeof res.data.data.speed_blocks_2 === 'undefined') {
                throw new Error('bad data ' + JSON.stringify(res.data))
            }
            CACHE_FEES_BTC.data = res.data.data
            CACHE_FEES_BTC.loaded = new Date().getTime()
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' res ', CACHE_FEES_BTC)
        } catch (e) {
            BlocksoftCryptoLog.log('BtcNetworkPricesProvider ' + currencyCode + ' error ' + e.toString())
            throw e
        }
        if (config.debug.cryptoErrors) {
           console.log('BtcNetworkPricesProvider ' + currencyCode + ' res ' + JSON.stringify(CACHE_FEES_BTC.data))
        }

        return CACHE_FEES_BTC.data
    }
}