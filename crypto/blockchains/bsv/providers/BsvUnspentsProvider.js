/**
 * @version 0.5
 *
 * https://bsv.btc.com/api-doc#Unspent
 * https://bsv-chain.api.btc.com/v3/address/15urYnyeJe3gwbGJ74wcX89Tz7ZtsFDVew/unspent
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

        const link = `${this._apiPath}/address/${address}/unspent`
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (!res.data || typeof res.data.data === 'undefined' || !res.data.data || typeof res.data.data.list === 'undefined' || !res.data.data.list) {
            return []
        }
        const sortedUnspents = []
        /**
         * https://bsv-chain.api.btc.com/v3/address/15urYnyeJe3gwbGJ74wcX89Tz7ZtsFDVew/unspent
         * @param {*} res.data.data.list[]
         * @param {string} res.data.data.list[].tx_hash "04ffa9c3875b15ceb65c2dd4ee2654c5fb65374123692362e32fac566a6b16aa"
         * @param {string} res.data.data.list[].tx_output_n 0
         * @param {string} res.data.data.list[].tx_output_n2
         * @param {string} res.data.data.list[].value 100000000
         * @param {string} res.data.data.list[].confirmations 147916
         */
        let unspent
        for (unspent of res.data.data.list) {
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
