/**
 * @version 0.11
 */
import settingsActions from '../../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import MoneroUtilsParser from '../ext/MoneroUtilsParser'

import axios from 'axios'

export default class XmrUnspentsProvider {

    constructor(settings) {
        this._settings = settings
        this._link = false

    }

    async _init() {
        if (this._link) return false
        this._serverUrl = await settingsActions.getSetting('xmrServer')
        if (!this._serverUrl || this._serverUrl === 'false') {
            this._serverUrl = 'api.mymonero.com:8443'
        }

        let link = this._serverUrl.trim()
        if (link.substr(0, 4).toLowerCase() !== 'http') {
            link = 'https://' + this._serverUrl
        }
        if (link[link.length - 1] !== '/') {
            link = link + '/'
        }

        this._link = link
    }

    async _getUnspents(params, fn) {
        try {
            // console.log(' Xmr._getUnspents', params, fn)
            await this._init()
            /*
            const linkParams = {
                address: params.address,
                view_key: params.privViewKey,
                amount: params.amount.toString(),
                mixin: '10',
                use_dust: true,
                dust_threshold: '2000000000'
            }
            */

            const res = await axios.post(this._link + 'get_unspent_outs', params)
            const data = res.data
            if (typeof data.per_kb_fee === 'undefined') {
                data.per_kb_fee = data.per_byte_fee * 1024
            }
            fn(null, data)
        } catch (e) {
            e.message += ' while Xmr._getUnspents'
            fn(e, null)
        }
    }

    async _getRandomOutputs(params, fn) {
        try {
            // console.log(' Xmr._getRandomOutputs', params, fn)
            await this._init()

            /*
            const amounts = usingOuts.map(o => (o.rct ? '0' : o.amount.toString()))
            const linkParams = {
                amounts,
                count: (mixin * 1 + 1)
            }
            */
            const res = await axios.post(this._link + 'get_random_outs', params)
            fn(null, res.data)
        } catch (e) {
            e.message += ' while Xmr._getRandomOutputs'
            fn(e, null)
        }
    }

}
