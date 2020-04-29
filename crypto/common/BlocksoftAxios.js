import BlocksoftCryptoLog from './BlocksoftCryptoLog'

import axios from 'axios'
import config from '../../app/config/config'

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute
const CACHE_ERRORS_BY_LINKS_TRY = {}
const CACHE_ERRORS_BY_LINKS_TIME = {}

const CACHE_STARTED = {}

class BlocksoftAxios {

    /**
     * @param link
     * @param maxTry
     * @returns {Promise<boolean|{data:*}>}
     */
    async getWithoutBraking(link, maxTry = 5) {
        let tmp
        try {
            tmp = await this.get(link, false, false)
            CACHE_ERRORS_BY_LINKS_TRY[link] = 0
            CACHE_ERRORS_BY_LINKS_TIME[link] = 0
        } catch (e) {
            const now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS_TRY[link] === 'undefined') {
                // first time
                CACHE_ERRORS_BY_LINKS_TRY[link] = 1
            } else if (
                now - CACHE_ERRORS_BY_LINKS_TIME[link] < CACHE_ERRORS_VALID_TIME
            ) {
                // no plus as too fast
            } else if (
                CACHE_ERRORS_BY_LINKS_TRY[link] < maxTry
            ) {
                // plus as time passed
                CACHE_ERRORS_BY_LINKS_TRY[link]++
            } else {
                // only here will error actual
                e.code = 'ERROR_PROVIDER'
                CACHE_ERRORS_BY_LINKS_TIME[link] = now
                throw e
            }
            CACHE_ERRORS_BY_LINKS_TIME[link] = now
            BlocksoftCryptoLog.log('BlocksoftAxios.getWithoutBraking try ' + CACHE_ERRORS_BY_LINKS_TRY[link] + ' ' + e.message.substr(0, 200))
        }
        return tmp
    }

    async postWithoutBraking(link, data, maxTry = 5) {
        let tmp
        try {
            tmp = await this.post(link, data, false)
            CACHE_ERRORS_BY_LINKS_TRY[link] = 0
            CACHE_ERRORS_BY_LINKS_TIME[link] = 0
        } catch (e) {
            const now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS_TRY[link] === 'undefined') {
                // first time
                CACHE_ERRORS_BY_LINKS_TRY[link] = 1
            } else if (
                now - CACHE_ERRORS_BY_LINKS_TIME[link] < CACHE_ERRORS_VALID_TIME
            ) {
                // no plus as too fast
            } else if (
                CACHE_ERRORS_BY_LINKS_TRY[link] < maxTry
            ) {
                // plus as time passed
                CACHE_ERRORS_BY_LINKS_TRY[link]++
            } else {
                // only here will error actual
                e.code = 'ERROR_PROVIDER'
                CACHE_ERRORS_BY_LINKS_TIME[link] = now
                throw e
            }
            CACHE_ERRORS_BY_LINKS_TIME[link] = now
            BlocksoftCryptoLog.log('BlocksoftAxios.postWithoutBraking try ' + CACHE_ERRORS_BY_LINKS_TRY[link] + ' ' + e.message.substr(0, 200))
        }
        return tmp
    }

    async post(link, data, errSend = true) {
        return this._request(link, 'post', data, false, errSend)
    }

    async get(link, emptyIsBad = false, errSend = true) {
        return this._request(link, 'get', {}, emptyIsBad, errSend)
    }

    async _request(link, method = 'get', data = {}, emptyIsBad = false, errSend = true) {
        let tmp
        try {
            // noinspection JSUnresolvedFunction
            CACHE_STARTED[link] = new Date().getTime()
            const instance = axios.create()
            instance.defaults.timeout = config.request.timeout
            BlocksoftCryptoLog.log('STARTED ' + JSON.stringify(CACHE_STARTED))
            if (method === 'get') {
                tmp = await instance.get(link)
            } else {
                tmp = await instance.post(link, data)
            }
            if (emptyIsBad && (tmp.status !== 200 || !tmp.data)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('BlocksoftAxios.' + method + ' ' + link + ' status: ' + tmp.status + ' data: ' + tmp.data)
            }
            let txt = tmp.data
            if (typeof txt === 'string') {
                const newTxt = txt.split('<body')
                if (newTxt.length > 1) {
                    txt = newTxt[1].substr(0, 600)
                }
            } else {
                txt = JSON.stringify(tmp.data).substr(0, 300)
            }
            if (typeof CACHE_STARTED[link] !== 'undefined') {
                delete CACHE_STARTED[link]
                BlocksoftCryptoLog.log('FINISHED OK, LEFT ' + JSON.stringify(CACHE_STARTED))
            }
            if (txt.length > 100) {
                BlocksoftCryptoLog.log(new Date().toISOString() + ' BlocksoftAxios.' + method + ' finish ' + link, txt) // separate line for txt
            } else {
                BlocksoftCryptoLog.log(new Date().toISOString() + ' BlocksoftAxios.' + method + ' finish ' + link + ' ' + JSON.stringify(txt))
            }

        } catch (e) {
            if (typeof CACHE_STARTED[link] !== 'undefined') {
                delete CACHE_STARTED[link]
                BlocksoftCryptoLog.log('FINISHED BAD, LEFT', CACHE_STARTED)
            }
            if (typeof e.response === 'undefined' || typeof e.response.data === 'undefined') {
                // do nothing
            } else if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            const customError = new Error(link + ' ' + e.message.toLowerCase())
            if (e.message.indexOf('Network Error') !== -1
                || e.message.indexOf('network error') !== -1
                || e.message.indexOf('timeout') !== -1
                || e.message.indexOf('access is denied') !== -1
                || e.message.indexOf('500 internal') !== -1
                || e.message.indexOf('502') !== -1
                || e.message.indexOf('bad gateway') !== -1
                || e.message.indexOf('503 backend') !== -1
                || e.message.indexOf('error 503') !== -1
                || e.message.indexOf('504 gateway') !== -1
                || e.message.indexOf('server error') !== -1
                || e.message.indexOf('forbidden') !== -1
                || e.message.indexOf('unavailable') !== -1
                || e.message.indexOf('rate limit') !== -1
                || e.message.indexOf('offline') !== -1
            ) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('request failed with status code 525') !== -1
                || e.message.indexOf('api calls limits have been reached') !== -1
                || e.message.indexOf('loudflare') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message)
                customError.code = 'ERROR_NOTICE'
            } else if (link.indexOf('/api/v2/sendtx/') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message, 'GET EXTERNAL LINK ERROR')
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('account not found') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message) // just nothing found
                return false
            } else if (errSend) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err('BlocksoftAxios.' + method + ' ' + link, e.message, 'GET EXTERNAL LINK ERROR')
                customError.code = 'ERROR_SYSTEM'
            } else {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link, e.message, 'GET EXTERNAL LINK NOTICE')
                customError.code = 'ERROR_SYSTEM'
            }

            throw customError
        }
        return tmp
    }
}

export default new BlocksoftAxios()
