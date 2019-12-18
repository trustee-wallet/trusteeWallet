import BlocksoftCryptoLog from './BlocksoftCryptoLog'

const axios = require('axios')

class BlocksoftAxios {
    async post(link, data) {
        return this._request(link, 'post', data, false)
    }

    async get(link, emptyIsBad = false) {
        return this._request(link, 'get', {}, emptyIsBad)
    }

    async _request(link, method = 'get', data = {}, emptyIsBad = false) {
        let tmp
        try {
            // noinspection JSUnresolvedFunction
            if (method === 'get') {
                tmp = await axios.get(link)
            } else {
                tmp = await axios.post(link, data)
            }
            if (emptyIsBad && (tmp.status !== 200 || !tmp.data)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('BlocksoftAxios.' + method + ' ' + link + ' status: ' + tmp.status + ' data: ' + tmp.data)
            }
            let txt = tmp.data
            if (typeof txt === 'string') {
                let newTxt = txt.split('<body')
                if (newTxt.length > 1) {
                    txt = newTxt[1].substr(0, 600)
                }
            } else {
                txt = JSON.stringify(tmp.data).substr(0, 300)
            }
            if (txt.length > 100) {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method, link, txt) //separate line for txt
            } else {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, txt)
            }

        } catch (e) {
            if (typeof (e.response) === 'undefined' || typeof (e.response.data) === 'undefined') {
                // do nothing
            } else if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            let customError = new Error(link + ' ' + e.message)
            if (e.message.indexOf('Network Error') !== -1
                || e.message.indexOf('timeout of 0ms exceeded') !== -1
                || e.message.indexOf('Forbidden: Access is denied') !== -1
                || e.message.indexOf('500 Internal') !== -1
                || e.message.indexOf('504 Gateway') !== -1
            ) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('Request failed with status code 525') !== -1
                || e.message.indexOf('API calls limits have been reached') !== -1
                || e.message.indexOf('loudflare') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err('BlocksoftAxios.' + method + ' ' + link, e.message, 'GET EXTERNAL LINK ERROR')
                customError.code = 'ERROR_SYSTEM'
            }
            throw customError
        }
        return tmp
    }
}

export default new BlocksoftAxios()
