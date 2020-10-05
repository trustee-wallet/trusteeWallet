/**
 * @version 0.14
 * @author ksu
 */
import Log from '../../Log/Log'

const CLIENT_ID = '1000360526097-9o7p9b0j98tq2rvi0tv2e5n4rh80l95b.apps.googleusercontent.com'

const AUTH_LINK = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + CLIENT_ID + '&redirect_uri=https://trustee.deals'
    + '&access_type=offline&response_type=code&scope=https://www.googleapis.com/auth/drive'

const TOKEN_LINK = 'https://www.googleapis.com/oauth2/v4/token?client_id=' + CLIENT_ID + '&redirect_uri=https://trustee.deals'
    + '&client_secret=E5ZWzhs11fq_qqUQ9VDo2hGU&grant_type=authorization_code'

const USER = {
    accessToken: false,
    refreshToken: false,
    mnemonic: ''
}

class GoogleDrive {

    getLink() {
        return AUTH_LINK
    }

    async checkCode(url) {

        const code = url.split('code=')[1].split('&scope=')[0]
        const link = TOKEN_LINK + '&code=' + code

        const response = await fetch(link, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const data = await response.json()
        if (typeof data.access_token === 'undefined') {
            Log.log('GoogleDrive.checkCode response ' + url, data)
            throw new Error('GoogleDrive no data')
        }

        USER.accessToken = data.access_token
        USER.refreshToken = data.refresh_token

        return true
    }

    async getFiles(title = 'any') {
        // https://developers.google.com/drive/api/v3/reference/files/list
        let q = 'name%20%3D%20%27dont_remove_trustee_' + title + '%27'
        if (title === 'any') {
            q = 'name%20contains%20%27dont_remove_trustee%27'
        }
        const response = await fetch('https://www.googleapis.com/drive/v3/files?q=' + q, {
            method: 'GET',
            headers: {
                'authorization': 'Bearer ' + USER.accessToken
            }
        })
        const data = await response.json()

        if (typeof data.files === 'undefined') {
            Log.log('GoogleDrive.getFiles response', data)
            throw new Error('GoogleDrive no files')
        }

        if (!data.files || data.files.length === 0) {
            return false
        }

        return data.files
    }

    async saveMnemonic(title, mnemonic) {
        // https://developers.google.com/drive/api/v3/reference/files/create?

        const appProperties = {}
        const words = mnemonic.split(' ')
        let i = 0
        for (const word of words) {
            appProperties['w_' + i] = word
            i++
        }
        appProperties['words'] = i

        const response = await fetch('https://content.googleapis.com/drive/v3/files', {
            method: 'POST',
            body: JSON.stringify({
                appProperties, name: 'dont_remove_trustee_' + title, description: 'Dont remove / modify trustee encrypted backup', mimeType: 'text/plain'
            }),
            headers: {
                'authorization': 'Bearer ' + USER.accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        const data = await response.json()
        if (!data || typeof data.name === 'undefined') {
            Log.log('GoogleDrive.saveMnemonic response', data)
            throw new Error('GoogleDrive couldnt write')
        }
        return data
    }

    async getMnemonic(file) {
        const response = await fetch('https://content.googleapis.com/drive/v3/files/' + file.id + '?fields=*', {
            method: 'GET',
            headers: {
                'authorization': 'Bearer ' + USER.accessToken
            }
        })
        const data = await response.json()
        if (!data || typeof data.name === 'undefined' || typeof data.appProperties === 'undefined' || typeof data.appProperties.words === 'undefined') {
            Log.log('GoogleDrive.getMnemonic', data)
            throw new Error('GoogleDrive couldnt read')
        }
        USER.mnemonic = ''
        const words = data.appProperties.words * 1
        for (let i = 0; i < words; i++) {
            USER.mnemonic += ' ' + data.appProperties['w_' + i]
        }
        USER.mnemonic = USER.mnemonic.trim()
    }

    currentMnemonic() {
        return USER.mnemonic
    }
}

export default new GoogleDrive()
