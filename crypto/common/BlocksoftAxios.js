/**
 * @version 0.43
 */
import BlocksoftCryptoLog from './BlocksoftCryptoLog'

import axios from 'axios'
import config from '@app/config/config'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

import { Platform } from 'react-native'
import CookieManager from '@react-native-cookies/cookies'

const CancelToken = axios && typeof axios.CancelToken !== 'undefined' ? axios.CancelToken : function() {}

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute
const CACHE_ERRORS_BY_LINKS = {}

const CACHE_STARTED = {}
const CACHE_STARTED_CANCEL = {}

let CACHE_TIMEOUT_ERRORS = 0
let CACHE_TIMEOUT_ERROR_SHOWN = 0

const TIMEOUT = 20000
const TIMEOUT_TRUSTEE = 7000
const TIMEOUT_TRIES_2 = 10000
const TIMEOUT_TRIES_10 = 15000
const TIMEOUT_TRIES_INTERNET = 5000
const TIMEOUT_TRIES_RATES = 20000

class BlocksoftAxios {

    /**
     * @param link
     * @param maxTry
     * @returns {Promise<boolean|{data:*}>}
     */
    async getWithoutBraking(link, maxTry = 5, timeOut = false) {
        let tmp = false
        try {
            tmp = await this.get(link, false, false, timeOut)
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
            BlocksoftCryptoLog.log('BlocksoftAxios.getWithoutBraking try ' + JSON.stringify(CACHE_ERRORS_BY_LINKS[link]) + ' error ' + e.message.substr(0, 300))
        }

        return tmp
    }

    async postWithoutBraking(link, data, maxTry = 5) {
        let tmp = false
        try {
            tmp = await this.post(link, data, false)
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

    async postWithHeaders(link, data, addHeaders, errSend = true, timeOut = false) {
        let tmp = false
        try {
            const headers = {
                'upgrade-insecure-requests': 1,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36'
            }
            const dataPrep = JSON.stringify(data)
            headers['Content-Type'] = 'application/json'
            headers['Accept'] = 'application/json'
            for (let key in addHeaders) {
                headers[key] = addHeaders[key]
            }

            const tmpInner = await fetch(link, {
                method: 'POST',
                credentials: 'same-origin',
                mode: 'same-origin',
                redirect: 'follow',
                headers,
                body: dataPrep
            })
            if (tmpInner.status !== 200 && tmpInner.status !== 201 && tmpInner.status !== 202) {
                BlocksoftCryptoLog.log('BlocksoftAxios.post fetch result ' + JSON.stringify(tmpInner))
            } else {
                tmp = { data: await tmpInner.json() }
            }
        } catch (e) {
            BlocksoftCryptoLog.log('BlocksoftAxios.postWithHeaders fetch result error ' + e.message)
        }
        return tmp
    }

    async getWithHeaders(link, addHeaders, errSend = true, timeOut = false) {
        let tmp = false
        try {
            const headers = {
                'upgrade-insecure-requests': 1,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36'
            }
            headers['Content-Type'] = 'application/json'
            headers['Accept'] = 'application/json'
            for (let key in addHeaders) {
                headers[key] = addHeaders[key]
            }

            const tmpInner = await fetch(link, {
                method: 'GET',
                credentials: 'same-origin',
                mode: 'same-origin',
                redirect: 'follow',
                headers
            })
            if (tmpInner.status !== 200 && tmpInner.status !== 201 && tmpInner.status !== 202) {
                BlocksoftCryptoLog.log('BlocksoftAxios.get fetch result ' + JSON.stringify(tmpInner))
            } else {
                tmp = { data: await tmpInner.json() }
            }
        } catch (e) {
            console.log('BlocksoftAxios.getWithHeaders fetch result error ' + e.message)
        }
        return tmp
    }

    async post(link, data, errSend = true, timeOut = false) {
        let tmp = false
        let doOld = this._isTrustee(link)
        if (!doOld) {
            try {
                await this._cookie(link, 'POST')
                let dataPrep
                const headers = {
                    'upgrade-insecure-requests': 1,
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36'
                }
                if (typeof data === 'object') {
                    dataPrep = JSON.stringify(data)
                    headers['Content-Type'] = 'application/json'
                    headers['Accept'] = 'application/json'
                } else {
                    dataPrep = data
                    headers['Content-Type'] = 'multipart/form-data'
                    headers['Accept'] = 'multipart/form-data'
                }

                const tmpInner = await fetch(link, {
                    method: 'POST',
                    credentials: 'same-origin',
                    mode: 'same-origin',
                    redirect: 'follow',
                    headers,
                    body: dataPrep
                })
                if (tmpInner.status !== 200 && tmpInner.status !== 201 && tmpInner.status !== 202) {
                    BlocksoftCryptoLog.log('BlocksoftAxios.post fetch result ' + JSON.stringify(tmpInner))
                    doOld = true
                } else {
                    tmp = { data: await tmpInner.json() }
                }
            } catch (e) {
                BlocksoftCryptoLog.log('BlocksoftAxios.post fetch result error ' + e.message)
                doOld = true
            }
        }
        if (doOld) {
            tmp = this._request(link, 'post', data, false, errSend, timeOut)
        }
        return tmp
    }

    async get(link, emptyIsBad = false, errSend = true, timeOut = false) {
        let tmp = false
        let doOld = this._isTrustee(link)
        if (!doOld) {
            try {
                await this._cookie(link, 'GET')
                let tryOneMore = false
                let antiCycle = 0
                do {
                    const tmpInner = await fetch(link, {
                        method: 'GET',
                        credentials: 'same-origin',
                        mode: 'same-origin',
                        redirect: 'follow',
                        headers: {
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36'
                        }
                    })
                    if (tmpInner.status !== 200) {
                        doOld = true
                        if (typeof tmpInner.headers.map['set-cookie'] !== 'undefined') {
                            tryOneMore = true
                        }
                    } else {
                        tmp = { data: await tmpInner.json() }
                        doOld = false
                        tryOneMore = false
                    }
                    antiCycle++
                } while (tryOneMore && antiCycle < 3)
            } catch (e) {
                BlocksoftCryptoLog.log('BlocksoftAxios.get fetch result error ' + e.message)
                doOld = true
            }
        }
        if (doOld) {
            tmp = this._request(link, 'get', {}, emptyIsBad, errSend, timeOut)
        }
        return tmp
    }

    _isTrustee(link) {
        const tmp = link.split('/')
        const domain = tmp[0] + '/' + tmp[1] + '/' + tmp[2]
        return !(domain.indexOf('trustee') === -1)
    }

    async _cookie(link, method) {
        const tmp = link.split('/')
        const domain = tmp[0] + '/' + tmp[1] + '/' + tmp[2]
        const domainShort = tmp[2]
        if (domain.indexOf('trustee') !== -1) {
            return false
        }
        const oldCookieObj = await CookieManager.get(link)
        const oldCookie = JSON.stringify(oldCookieObj)
        if (oldCookie === '{}') return false

        // await CookieManager.clearAll()
        if (Platform.OS === 'ios') {
            await CookieManager.clearByName(domain)
            await CookieManager.clearByName(link)
        } else {
            for (const key in oldCookieObj) {
                const newData = {
                    name: key,
                    value: 'none',
                    domain: '.' + domainShort,
                    path: '/',
                    version: '1',
                    expires: new Date(new Date().getTime() + 24 * 360000).toISOString()
                }
                await CookieManager.set(link, newData)
            }
        }
    }


    async _request(link, method = 'get', data = {}, emptyIsBad = false, errSend = true, timeOut = false) {
        let tmp
        let cacheMD = link
        if (typeof data !== 'undefined') {
            cacheMD += ' ' + JSON.stringify(data)
        }
        try {
            // noinspection JSUnresolvedFunction
            const instance = axios.create()

            const cancelSource = CancelToken.source()

            if (!timeOut || typeof timeOut === 'undefined') {
                timeOut = TIMEOUT
                if (this._isTrustee(link)) {
                    timeOut = TIMEOUT_TRUSTEE
                }
                if (typeof CACHE_ERRORS_BY_LINKS[link] !== 'undefined') {
                    if (CACHE_ERRORS_BY_LINKS[link].tries > 2) {
                        timeOut = Math.round(TIMEOUT_TRIES_10)
                    } else {
                        timeOut = Math.round(TIMEOUT_TRIES_2)
                    }
                }
                if (link.indexOf('/fees') !== -1 || link.indexOf('/rates') !== -1) {
                    timeOut = Math.round(TIMEOUT_TRIES_RATES)
                } else if (link.indexOf('/internet') !== -1) {
                    timeOut = Math.round(TIMEOUT_TRIES_INTERNET)
                }
                if (link.indexOf('solana.trusteeglobal.com') !== -1) {
                    timeOut = timeOut * 10
                }
            }

            if (typeof CACHE_STARTED[cacheMD] !== 'undefined') {
                const now = new Date().getTime()
                const timeMsg = ' timeout ' + CACHE_STARTED[cacheMD].timeOut + ' started ' + CACHE_STARTED[cacheMD].time + ' diff ' + (now - CACHE_STARTED[cacheMD].time)
                BlocksoftCryptoLog.log('PREV CALL WILL BE CANCELED ' + timeMsg)
                await CACHE_STARTED_CANCEL[cacheMD].cancel('PREV CALL CANCELED ' + timeMsg)
            }
            instance.defaults.timeout = timeOut
            instance.defaults.cancelToken = cancelSource.token
            CACHE_STARTED[cacheMD] = { time: new Date().getTime(), timeOut }
            CACHE_STARTED_CANCEL[cacheMD] = cancelSource

            const tmpTimer = setTimeout(() => {
                cancelSource.cancel('TIMEOUT CANCELED ' + timeOut + ' ' +  link + ' ' + JSON.stringify(data))
            }, timeOut)
            if (method === 'get') {
                tmp = await instance.get(link)
            } else {
                tmp = await instance.post(link, data)
            }
            clearTimeout(tmpTimer)

            if (emptyIsBad && (tmp.status !== 200 || !tmp.data)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('BlocksoftAxios.' + method + ' ' + link + ' status: ' + tmp.status + ' data: ' + tmp.data)
            }

            if (typeof CACHE_STARTED[cacheMD] !== 'undefined') {
                delete CACHE_STARTED[cacheMD]
                delete CACHE_STARTED_CANCEL[cacheMD]
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

            if (typeof CACHE_STARTED[cacheMD] !== 'undefined') {
                delete CACHE_STARTED[cacheMD]
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
                                description: strings('toast.badInternet')
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
                    if (link.indexOf('trustee.deals') !== -1 || link.indexOf('https://api.mainnet-beta.solana.com') !== -1) {
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
