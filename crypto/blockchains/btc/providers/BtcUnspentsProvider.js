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
     * @param addressLegacy
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address, addressLegacy) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started ' + address + ' ' + addressLegacy)

        const tmp = await Promise.all([
            this._getUnspents(address),
            this._getUnspents(addressLegacy)
        ])

        const sortedUnspents = []
        let unspent
        if (tmp[0]) {
            for (unspent of tmp[0]) {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (typeof unspent.address === 'undefined') {
                    unspent.address = address
                }
                unspent.isSegwit = true
                sortedUnspents.push(unspent)
            }
        }
        if (tmp[1]) {
            for (unspent of tmp[1]) {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (typeof unspent.address === 'undefined') {
                    unspent.address = addressLegacy
                }
                unspent.isSegwit = false
                sortedUnspents.push(unspent)
            }
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents result ' + address + ' ' + addressLegacy, sortedUnspents)
        return sortedUnspents
    }

    /**
     * @param address
     * @returns {Promise<*[]|*>}
     * @private
     */
    async _getUnspents(address) {
        const link = this._trezorPath + address + '?gap=9999'// ?confirmed=true
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            throw new Error(this._settings.currencyCode + ' BtcUnspentsProvider._getUnspents nothing loaded for address ' + address)
        }
        if (!res.data || typeof res.data[0] === 'undefined') {
            return false
        }
        return res.data
    }
}
