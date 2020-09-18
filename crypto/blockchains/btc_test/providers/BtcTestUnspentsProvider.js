/**
 * @version 0.5
 *
 * https://testnet.smartbit.com.au/api
 * https://www.smartbit.com.au/api
 *
 * https://testnet-api.smartbit.com.au/v1/blockchain/address/mggtxjLhuWM8zWCxY7DXE3UWNXWdEjjs51/unspent?limit=100
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

export default class BtcTestUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://testnet-api.smartbit.com.au/v1'

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTestUnspentsProvider.getUnspents started', address)

        const link = `${this._apiPath}/blockchain/address/${address}/unspent?limit=100`
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTestUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (!res.data || typeof res.data.unspent === 'undefined' || !res.data.unspent) {
            return []
        }
        const sortedUnspents = []
        /**
         * https://testnet-api.smartbit.com.au/v1/blockchain/address/mggtxjLhuWM8zWCxY7DXE3UWNXWdEjjs51/unspent?limit=100
         * @param {*} res.data.unspent[]
         * @param {string} res.data.unspent[].addresses ["mggtxjLhuWM8zWCxY7DXE3UWNXWdEjjs51"]
         * @param {string} res.data.unspent[].value "0.00069355"
         * @param {string} res.data.unspent[].value_int 69355
         * @param {string} res.data.unspent[].txid "c47b8c3d6bafc76a54467e376c9cd38aaa227ff6b9ec2996a59f01ba3b03d6c4"
         * @param {string} res.data.unspent[].n 1
         * @param {string} res.data.unspent[].script_pub_key {"asm":"OP_DUP OP_HASH160 0cd980c5f9696a235f7b664a43cdf536c4e3ad30 OP_EQUALVERIFY OP_CHECKSIG","hex":"76a9140cd980c5f9696a235f7b664a43cdf536c4e3ad3088ac"}
         * @param {string} res.data.unspent[].req_sigs 1
         * @param {string} res.data.unspent[].type "pubkeyhash"
         * @param {string} res.data.unspent[].confirmations 6304
         * @param {string} res.data.unspent[].id 142654157
         */
        let unspent
        for (unspent of res.data.unspent) {
            sortedUnspents.push({
                address : address,
                isSegwit : false,
                txid: unspent.txid,
                vout: unspent.n,
                value: unspent.value_int.toString(),
                height: 0,
                confirmations : unspent.confirmations
            })
        }
        return sortedUnspents
    }
}
