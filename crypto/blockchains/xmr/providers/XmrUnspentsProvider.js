/**
 * @version 0.11
 */
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import config from '@app/config/config'


const PROXY_RANDOM = 'https://proxy.trustee.deals/xmr/getRandom'
const PROXY_UNSPENTS = 'https://proxy.trustee.deals/xmr/getUnspents'
export default class XmrUnspentsProvider {

    constructor(settings) {
        this._settings = settings
        this._link = false
        this._cache = {}
    }

    init() {
        if (this._link) return false
        this._serverUrl = settingsActions.getSettingStatic('xmrServer')
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
        this._cache = {}
    }

    async _getUnspents(params) {
        try {
            const key = JSON.stringify(params)
            let res = {}
            if (typeof this._cache[key] === 'undefined') {
                BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getUnspents', key)
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
                try {
                    res = await BlocksoftAxios.post(this._link + 'get_unspent_outs', params)
                    await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getUnspents res ' + JSON.stringify(res.data).substr(0, 200))
                } catch (e) {
                    await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getUnspents ' + this._link + 'get_unspent_outs error ' + e.message)
                }


                if (!res || typeof res.data === 'undefined' || !typeof res.data) {
                    if (config.debug.cryptoErrors) {
                        console.log('XmrUnspentsProvider Xmr._getUnspents load ' + PROXY_UNSPENTS + ' params ' + JSON.stringify(params))
                    }
                    try {
                        res = await BlocksoftAxios.post(PROXY_UNSPENTS, params)
                        await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getUnspents proxy res ' + JSON.stringify(res.data).substr(0, 200))
                    } catch (e) {
                        await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getUnspents proxy ' + PROXY_UNSPENTS + ' error ' + e.message)
                        throw e
                    }
                }
                this._cache[key] = res.data
            } else {
                res = { data: this._cache[key] }
            }
            return res?.data
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XmrUnspentsProvider Xmr._getUnspents error ' + e.message)
            }
            e.message += ' while Xmr._getUnspents'
            throw e
        }
    }

    async _getRandomOutputs(params, fn) {
        try {
            BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs params ' + JSON.stringify(params))
            if (typeof params.amounts === 'undefined' || !params.amounts || typeof params.amounts[0] === 'undefined' || !params.amounts[0]) {
                params.amounts = ["0"]
                BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs FIXED params ' + JSON.stringify(params))
            }


            /*
            const amounts = usingOuts.map(o => (o.rct ? '0' : o.amount.toString()))
            const linkParams = {
                amounts,
                count: (mixin * 1 + 1)
            }
            */

            if (config.debug.cryptoErrors) {
                console.log('XmrUnspentsProvider Xmr._getRandomOutputs load ' + this._link + 'get_random_outs params ' + JSON.stringify(params))
            }
            let res = false
            try {
                res = await BlocksoftAxios.post(this._link + 'get_random_outs', params)
                await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs res ' + JSON.stringify(res.data).substr(0, 200))
            } catch (e) {
                await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs ' + this._link + 'get_random_outs error ' + e.message)
            }

            if (!res || typeof res.data === 'undefined' || !typeof res.data || typeof res.data.amount_outs === 'undefined' || !res.data.amount_outs || res.data.amount_outs.length === 0) {
                if (config.debug.cryptoErrors) {
                    console.log('XmrUnspentsProvider Xmr._getRandomOutputs load ' + PROXY_RANDOM + ' params ' + JSON.stringify(params))
                }
                res = await BlocksoftAxios.post(PROXY_RANDOM, params)
                await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs proxy res ' + JSON.stringify(res.data).substr(0, 200))

                if (typeof res.data === 'undefined' || !typeof res.data || typeof res.data.amount_outs === 'undefined' || !res.data.amount_outs || res.data.amount_outs.length === 0) {
                    await BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs proxy res ' + JSON.stringify(res.data).substr(0, 200))
                    if (config.debug.cryptoErrors) {
                        console.log('XmrUnspentsProvider Xmr._getRandomOutputs proxy res no amount_outs', res.data)
                    }
                    BlocksoftCryptoLog.log('XmrUnspentsProvider Xmr._getRandomOutputs proxy res no amount_outs params ' + JSON.stringify(params), res.data)
                    throw new Error('SERVER_RESPONSE_NO_RESPONSE_XMR')
                }
            }

            if (typeof fn === 'undefined' || !fn) {
                return res.data
            } else {
                fn(null, res.data)
            }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE') === -1) {
                e.message += ' while Xmr._getRandomOutputs'
            }
            if (typeof fn === 'undefined' || !fn) {
                throw e
            } else {
                fn(e, null)
            }
        }
    }

}
