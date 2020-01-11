/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 *
 * @typedef {Object} UnifiedUnspent
 * @property {*} txid '1885a8fc772be4704cbdbaf84b39956cbb4eb69e5eef0a3d35ba5cb29b0af333',
 * @property {*} vout 1
 * @property {*} value 9998331800
 * @property {*} valueBN 9998331800
 * @property {*} height 3038080
 * @property {*} confirmations 11808
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

export default class BtcUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorPath = ''

    constructor(settings, serverPath) {
        this._settings = settings
        this._trezorPath = serverPath + '/api/v2/utxo/'
    }

    /**
     * @param address
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started', address)

        let link = this._trezorPath + address //?confirmed=true
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof res.data[0] === 'undefined') {
            throw new Error(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents nothing loaded for address')
        }
        let sortedUnspents = []
        for (let unspent of res.data) {
            unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
            sortedUnspents.push(unspent)
        }
        return sortedUnspents
    }
}
