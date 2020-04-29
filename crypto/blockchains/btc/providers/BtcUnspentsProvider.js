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
import { unpad } from 'ethereumjs-util'

let TREZOR_INDEX = 0

export default class BtcUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

    /**
     * @private
     */
    _trezorServer = false

    constructor(settings, serverCode) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    async getTx(tx) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getTx started ' + tx)

        if (!this._trezorServer) {
            this._trezorServer = await BlocksoftExternalSettings.get(this._trezorServerCode)
        }

        const link = this._trezorServer[TREZOR_INDEX] + '/api/v2/tx/' + tx
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined' || !res.data) {
            throw new Error('SERVER_RESPONSE_BAD_INTERNET')
        }

        const sortedUnspents = []
        let unspent

        for (unspent of res.data.vin) {
            unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
            if (typeof unspent.address === 'undefined') {
                unspent.address = unspent.addresses[0]
            }
            unspent.isSegwit =  unspent.address.indexOf('bc1') === 0
            sortedUnspents.push(unspent)
        }

        return sortedUnspents

    }


    /**
     * @param address
     * @param addressLegacy
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address, addressLegacy) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started ' + address + ' ' + addressLegacy)

        if (!this._trezorServer) {
            this._trezorServer = await BlocksoftExternalSettings.get(this._trezorServerCode)
        }

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
        if (!address || typeof address === 'undefined') return false
        const link = this._trezorServer[TREZOR_INDEX] + '/api/v2/utxo/' + address + '?gap=9999'// ?confirmed=true
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            TREZOR_INDEX++
            if (TREZOR_INDEX >= this._trezorServer.length) {
                TREZOR_INDEX = 0
            }
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' BtcUnspentsProvider._getUnspents nothing loaded for address ' + address + ' link ' + link)
        }
        if (!res.data || typeof res.data[0] === 'undefined') {
            return false
        }
        return res.data
    }
}
