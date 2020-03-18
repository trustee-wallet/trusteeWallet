/*
http://t.me/trusteeDevErrorsBot
953140729:AAFFnqXbtAU53TE0nyIKpfUoIPCOdIyDhxk
 */

import config from '../../app/config/config'
import changeableProd from '../../app/config/changeable.prod'

const MAX_LENGTH = 4090

const IN_TEST = (process && process.env && process.env.JEST_WORKER_ID)

const BAD_CHATS = {}

const axios = require('axios')

class BlocksoftTg {
    constructor(key) {
        if (typeof key !== 'undefined' && key) {
            this.API_KEY = key
        } else {
            this.API_KEY = config.tg.appDefaultTg
        }
        this.CHAT_IDS = []
        let chat
        for (chat of config.tg.trusteeCore) {
            this.CHAT_IDS.push(chat)
            BAD_CHATS[chat] = {}
        }
        for (chat of config.tg.trusteeTeam) {
            this.CHAT_IDS.push(chat)
            BAD_CHATS[chat] = {}
            BAD_CHATS[chat][changeableProd.tg.info.spamBot] = 1
        }
    }

    async send(text, API_KEY = false) {
        if (API_KEY === false) {
            API_KEY = this.API_KEY
        }
        if (IN_TEST) {
            return false
        }
        const promises = []
        if (text.length > MAX_LENGTH) {
            text = text.substring(0, MAX_LENGTH)
        }
        let chat
        for (chat of this.CHAT_IDS) {
            if (typeof BAD_CHATS[chat][API_KEY]  !== "undefined") continue
            promises.push(
                this._request('sendMessage', {
                    text: text,
                    chat_id: chat
                }, API_KEY)
            )
        }
        let result
        try {
            result = Promise.all(promises)
        } catch (err) {
            if (err.code.toString() === '429') {
                console.error(text)
                return true
            } else if (err.description === 'Bad Gateway') {
                return false
            } else {
                throw err
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
    async _request(method, qs, API_KEY = false) {
        if (API_KEY === false) {
            API_KEY = this.API_KEY
        }
        const link = `https://api.telegram.org/bot${API_KEY}/${method}`
        let response
        try {
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, qs)
        } catch (e) {
            if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            if (e.message.indexOf('Request: chat not found') !== -1) {
                if (typeof BAD_CHATS[qs.chat_id][API_KEY] === "undefined") {
                    BAD_CHATS[qs.chat_id][API_KEY] = 1
                } else {
                    BAD_CHATS[qs.chat_id][API_KEY]++
                }
            }
            e.message += ' ' + link + ' ' + JSON.stringify(qs)
            return false
        }
        return response.data
    }
}

export default BlocksoftTg
