/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class BchSendProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://rest.bitcoin.com/v2/rawtransactions/sendRawTransaction/'

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BchSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        let res
        try {
            res = await BlocksoftAxios.get(this._apiPath + hex)
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                let e2 = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
                e2.code = 'ERROR_USER'
                e2.basicMessage = e.message
                throw e2
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                let e2 = new Error('SERVER_RESPONSE_NO_RESPONSE')
                e2.code = 'ERROR_USER'
                e2.basicMessage = e.message
                throw e2
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                let e2 = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
                e2.code = 'ERROR_USER'
                e2.basicMessage = e.message
                throw e2
            } else {
                throw e
            }
        }
        if (typeof res.data === 'undefined' || !res.data) {
            let e = new Error('SERVER_RESPONSE_NOT_CONNECTED')
            e.code = 'ERROR_USER'
            throw e
        }
        return res.data
    }
}

