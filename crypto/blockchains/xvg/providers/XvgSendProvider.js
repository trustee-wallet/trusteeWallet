/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class XvgSendProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://api.vergecurrency.network/node/api/XVG/mainnet/tx/send'

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        let res
        try {
            res = await BlocksoftAxios.post(this._apiPath, {rawTx : hex})
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        if (typeof res.data.txid === 'undefined' || !res.data.txid) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return res.data.txid
    }
}

