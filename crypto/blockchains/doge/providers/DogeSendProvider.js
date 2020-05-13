/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

export default class DogeSendProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = ''

    /**
     * @private
     */
    _trezorServer = false

    /**
     * @param {*} settings
     * @param {string} serverCode
     */
    constructor(settings, serverCode) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    /**
     * @param {string} hex
     * @param {string} subtitle
     * @returns {Promise<string>}
     */
    async sendTx(hex, subtitle) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' started ' + subtitle)


        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'DOGE.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'
        let res
        try {
            res = await BlocksoftAxios.post(link, hex)
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return res.data.result

    }
}

