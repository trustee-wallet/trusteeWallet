/**
 * @version 0.5
 *
 * https://www.bitindex.network/docs.html
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class BsvSendProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://api.bitindex.network/api/v2/tx/send'

    /**
     * @param {*} settings
     */
    constructor(settings) {
        this._settings = settings
    }

    /**
     * @param {string} hex
     * @param {string} subtitle
     * @returns {Promise<string>}
     */
    async sendTx(hex, subtitle) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        let res
        try {
            res = await BlocksoftAxios.post(this._apiPath, { hex: hex })
        } catch (e) {
            if (e.message.indexOf('transaction already in the mempool') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        let txid = false
        if (typeof res.data === 'undefined' || !res.data) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (typeof res.data !== 'undefined' && typeof res.data.txid !== 'undefined') {
            txid = res.data.txid
        }
        if (typeof res.data.data !== 'undefined' && typeof res.data.data.txid !== 'undefined') {
            txid = res.data.data.txid
        }
        if (!txid) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return txid
    }
}

