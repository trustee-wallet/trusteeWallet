/**
 * @version 0.50
 */
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const CACHE_OF_TRANSACTIONS = {
    ASH : {},
    WAVES : {}
}
const CACHE_VALID_TIME = 30000 // 30 seconds

export default class WavesTransactionsProvider {

    async get(address, mainCurrencyCode) {
        let _apiPath
        if (mainCurrencyCode === 'ASH') {
            _apiPath = await BlocksoftExternalSettings.get('ASH_SERVER')
        } else {
            _apiPath = await BlocksoftExternalSettings.get('WAVES_SERVER')
        }
        const now = new Date().getTime()
        if (typeof CACHE_OF_TRANSACTIONS[mainCurrencyCode][address] !== 'undefined' && (now - CACHE_OF_TRANSACTIONS[mainCurrencyCode][address].time) < CACHE_VALID_TIME) {
            if (typeof CACHE_OF_TRANSACTIONS[mainCurrencyCode][address] !== 'undefined') {
                BlocksoftCryptoLog.log(' WavesTransactionsProvider.get from cache', address + ' => ' + mainCurrencyCode)
                return CACHE_OF_TRANSACTIONS[mainCurrencyCode][address].data
            }
        }
        const link = _apiPath + '/transactions/address/' + address + '/limit/100'
        const res = await BlocksoftAxios.get(link)
        if (!res || !res.data || typeof res.data[0] === 'undefined') {
            return false
        }

        CACHE_OF_TRANSACTIONS[mainCurrencyCode][address] = {
            data : res.data[0],
            time : now
        }
        return res.data[0]
    }
}
