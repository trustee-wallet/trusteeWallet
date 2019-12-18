import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'

class DogeScannerProcessor extends require('./BtcScannerProcessor').BtcScannerProcessor{

    constructor(settings) {
        super(settings)
        this._dogeApiPath = 'https://dogechain.info/api/v1'
        this._decimals = settings.decimals
    }

    /**
     * @param {string} address
     * @return {Promise<{balance:*, provider:string}>}
     * https://dogechain.info/api/blockchain_api
     * https://dogechain.info/api/v1/address/balance/D6ZBQSkEkcgAcX1QXt7csP2jgjyatTpvRj
     */
    async getBalance(address) {
        let res = await BlocksoftAxios.get(this._dogeApiPath + '/address/balance/' + address)
        if (!res.data || typeof(res.data.success) === 'undefined' || res.data.success !== 1) {
            return {balance : 0, provider: 'dogechain' }
        }
        let balance = BlocksoftUtils.fromUnified(res.data.balance, this._decimals)
        return {balance, provider: 'dogechain' }
    }
}

module.exports.init = function(settings) {
    return new DogeScannerProcessor(settings)
}
