/**
 * @version 0.11
 */
import settingsActions from '../../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const PROXY_SEND_TX = 'https://proxy.trustee.deals/xmr/sendTx'

export default class XmrSendProvider {

    constructor(settings) {
        this._settings = settings
        this._link = false

    }

    async _init() {
        this._serverUrl = settingsActions.getSettingStatic('xmrServerSend')
        let link = false
        if (!this._serverUrl || this._serverUrl === 'false' || this._serverUrl.indexOf('api.mymonero.com') !== -1) {
            const val = await settingsActions.getSetting('xmrAllowMyMonero')
            if (val !== '-1') {
                this._serverUrl = 'api.mymonero.com:8443'
            } else {
                this._serverUrl = false
            }
        }

        if (this._serverUrl) {
            link = this._serverUrl.trim()
            if (link.substr(0, 4).toLowerCase() !== 'http') {
                if (link.indexOf('mymonero.com') !== -1) {
                    link = 'https://' + this._serverUrl
                } else {
                    link = 'http://' + this._serverUrl
                }
            }
            if (link[link.length - 1] !== '/') {
                link = link + '/'
            }
        }
        this._link = link
    }

    async send(params) {
        await this._init()
        // curl http://127.0.0.1:18081/send_raw_transaction -d '{"tx_as_hex":"de6a3...", "do_not_relay":false}' -H 'Content-Type: application/json'
        // https://web.getmonero.org/resources/developer-guides/daemon-rpc.html#send_raw_transaction
        // const resNode = await BlocksoftAxios.post('http://node.moneroworld.com:18089/send_raw_transaction', {tx_as_hex : params.tx, do_not_relay : false})
        // return resNode.data

        if (this._link && this._link.indexOf('mymonero.com') !== -1) {
            try {
                const res = await BlocksoftAxios.post(this._link + 'submit_raw_tx', {
                    address: params.address,
                    view_key: params.privViewKey,
                    tx: params.tx
                })
                BlocksoftCryptoLog.log('XmrSendProvider mymonero.com node ' + this._link, res.data)
                return res.data
            } catch (e) {
                if (e.message.indexOf('double') !== -1) {
                    throw new Error('SERVER_RESPONSE_DOUBLE_SPEND')
                } else {
                    throw e
                }
            }
        } else if (this._link) {
            const resNode = await BlocksoftAxios.post(this._link + 'send_raw_transaction', {
                tx_as_hex: params.tx,
                do_not_relay: false
            })
            BlocksoftCryptoLog.log('XmrSendProvider custom node ' + this._link, resNode.data)
            if (typeof resNode.data.double_spend === 'undefined') {
                throw new Error('SERVER_RESPONSE_BAD_SEND_NODE')
            }
            if (resNode.data.double_spend) {
                throw new Error('SERVER_RESPONSE_DOUBLE_SPEND')
            }
            if (resNode.data.fee_too_low) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            }
            if (resNode.data.overspend) {
                throw new Error('SERVER_RESPONSE_TOO_BIG_FEE_FOR_TRANSACTION')
            }
            if (resNode.data.status === 'Failed') {
                throw new Error(JSON.stringify(resNode.data))
            }
            return resNode.data
        } else {
            try {
                const res = await BlocksoftAxios.post(PROXY_SEND_TX, {
                    address: params.address,
                    view_key: params.privViewKey,
                    tx: params.tx
                })
                console.log('XmrSendProvider proxy node ' + PROXY_SEND_TX, res.data)
                return res.data
            } catch (e) {
                if (e.message.indexOf('double') !== -1) {
                    throw new Error('SERVER_RESPONSE_DOUBLE_SPEND')
                } else {
                    throw e
                }
            }
        }
    }

}
