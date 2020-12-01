import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const INFO_API_PATH = 'https://api.trongrid.io/wallet/getnodeinfo'
const INFO_MAX_TRY = 50 // max tries before error appear in axios get

let CACHE_LAST_BLOCK = 0

export default class TrxNodeInfoProvider {
    /**
     * @returns {Promise<number>}
     */
    async getLastBlock() {
        try {
            let info = await BlocksoftAxios.getWithoutBraking(INFO_API_PATH, INFO_MAX_TRY)
            if (info && typeof info.data !== 'undefined' && typeof info.data.block !== 'undefined') {
                info = info.data.block.split(',ID')
                info = info[0].substr(4) * 1
                if (info > CACHE_LAST_BLOCK) {
                    CACHE_LAST_BLOCK = info
                }
                BlocksoftCryptoLog.log('TrxNodeInfoProvider.getLastBlock currentBlock ' + JSON.stringify(info))
            } else {
                BlocksoftCryptoLog.log('TrxNodeInfoProvider.getLastBlock currentBlock warning ' + JSON.stringify(info))
            }
        } catch (e) {
            BlocksoftCryptoLog.log('TrxNodeInfoProvider.getLastBlock currentBlock error ' + e.message)
        }
        return CACHE_LAST_BLOCK
    }
}
