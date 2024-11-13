/**
 * @version 0.30
 * https://rnfirebase.io/messaging/usage
 * has no more local pushes so////
 * https://github.com/zo0r/react-native-push-notification
 */
import { Platform } from 'react-native'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import PushNotification from 'react-native-push-notification'
import notifee, { AndroidBadgeIconType } from '@notifee/react-native'
import Log from '../Log/Log'
import NavStore from '../../components/navigation/NavStore'
import AppNotificationPushSave from './AppNotificationPushSave'
import { AppNewsActions } from '../../appstores/Stores/AppNews/AppNewsActions'
import MarketingEvent from '../Marketing/MarketingEvent'

export default new class AppNotificationPopup {

    async onOpened(message: any) {
        if (message?.android) {
            if (typeof message?.android?.asForegroundService === 'undefined' || !message?.android?.asForegroundService) {
                if (!MarketingEvent.UI_DATA.IS_LOCKED && !MarketingEvent.UI_DATA.IS_ACTIVE) {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground')
                    return false
                } else {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground but locked')
                }    
            }
        } else if (message?.ios) {
            if (typeof message.ios?.foregroundPresentationOptions === 'undefined' || !message.ios?.foregroundPresentationOptions) {
                if (!MarketingEvent.UI_DATA.IS_LOCKED && !MarketingEvent.UI_DATA.IS_ACTIVE) {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground')
                    return false
                } else {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground but locked')
                }
            }
        } else {
            if (typeof message.foreground === 'undefined' || !message.foreground) {
                if (!MarketingEvent.UI_DATA.IS_LOCKED && !MarketingEvent.UI_DATA.IS_ACTIVE) {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground')
                    return false
                } else {
                    await Log.log('AppNotificationPopup.onOpened message is not foreground but locked')
                }
            }
        }
        try {
            await Log.log('AppNotificationPopup.onOpened message')
            const unifiedPush = await AppNotificationPushSave.unifyPushAndSave(message)
            if (unifiedPush && await AppNewsActions.onOpen(unifiedPush)) {
                NavStore.reset('TabBar', { screen: 'HomeScreen', params: { screen: 'NotificationsScreen', initial: false }})
            }
        } catch (e) {
            await Log.err('AppNotificationPopup.onOpened error ' + e.message)
        }
    }

    async displayBadge(number: number) {
        PushNotification.setApplicationIconBadgeNumber(number)
    }

    async displayPush(message: FirebaseMessagingTypes.RemoteMessage) {
        try {
            await Log.log('AppNotificationPopup.displayPush message', JSON.parse(JSON.stringify(message)))
            const title = message.notification?.title
            const body = message.notification?.body
            const image = message.notification?.android?.imageUrl
            const messageId = message.messageId
            const data = typeof message.data !== 'undefined' ? message.data : false
            await this._display({ title, body, image, messageId, data })
        } catch (e) {
            await Log.err('AppNotificationPopup.displayPush error ' + e.message)
        }
    }

    async displayPushFromNews(news: any) {
        try {
            await Log.log('AppNotificationPopup.displayPushFromNews news', news)
            const title = news.newsCustomTitle
            const body = news.newsCustomText
            const id = news.id
            const data = { news: news }
            await this._display({ title, body, id, data })
        } catch (e) {
            await Log.err('AppNotificationPopup.displayPushFromNews error ' + e.message)
        }
    }

    async _display(data: { title: any; body: any; image?: any; messageId?: any, id?: any, data?: any }) {
        try {
            await Log.log('AppNotificationPopup._display data', data)

            await Log.log('AppNotificationPopup._display channel creating ' + Platform.OS)
            const channelId = await notifee.createChannel({
                id: 'trusteeWalletChannel',
                name: 'Trustee wallet channel',
                description: 'Trustee wallet channel for notifications',
                badge: true,
                importance: 4, // (optional) default: 4. Int value of the Android notification importance
                vibration: true // (optional) default: true. Creates the default vibration patten if true.
            })
            await Log.log('AppNotificationPopup._display channel created')

            const params = {
                android: {
                    channelId, // Specifies the `AndroidChannel` which the notification will be delivered on.
                    smallIcon: 'ic_notification', // optional, defaults to 'ic_launcher'.
                    badgeIconType: AndroidBadgeIconType.LARGE,
                    pressAction: {
                        id: 'default'
                    }
                    // more params https://github.com/invertase/notifee/tree/main/docs-react-native/react-native/docs/android
                }
            }

            if (data?.title && data?.title !== '') {
                params.title = data.title // (optional)
            }
    
            if (data?.body && data?.body !== '') {
                params.body = data.body // (required)
            }
    
            if (data?.data) {
                const newData = {}
                const keys = Object.keys(data.data)
                keys.forEach((key) => {
                    if (key !== 'title' && key !== 'body') {
                        newData[key] = data.data[key]
                    }
                })
                params.data = newData
            }
    
            if (data?.id) {
                params.id = data.id // (optional) added as `message_id` to intent extras so opening push notification can find data stored by @react-native-firebase/messaging module.
            }
    
            if (data?.messageId) {
                params.messageId = data.messageId // (optional) added as `message_id` to intent extras so opening push notification can find data stored by @react-native-firebase/messaging module.
            }

            await Log.log('AppNotificationPopup._display PushNotification.localNotification ', params)
            notifee.displayNotification(params)
            await Log.log('AppNotificationPopup._display PushNotification.localNotification finished')
        } catch (e) {
            await Log.err('AppNotificationPopup._display error ' + e.message)
        }
    }
}
