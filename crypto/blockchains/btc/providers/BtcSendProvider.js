/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import config from '../../../../app/config/config'

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
     * @type {text}
     */
    lastError = false

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
    async sendTx(hex, subtitle, preparedInputsOutputs, uiErrorConfirmed) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcSendProvider.sendTx ' + subtitle + ' started ' + subtitle)
        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'
        let res
        try {
            res = await BlocksoftAxios.post(link, hex)
        } catch (e) {
            this.lastError = e.message
            if (config.debug.cryptoErrors) {
                console.log('BTC Send error ' + e.message, JSON.parse(JSON.stringify(preparedInputsOutputs)))
            }
            if (this._settings.currencyCode === 'USDT' && e.message.indexOf('bad-txns-in-belowout') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient fee, rejecting replacement') !== -1) {
                if (this._settings.currencyCode !== 'BTC' || uiErrorConfirmed === 'UI_CONFIRM_CHANGE_AMOUNT_FOR_REPLACEMENT') {
                    throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
                } else {
                    throw new Error('UI_CONFIRM_CHANGE_AMOUNT_FOR_REPLACEMENT')
                }
            } else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            this.lastError = res.data
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return res.data.result

    }
}

