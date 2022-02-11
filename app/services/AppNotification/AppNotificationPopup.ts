/**
 * @version 0.30
 * https://rnfirebase.io/messaging/usage
 * has no more local pushes so////
 * https://github.com/zo0r/react-native-push-notification
 */
import { Platform } from 'react-native'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import PushNotification from 'react-native-push-notification'
import Log from '../Log/Log'
import NavStore from '../../components/navigation/NavStore'
import AppNotificationPushSave from './AppNotificationPushSave'
import { AppNewsActions } from '../../appstores/Stores/AppNews/AppNewsActions'
import MarketingEvent from '../Marketing/MarketingEvent'

export default new class AppNotificationPopup {

    async onOpened(message: any) {
        if (typeof message.foreground === 'undefined' || !message.foreground) {
            if (!MarketingEvent.UI_DATA.IS_LOCKED && !MarketingEvent.UI_DATA.IS_ACTIVE) {
                await Log.log('AppNotificationPopup.onOpened message is not foreground')
                return false
            } else {
                await Log.log('AppNotificationPopup.onOpened message is not foreground but locked')
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
            // console.log('AppNotificationPopup._display data', data)
            let { title, body, image, messageId, id } = data


            if (Platform.OS !== 'ios') {
                await Log.log('AppNotificationPopup._display channel creating ' + Platform.OS)
                await new Promise(resolve => {
                    PushNotification.createChannel(
                        {
                            channelId: 'trusteeWalletChannel',
                            channelName: 'Trustee wallet channel',
                            channelDescription: 'Trustee wallet channel for notifications',
                            playSound: false, // (optional) default: true
                            soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
                            importance: 4, // (optional) default: 4. Int value of the Android notification importance
                            vibrate: true // (optional) default: true. Creates the default vibration patten if true.
                        },
                        (created: any) => {
                            resolve(created)
                        }
                    )
                })
                await Log.log('AppNotificationPopup._display channel created')
            }

            const params = {
                channelId: 'trusteeWalletChannel',
                ticker: 'Trustee wallet channel', // (optional)
                // showWhen: true, // (optional) default: true
                // autoCancel: true, // (optional) default: true
                largeIcon: 'ic_launcher', // (optional) default: "ic_launcher". Use "" for no large icon.
                smallIcon: 'ic_notification', // (optional) default: "ic_notification" with fallback for "ic_launcher". Use "" for default small icon.
                bigLargeIcon: 'ic_launcher', // (optional) default: undefined
                color: '#f24b93', // (optional) default: system default
                vibrate: true, // (optional) default: true
                vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
                // tag: 'some_tag', // (optional) add tag to message
                // group: 'group', // (optional) add group to message
                // groupSummary: false, // (optional) set this notification to be the group summary for a group of notifications, default: false
                // ongoing: false, // (optional) set whether this is an "ongoing" notification
                priority: 'high', // (optional) set notification priority, default: high
                visibility: 'private', // (optional) set notification visibility, default: private
                ignoreInForeground: false, // (optional) if true, the notification will not be visible when the app is in the foreground (useful for parity with how iOS notifications appear). should be used in combine with `com.dieam.reactnativepushnotification.notification_foreground` setting
                shortcutId: 'shortcut-id', // (optional) If this notification is duplicative of a Launcher shortcut, sets the id of the shortcut, in case the Launcher wants to hide the shortcut, default undefined
                onlyAlertOnce: false, // (optional) alert will open only once with sound and notify, default: false
                // when: null, // (optionnal) Add a timestamp pertaining to the notification (usually the time the event occurred). For apps targeting Build.VERSION_CODES.N and above, this time is not shown anymore by default and must be opted into by using `showWhen`, default: null.
                // usesChronometer: false, // (optional) Show the `when` field as a stopwatch. Instead of presenting `when` as a timestamp, the notification will show an automatically updating display of the minutes and seconds since when. Useful when showing an elapsed time (like an ongoing phone call), default: false.
                // timeoutAfter: null, // (optional) Specifies a duration in milliseconds after which this notification should be canceled, if it is not already canceled, default: null
                // actions: ['Yes', 'No'], // (Android only) See the doc for notification actions to know more
                invokeApp: true, // (optional) This enable click on actions to bring back the application to foreground or stay in background, default: true
                /* iOS only properties */
                // category: '', // (optional) default: empty string
                /* iOS and Android properties */
                // id: 0, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
                // userInfo: {}, // (optional) default: {} (using null throws a JSON value '<null>' error)
                playSound: false, // (optional) default: true
                soundName: 'default' // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
                // number: 10, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
                // repeatType: 'day' // (optional) Repeating interval. Check 'Repeating Notifications' section for more info.
            }

            if (typeof data.data !== 'undefined' && data.data) {
                params.userInfo = data.data
            }
            if (typeof image !== 'undefined' && image && image !== '') {
                params.largeIconUrl = image // (optional) default: undefined
                params.bigPictureUrl = image // (optional) default: undefined
                params.bigLargeIconUrl = image // (optional) default: undefined
            }

            if (typeof body !== 'undefined' && body && body !== '') {
                params.bigText = body // (optional) default: "message" prop
                params.message = body // (required)
            }
            if (typeof title !== 'undefined' && title && title !== '') {
                params.subText = title // (optional) default: none
                params.title = title // (optional)
            }

            if (typeof id !== 'undefined' && id) {
                params.id = id // (optional) added as `message_id` to intent extras so opening push notification can find data stored by @react-native-firebase/messaging module.
            }
            if (messageId) {
                params.messageId = messageId // (optional) added as `message_id` to intent extras so opening push notification can find data stored by @react-native-firebase/messaging module.
            }

            await Log.log('AppNotificationPopup._display PushNotification.localNotification ', params)
            PushNotification.localNotification(params)
            await Log.log('AppNotificationPopup._display PushNotification.localNotification finished')
        } catch (e) {
            await Log.err('AppNotificationPopup._display error ' + e.message)
        }
    }
}
