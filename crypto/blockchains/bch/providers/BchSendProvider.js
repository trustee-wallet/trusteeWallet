/**
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import DogeSendProvider from '../../doge/providers/DogeSendProvider'

export default class BchSendProvider extends DogeSendProvider {
    /**
     * @type {string}
     * @private
     */
    _apiPath = 'https://rest.bitcoin.com/v2/rawtransactions/sendRawTransaction/'

    /**
     * @param {string} hex
     * @param {string} subtitle
     * @returns {Promise<string>}
     */
    async sendTx(hex, subtitle) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BchSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        try {
            const trezor = await super.sendTx(hex, subtitle)
            if (trezor) {
                return trezor
            }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                throw e
            } else {
                // do nothing
            }
        }

        let res
        try {
            res = await BlocksoftAxios.get(this._apiPath + hex)
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                return new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                return new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                return new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        if (typeof res.data === 'undefined' || !res.data) {
            return new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return res.data
    }
}

