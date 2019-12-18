import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

/**
 * https://testnet.smartbit.com.au/api
 * https://www.smartbit.com.au/api
 */

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
            case 'verge':
                this._isMainSkipped = true
                this._blockcypherApiPath = false
                this._customApiPath = `https://api.vergecurrency.network/node/api/XVG/mainnet/tx/send`
                this._customApiParam = 'rawTx'
                this._customApiResponse = 'txid'
                break
            case 'dogecoin':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/doge/main`
                this._customApiPath = `https://dogechain.info/api/v1/pushtx`
                this._customApiParam = 'tx'
                this._customApiResponse = 'tx_hash'
                break
            case 'litecoin':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._customApiPath = `https://litecoinblockexplorer.net/api/tx/send`
                this._customApiParam = 'rawtx'
                this._customApiResponse = 'txid'
                break
            case 'mainnet':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._customApiPath = `https://api.smartbit.com.au/v1/blockchain/pushtx/`
                this._customApiParam = 'hex'
                this._customApiResponse = 'txid'
                break
            case 'testnet':
                this._isMainSkipped = true
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._customApiPath = `https://testnet-api.smartbit.com.au/v1/blockchain/pushtx/`
                this._customApiParam = 'hex'
                this._customApiResponse = 'txid'
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }

    async _sendAlternative(rawTxHex, subtitle = '') {
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
            e = this._parseError(e)
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxSendProvider._sendAlternative ' + subtitle + ' ' + link + ' ' + e.basicMessage + ' ' + e.message)
            throw e
        }
        if (typeof response.data[this._customApiResponse] === 'undefined') {
            return response.data
        }
        return response.data[this._customApiResponse]
    }

    async _sendMain(rawTxHex, subtitle) {
        let link = `${this._blockcypherApiPath}/txs/push`
        let response
        try {
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, { tx: rawTxHex })
        } catch (e) {
            e = this._parseError(e)
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxSendProvider._sendMain ' + subtitle + ' ' + link + ' ' + e.basicMessage + ' ' + e.message)
            throw e
        }
        return response.data.tx.hash
    }

    _parseError(e) {
        e.basicMessage = ''
        if (e.response.data) {
            if (typeof e.response.data.error !== 'undefined') {
                e.message = JSON.stringify(e.response.data.error)
            } else {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
        }
        if (e.message.indexOf('dust') !== -1) { // usdt goes here
            let e2 = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST\'')
            e2.code = 'ERROR_USER'
            e2.basicMessage = e.message
            e2.couldResend = true
            return e2
        } else if (e.message.indexOf('fee for relay') !== -1) {
            let e2 = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            e2.code = 'ERROR_USER'
            e2.basicMessage = e.message
            return e2
        }
        return e
    }

    async send(rawTxHex, subtitle) {
        let res
        if (this._isMainSkipped) {
            res = await this._sendAlternative(rawTxHex, subtitle)
        } else {
            try {
                res = await this._sendMain(rawTxHex, subtitle)
            } catch (e) {
                if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                    throw e
                }
                res  = await this._sendAlternative(rawTxHex, subtitle)
            }
        }
        return res
    }
}

module.exports.init = function(settings) {
    return new BtcTxSendProvider(settings)
}
