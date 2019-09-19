import BlocksoftCryptoLog from './BlocksoftCryptoLog'

const axios = require('axios')

class BlocksoftAxios {
    async get(link, emptyIsBad = false) {
        let tmp
        try {
            // noinspection JSUnresolvedFunction
            tmp = await axios.get(link)
            if (emptyIsBad && (tmp.status !== 200 || !tmp.data)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('BlocksoftAxios.get ' + link + ' status: ' + tmp.status + ' data: ' + tmp.data)
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
                BlocksoftCryptoLog.log('BlocksoftAxios.get', link, txt) //separate line for txt
            } else {
                BlocksoftCryptoLog.log('BlocksoftAxios.get ' + link, txt)
            }

        } catch (e) {
            if (typeof (e.response) === 'undefined' || typeof (e.response.data) === 'undefined') {
                e.message += ' NO RESPONSE '
            } else if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            let customError = new Error(link + ' ' + e.message)
            if (e.message.indexOf('Network Error') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.get ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('Request failed with status code 525') !== -1 || e.message.indexOf('API calls limits have been reached') !== -1
                || e.message.indexOf('cloudflare.com') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.get ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err('BlocksoftAxios.get ' + link, e.message, 'GET EXTERNAL LINK ERROR')
                customError.code = 'ERROR_SYSTEM'
            }
            throw customError
        }
        return tmp
    }
}

export default new BlocksoftAxios()
