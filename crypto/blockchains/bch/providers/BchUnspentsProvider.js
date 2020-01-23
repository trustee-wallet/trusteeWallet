/**
 * @version 0.5
 *
 * https://developer.bitcoin.com/rest/docs/address
 * https://rest.bitcoin.com/v2/address/utxo/bitcoincash:qz6qh4304stgwpqxp6gwsucma30fewp7z5cs4yuvdf
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
import BtcCashUtils from '../ext/BtcCashUtils'

export default class BchUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://rest.bitcoin.com/v2/address/utxo/bitcoincash:'

    /**
     * @param settings
     */
    constructor(settings) {
        this._settings = settings
    }

    /**
     * @param address
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BchUnspentsProvider.getUnspents started', address)
        address = BtcCashUtils.fromLegacyAddress(address)
        let link = this._apiPath + address
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof res.data === 'undefined') {
            throw new Error(this._settings.currencyCode + ' BchUnspentsProvider.getUnspents nothing loaded for address')
        }
        if (!res.data || typeof res.data.utxos === 'undefined' || !res.data.utxos) {
            return []
        }
        let sortedUnspents = []
        /**
         * https://rest.bitcoin.com/v2/address/utxo/bitcoincash:qz6qh4304stgwpqxp6gwsucma30fewp7z5cs4yuvdf
         * @param {*} res.data.utxos[]
         * @param {string} res.data.utxos[].txid 5be83026d82b56e8df7fa309e0b50132cb5cac228f83103532b20e0c991a3f9b
         * @param {string} res.data.utxos[].vout 1
         * @param {string} res.data.utxos[].amount 0.04373313
         * @param {string} res.data.utxos[].satoshis 4373313
         * @param {string} res.data.utxos[].height 615754
         * @param {string} res.data.utxos[].confirmations
         */
        for (let unspent of res.data.utxos) {
            sortedUnspents.push({
                txid: unspent.txid,
                vout: unspent.vout,
                value: unspent.satoshis.toString(),
                height: unspent.height,
                confirmations : unspent.confirmations,
                valueBN : BlocksoftUtils.toBigNumber(unspent.satoshis.toString())
            })
        }

        return sortedUnspents
    }
}
