/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

let TREZOR_INDEX = 0

export default class BtcSendProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        if (!this._trezorServer) {
            this._trezorServer = await BlocksoftExternalSettings.get(this._trezorServerCode)
        }

        const link = this._trezorServer[TREZOR_INDEX] + '/api/v2/sendtx/'
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
                TREZOR_INDEX++
                if (TREZOR_INDEX >= this._trezorServer.length) {
                    TREZOR_INDEX = 0
                }
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            const e = new Error('SERVER_RESPONSE_NOT_CONNECTED')
            e.code = 'ERROR_USER'
            throw e
        }
        return res.data.result

    }
}

