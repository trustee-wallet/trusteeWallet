/**
 * @version 0.11
 */
import settingsActions from '../../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import MoneroUtilsParser from '../ext/MoneroUtilsParser'

import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

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
            BlocksoftCryptoLog.log(' Xmr._getUnspents', params)
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

            const res = await BlocksoftAxios.post(this._link + 'get_unspent_outs', params)
            if (typeof fn === 'undefined' || !fn) {
                return res.data
            } else {
                fn(null, res.data)
            }
        } catch (e) {
            e.message += ' while Xmr._getUnspents'
            fn(e, null)
            if (typeof fn === 'undefined' || !fn) {
                throw e
            } else {
                fn(e, null)
            }
        }
    }

    async _getRandomOutputs(params, fn) {
        try {
            BlocksoftCryptoLog.log(' Xmr._getRandomOutputs', params)
            await this._init()

            /*
            const amounts = usingOuts.map(o => (o.rct ? '0' : o.amount.toString()))
            const linkParams = {
                amounts,
                count: (mixin * 1 + 1)
            }
            */

            const res = await BlocksoftAxios.post(this._link + 'get_random_outs', params)
            if (typeof fn === 'undefined' || !fn) {
                return res.data
            } else {
                fn(null, res.data)
            }
        } catch (e) {
            e.message += ' while Xmr._getRandomOutputs'
            if (typeof fn === 'undefined' || !fn) {
                throw e
            } else {
                fn(e, null)
            }
        }
    }

}
