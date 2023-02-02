/**
 * @version 0.77
 */
import config from '@app/config/config'
import Log from '@app/services/Log/Log'

const MAX_LENGTH = 4090

const IN_TEST = (process && process.env && process.env.JEST_WORKER_ID)

const BAD_CHATS = {}

const CACHE_ERROR_TIME = 60000
let CACHE_ERROR = 0

const axios = require('axios')

const CACHE_SAY_MY_NAME = { }
const CACHE_NAMES = {}

class BlocksoftTg {
    constructor(key, chat) {
        if (typeof key !== 'undefined' && key) {
            this.API_KEY = key
        } else {
            this.API_KEY = config.tg.appDefaultTg
        }
        if (typeof chat !== 'undefined' && chat) {
            this.CHAT = chat
        } else {
            this.CHAT = config.tg.trusteeCore
        }
    }

    async _getFilter(API_KEY, CHAT) {
        try {
            const data = await this._request('getChat', { chat_id: CHAT }, API_KEY)
            if (!data || typeof data.result === 'undefined' || !data.result || data.result === true) {
                return false
            }
            CACHE_NAMES[CHAT] = data.result
        } catch (e) {
            // do nothing
        }
        return false
    }

    async send(text, API_KEY = false, CHAT = false) {
        if (IN_TEST) {
            return false
        }
        if (API_KEY === false) {
            API_KEY = this.API_KEY
        }
        if (CHAT === false) {
            CHAT = this.CHAT
        }

        if (typeof CHAT === "object") {
            // array
        } else {
            CHAT = [ CHAT ]
        }

        let result
        for (const ID of CHAT) {
            if (typeof CACHE_SAY_MY_NAME[API_KEY + '_' + ID] === 'undefined') {
                await this._getFilter(API_KEY, ID)
            }
            if (typeof BAD_CHATS[ID] !== 'undefined' && typeof BAD_CHATS[ID][API_KEY] !== 'undefined') {
                return false
            }

            if (text.length > MAX_LENGTH) {
                text = text.substring(0, MAX_LENGTH)
            }
            try {
                result = await this._request('sendMessage', {
                    text: text,
                    chat_id: ID
                }, API_KEY)

                if (typeof CACHE_NAMES[ID] === 'undefined' || typeof CACHE_SAY_MY_NAME[API_KEY + '_' + ID] === 'undefined') {
                    await this._getFilter(API_KEY, ID)
                    Log.log('BlocksoftTg ID: ' + ID + ' NAME OK: ', CACHE_NAMES[ID])
                    CACHE_SAY_MY_NAME[API_KEY + '_' + ID] = 1
                }
            } catch (err) {
                if (typeof CACHE_NAMES[ID] === 'undefined' || typeof CACHE_SAY_MY_NAME[API_KEY + '_' + ID] === 'undefined') {
                    await this._getFilter(API_KEY, ID)
                    Log.log('BlocksoftTg ID: ' + ID + ' NAME BAD: ', CACHE_NAMES[ID])
                    CACHE_SAY_MY_NAME[API_KEY + '_' + ID] = 1
                }
                if (typeof err.code !== 'undefined' && err.code && err.code.toString() === '429') {
                    return true
                } else if (err.description === 'Bad Gateway') {
                    return false
                } else {
                    throw err
                }
            }
        }
        return result
    }

    /**
     * @param {string} method
     * @param {object} qs
     * @param {string} qs.text
     * @param {string} qs.chat_id
     * @param {string} API_KEY
     * @return {Promise<*>}
     * @private
     */
    async _request(method, qs, API_KEY) {
        const now = new Date().getTime()
        if (now -  CACHE_ERROR < CACHE_ERROR_TIME) {
            return true
        }
        const link = `https://api.telegram.org/bot${API_KEY}/${method}`
        let response
        try {
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, qs)
        } catch (e) {
            if (typeof e.response !== 'undefined' && typeof e.response.data !== 'undefined') {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            if (typeof e.message !== 'undefined' && e.message.indexOf('Request: chat not found') !== -1) {
                if (typeof BAD_CHATS[qs.chat_id] === 'undefined') {
                    BAD_CHATS[qs.chat_id] = {}
                    BAD_CHATS[qs.chat_id][API_KEY] = 1
                } else if (typeof BAD_CHATS[qs.chat_id][API_KEY] === 'undefined') {
                    BAD_CHATS[qs.chat_id][API_KEY] = 1
                } else {
                    BAD_CHATS[qs.chat_id][API_KEY]++
                }
            }
            e.message += ' ' + link + ' ' + JSON.stringify(qs)
            if (e.message.indexOf('Too Many Requests') !== -1) {
                CACHE_ERROR = now
            }
            return false
        }
        return response.data
    }
}

export default BlocksoftTg
