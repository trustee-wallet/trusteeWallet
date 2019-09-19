const MAX_LENGTH = 4090

const axios = require('axios')

class BlocksoftTg {
    constructor() {
        this.API_KEY =  false // your bot key like 12345678900:123456
        this.CHAT_IDS = ['1234567'] // your chat ids
        this.BAD_CHATS = {}
    }

    async send(text) {
        if (!this.API_KEY) {
            console.log('')
            console.log('')
            console.log('!!!!!!!!!!!COULD BE SENT TO TG (plz specify API_KEY and CHAT_IDS at crypto/common/BlocksoftTg.js)!!!!!!!!!!!!!!!!!!')
            console.log('')
            console.log('')
            console.log(text)
            return true
        }
        let promises = []
        if (text.length > MAX_LENGTH) text = text.substring(0, MAX_LENGTH)
        for (let i = 0, ic = this.CHAT_IDS.length; i < ic; i++) {
            let chat = this.CHAT_IDS[i]
            if (this.BAD_CHATS[chat]) continue
            promises.push(
                this._request('sendMessage', {
                    text: text,
                    chat_id: chat
                })
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
     * @return {Promise<*>}
     * @private
     */
    async _request(method, qs) {
        let link = `https://api.telegram.org/bot${this.API_KEY}/${method}`
        let response
        try {
            // noinspection JSUnresolvedFunction
            response = await axios.post(link, qs)
        } catch (e) {
            if (e.response.data) {
                e.message = JSON.stringify(e.response.data) + ' ' + e.message
            }
            e.message += ' ' + link + ' ' + JSON.stringify(qs)
        }
        return response.data
    }
}

export default new BlocksoftTg()
