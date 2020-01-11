/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class DogeSendProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorPath = ''

    /**
     * @param {*} settings
     * @param {string} serverPath
     */
    constructor(settings, serverPath = 'https://doge1.trezor.io') {
        this._settings = settings
        this._trezorPath = serverPath + '/api/v2/sendtx/'
    }

    /**
     * @param {string} hex
     * @param {string} subtitle
     * @returns {Promise<string>}
     */
    async sendTx(hex, subtitle) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        let link = this._trezorPath + hex
        let res
        try {
            res = await BlocksoftAxios.get(link)
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
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            let e = new Error('SERVER_RESPONSE_NOT_CONNECTED')
            e.code = 'ERROR_USER'
            throw e
        }
        return res.data.result

    }
}

