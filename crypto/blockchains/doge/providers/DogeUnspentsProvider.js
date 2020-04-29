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
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

let TREZOR_INDEX = 0

export default class DogeUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = ''

    /**
     * @private
     */
    _trezorServer = false

    constructor(settings, serverCode) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    /**
     * @param address
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getUnspents started', address)

        if (!this._trezorServer) {
            this._trezorServer = await BlocksoftExternalSettings.get(this._trezorServerCode)
        }

        const link = this._trezorServer[TREZOR_INDEX] + '/api/v2/utxo/' + address
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            TREZOR_INDEX++
            if (TREZOR_INDEX >= this._trezorServer.length) {
                TREZOR_INDEX = 0
            }
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' DogeUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (!res.data || typeof res.data[0] === 'undefined') {
            return []
        }
        const sortedUnspents = []
        let unspent
        for (unspent of res.data) {
            unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
            sortedUnspents.push(unspent)
        }
        return sortedUnspents
    }
}
