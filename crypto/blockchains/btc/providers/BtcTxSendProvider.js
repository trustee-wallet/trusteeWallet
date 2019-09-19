/**
 * https://testnet.smartbit.com.au/api
 * https://www.smartbit.com.au/api
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const axios = require('axios/index')

class BtcTxSendProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTxSendProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTxSendProvider requires settings.network')
        }
        switch (settings.network) {
            case 'litecoin':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._customApiPath = `https://litecoinblockexplorer.net/api/tx/send`
                this._customApiParam = 'rawtx'
                break
            case 'mainnet':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._customApiPath = `https://api.smartbit.com.au/v1//blockchain/pushtx/`
                this._customApiParam = 'hex'
                break
            case 'testnet':
                this._isMainSkipped = true
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._customApiPath = `https://testnet-api.smartbit.com.au/v1//blockchain/pushtx/`
                this._customApiParam = ' hex'
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }

    async _sendAlternative(rawTxHex, subtitle) {
        if (!this._customApiPath) {
            return -1
        }
        let link = this._customApiPath
        let response
        try {
            let params = {}
            params[this._customApiParam] = rawTxHex
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, params)
        } catch (e) {
            if (e.response.data) {
                if (typeof e.response.data.error !== 'undefined') {
                    e.message = JSON.stringify(e.response.data.error)
                    if (JSON.stringify(e.response.data.error).indexOf('dust') === -1) { // usdt goes here
                        e.code = 'ERROR_USER'
                    }
                } else {
                    e.message = JSON.stringify(e.response.data) + ' ' + e.message
                }
            }
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxSendProvider._sendAlternative ' + subtitle + ' ' + link, e)
            throw e
        }

        return response.data.txid
    }

    async _sendMain(rawTxHex, subtitle) {
        let link = `${this._blockcypherApiPath}/txs/push`
        let response
        try {
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, { tx: rawTxHex })
        } catch (e) {
            if (e.response.data) {
                if (typeof e.response.data.error !== 'undefined') {
                    e.message = e.response.data.error
                    if (e.response.data.error.indexOf('dust') === -1) { // usdt goes here
                        e.code = 'ERROR_USER'
                    }
                } else {
                    e.message = JSON.stringify(e.response.data) + ' ' + e.message
                }
            }
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxSendProvider._sendMain ' + subtitle + ' ' + link, e)
            throw e
        }
        return response.data.tx.hash
    }

    async send(rawTxHex, subtitle) {
        let getUtxs
        if (this._isMainSkipped) {
            try {
                getUtxs = await this._sendAlternative(rawTxHex, subtitle)
            } catch (e) {
                e.message = 'Alternative Provider ' + subtitle + ' ' + e.message
                throw e
            }
        } else {
            try {
                getUtxs = await this._sendMain(rawTxHex, subtitle)
            } catch (e) {
                if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                    e.message = 'Main Provider ' + subtitle + ' ' + e.message
                    throw e
                }
                try {
                    getUtxs = await this._sendAlternative(rawTxHex, subtitle)
                } catch (e) {
                    e.message = 'Alternative Provider ' + subtitle + ' ' + e.message
                    throw e
                }
            }
        }
        return getUtxs
    }
}

module.exports.init = function(settings) {
    return new BtcTxSendProvider(settings)
}
