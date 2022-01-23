/**
 * @version 0.30
 **/
import { Platform } from 'react-native'
import { sublocale } from '../i18n'
import Log from '../Log/Log'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

export default new class AppNotificationPushSave {

    async unifyPushAndSave(message: any) {
        // @todo save to database from push

        await Log.log('unifyPushAndSave message', message)

        let newsGroup = 'PUSH'
        let newsCustomTitle = ''
        let newsCustomText = ''
        let newsUrl = ''
        let newsJson = {}

        if (typeof message.title !== 'undefined' && message.title) {
            newsCustomTitle = message.title
        }
        if (typeof message.message !== 'undefined' && message.message) {
            newsCustomText = message.message
        }
        if (Platform.OS === 'android') {
            if (typeof message.notification !== 'undefined') {
                if (typeof message.notification.title !== 'undefined') {
                    newsCustomTitle = message.notification.title
                }
                if (typeof message.notification.body !== 'undefined') {
                    newsCustomText = message.notification.body
                }
            } else {
                return false
            }
        }
        if (typeof message.data !== 'undefined') {
            if (typeof message.data.news !== 'undefined') {
                // already from DB!
                return message.data.news
            }
            if (typeof message.data.notification !== 'undefined') {
                const locale = sublocale()
                newsJson = message.data.notification
                if (typeof newsJson !== 'object') {
                    try {
                        newsJson = JSON.parse(newsJson)
                    } catch (e) {
                        newsJson = {}
                    }
                }
                let tmp = newsJson
                if (typeof newsJson[locale] !== 'undefined') {
                    tmp = tmp[locale]
                }
                if (typeof tmp.title !== 'undefined') {
                    newsCustomTitle = tmp.title
                }
                if (typeof tmp.description !== 'undefined') {
                    newsCustomText = tmp.description
                }
                if (typeof tmp.url !== 'undefined') {
                    newsUrl = tmp.url
                }
            }
            if (typeof message.type !== 'undefined' && message.type) {
                newsGroup = message.type
            }
        }

        const walletHash = await settingsActions.getSelectedWallet('unifyPushAndSave')
        const result = {
            newsSource: 'PUSHES',
            newsGroup,
            newsCustomTitle,
            newsCustomText,
            newsUrl,
            newsNeedPopup: 0,
            newsServerId:  message.messageId || 0,
            newsJson,

            newsCreated : new Date().getTime(),
            newsOpenedAt : null,
            walletHash ,
            id : 0
        }
        await Log.log('unifyPushAndSave result', result)
        return result
    }
}
