/**
 * @version 0.5
 *
 * https://bsv.btc.com/api-doc#Unspent
 *
 * @typedef {Object} UnifiedUnspent
 * @property {*} vout 1
 * @property {*} value 9998331800
 * @property {*} valueBN 9998331800
 * @property {*} height 3038080
 * @property {*} confirmations 11808
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

export default class BsvUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://bsv-chain.api.btc.com/v3'

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents started', address)

        let link = `${this._apiPath}/address/${address}/unspent`
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof res.data === 'undefined') {
            throw new Error(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents nothing loaded for address')
        }
        if (!res || typeof res.data === 'undefined' || !res.data || typeof res.data.data.list === 'undefined' || !res.data.data.list) return []
        let sortedUnspents = []
        /**
         * @param {*} res.data.data.list[]
         * @param {string} res.data.data.list[].tx_output_n 0
         * @param {string} res.data.data.list[].tx_output_n2
         * @param {string} res.data.data.list[].value 100000000
         * @param {string} res.data.data.list[].confirmations 147916
         */
        for (let unspent of res.data.data.list) {
            sortedUnspents.push({
                txid: unspent.tx_hash,
                vout: unspent.tx_output_n,
                value: unspent.value.toString(),
                height: 0,
                confirmations : unspent.confirmations,
                valueBN : BlocksoftUtils.toBigNumber(unspent.value.toString())
            })
        }
        return sortedUnspents
    }
}
