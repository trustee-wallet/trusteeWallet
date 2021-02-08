import BlocksoftCryptoLog from './BlocksoftCryptoLog'

import axios from 'axios'
import config from '../../app/config/config'
import { showModal } from '../../app/appstores/Stores/Modal/ModalActions'
import { strings } from '../../app/services/i18n'

const CancelToken = axios && typeof axios.CancelToken !== 'undefined' ? axios.CancelToken : function () {}

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute
const CACHE_ERRORS_BY_LINKS = {}

const CACHE_STARTED = {}
const CACHE_STARTED_CANCEL = {}

let CACHE_TIMEOUT_ERRORS = 0
let CACHE_TIMEOUT_ERROR_SHOWN = 0
class BlocksoftAxios {

    /**
     * @param link
     * @param maxTry
     * @returns {Promise<boolean|{data:*}>}
     */
    async getWithoutBraking(link, maxTry = 5) {
        let tmp = false
        try {
            BlocksoftCryptoLog.log('BlocksoftAxios.getWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' start ' + link)
            tmp = await this.get(link, false, false)
            BlocksoftCryptoLog.log('BlocksoftAxios.getWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' success ' + link)
            CACHE_ERRORS_BY_LINKS[link] = { time: 0, tries: 0 }
        } catch (e) {
            const now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS[link] === 'undefined') {
                // first time
                CACHE_ERRORS_BY_LINKS[link] = { time: now, tries: 1 }
            } else if (
                now - CACHE_ERRORS_BY_LINKS[link].time < CACHE_ERRORS_VALID_TIME
            ) {
                // no plus as too fast
            } else if (
                CACHE_ERRORS_BY_LINKS[link].tries < maxTry
            ) {
                // plus as time passed
                CACHE_ERRORS_BY_LINKS[link].tries++
                CACHE_ERRORS_BY_LINKS[link].time = now
            } else {
                // only here will error actual
                e.code = 'ERROR_PROVIDER'
                CACHE_ERRORS_BY_LINKS[link].time = now
                throw e
            }
            BlocksoftCryptoLog.log('BlocksoftAxios.getWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' error ' + e.message.substr(0, 200))
        }

        return tmp
    }

    async postWithoutBraking(link, data, maxTry = 5) {
        let tmp = false
        try {
            BlocksoftCryptoLog.log('BlocksoftAxios.postWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' start ' + link)
            tmp = await this.post(link, data, false)
            BlocksoftCryptoLog.log('BlocksoftAxios.postWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' success ' + link)
            CACHE_ERRORS_BY_LINKS[link] = { time: 0, tries: 0 }
        } catch (e) {
            const now = new Date().getTime()
            if (typeof CACHE_ERRORS_BY_LINKS[link] === 'undefined') {
                // first time
                CACHE_ERRORS_BY_LINKS[link] = { time: now, tries: 1 }
            } else if (
                now - CACHE_ERRORS_BY_LINKS[link].time < CACHE_ERRORS_VALID_TIME
            ) {
                // no plus as too fast
            } else if (
                CACHE_ERRORS_BY_LINKS[link].tries < maxTry
            ) {
                // plus as time passed
                CACHE_ERRORS_BY_LINKS[link].tries++
                CACHE_ERRORS_BY_LINKS[link].time = now
            } else {
                // only here will error actual
                e.code = 'ERROR_PROVIDER'
                CACHE_ERRORS_BY_LINKS[link].time = now
                throw e
            }
            BlocksoftCryptoLog.log('BlocksoftAxios.postWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' error ' + e.message.substr(0, 200))
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
            const instance = axios.create()

            const cancelSource = CancelToken.source()
            let timeOut = config.request.timeout
            if (typeof CACHE_ERRORS_BY_LINKS[link] !== 'undefined') {
                if (CACHE_ERRORS_BY_LINKS[link].tries > 2) {
                    timeOut = Math.round(config.request.timeout / 10)
                } else {
                    timeOut = Math.round(config.request.timeout / 5)
                }
            }
            if (link.indexOf('/fees') !== -1 || link.indexOf('/rates') !== -1) {
                timeOut = Math.round(timeOut / 2)
            } else if (link.indexOf('proxy.trustee.deals') !== -1) {
                timeOut = Math.round(timeOut / 3)
            }
            if (typeof CACHE_STARTED[link] !== 'undefined') {
                const now = new Date().getTime()
                const timeMsg = ' timeout ' + CACHE_STARTED[link].timeOut + ' started ' + CACHE_STARTED[link].time + ' diff ' + (now -  CACHE_STARTED[link].time)
                BlocksoftCryptoLog.log('PREV CALL WILL BE CANCELED ' + timeMsg)
                await CACHE_STARTED_CANCEL[link].cancel('PREV CALL CANCELED ' + timeMsg)
            }
            instance.defaults.timeout = timeOut
            instance.defaults.cancelToken = cancelSource.token
            CACHE_STARTED[link] = { time: new Date().getTime(), timeOut }
            CACHE_STARTED_CANCEL[link] = cancelSource
            await BlocksoftCryptoLog.log('STARTED ' + JSON.stringify(CACHE_STARTED))
            if (method === 'get') {
                tmp = await instance.get(link)
            } else {
                tmp = await instance.post(link, data)
            }
            if (emptyIsBad && (tmp.status !== 200 || !tmp.data)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('BlocksoftAxios.' + method + ' ' + link + ' status: ' + tmp.status + ' data: ' + tmp.data)
            }

            if (typeof CACHE_STARTED[link] !== 'undefined') {
                delete CACHE_STARTED[link]
                delete CACHE_STARTED_CANCEL[link]
                BlocksoftCryptoLog.log('FINISHED OK, LEFT ' + JSON.stringify(CACHE_STARTED))
            }
            /* let txt = tmp.data
            if (typeof txt === 'string') {
                const newTxt = txt.split('<body')
                if (newTxt.length > 1) {
                    txt = newTxt[1].substr(0, 600)
                }
            } else {
                txt = JSON.stringify(tmp.data).substr(0, 300)
            }
            if (txt.length > 100) {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' finish ' + link, txt) // separate line for txt
            } else {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' finish ' + link + ' ' + JSON.stringify(txt))
            }
             */

            CACHE_TIMEOUT_ERRORS = 0
        } catch (e) {

            if (typeof CACHE_STARTED[link] !== 'undefined') {
                delete CACHE_STARTED[link]
                BlocksoftCryptoLog.log('FINISHED BAD, LEFT', CACHE_STARTED)
            }
            let subdata = {}
            if (typeof e.response === 'undefined' || typeof e.response.data === 'undefined') {
                // do nothing
            } else if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
                subdata = e.response.data
            }

            const customError = new Error(link + ' ' + e.message.toLowerCase())
            customError.subdata = subdata

            if (config.debug.appErrors) {
                // console.log('BlocksoftAxios._request ' + link + ' data ' + JSON.stringify(data) , e)
            }

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
                || e.message.indexOf('status code 500') !== -1
            ) {
                if (link.indexOf('trustee.deals') !== -1) {
                    // noinspection ES6MissingAwait
                    BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' NOTICE INNER CONNECTION ' + e.message)
                } else {
                    if (e.message.indexOf('timeout') !== -1) {
                        CACHE_TIMEOUT_ERRORS++
                        let now = new Date().getTime()
                        if (CACHE_TIMEOUT_ERRORS > 10 && (now - CACHE_TIMEOUT_ERROR_SHOWN) > 60000) {
                            CACHE_TIMEOUT_ERROR_SHOWN = now
                            showModal({
                                type: 'INFO_MODAL',
                                icon: null,
                                title: strings('modal.exchange.sorry'),
                                description: strings('toast.badInternet'),
                            })
                        }
                    }
                    // noinspection ES6MissingAwait
                    BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' NOTICE OUTER CONNECTION ' + e.message)
                }
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('request failed with status code 525') !== -1
                || e.message.indexOf('api calls limits have been reached') !== -1
                || e.message.indexOf('loudflare') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' NOTICE TOO MUCH ' + e.message)
                customError.code = 'ERROR_NOTICE'
            } else if (link.indexOf('/api/v2/sendtx/') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message + ' GET EXTERNAL LINK ERROR1 ')
                customError.code = 'ERROR_NOTICE'
            } else if (e.message.indexOf('account not found') !== -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message) // just nothing found
                return false
            } else if (errSend) {
                // noinspection ES6MissingAwait
                if (e.message.indexOf('PREV CALL CANCELED') === -1) {
                    if (link.indexOf('trustee.deals') !== -1) {
                        BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message + ' GET EXTERNAL LINK ERROR3 ' + JSON.stringify(data))
                    } else {
                        BlocksoftCryptoLog.err('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message + ' GET EXTERNAL LINK ERROR2')
                    }
                } else {
                    BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message + ' GET EXTERNAL LINK ERROR4')
                }
                customError.code = 'ERROR_SYSTEM'
            } else {
                BlocksoftCryptoLog.log('BlocksoftAxios.' + method + ' ' + link + ' ' + e.message + ' GET EXTERNAL LINK NOTICE')
                customError.code = 'ERROR_SYSTEM'
            }

            throw customError
        }
        return tmp
    }
}

export default new BlocksoftAxios()
