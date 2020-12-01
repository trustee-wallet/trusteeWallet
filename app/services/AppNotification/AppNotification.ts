import { Platform } from 'react-native'
import firebase from 'react-native-firebase'

import { AppNewsItem } from '../../appstores/Stores/AppNews/Types'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import AppNotificationDispatcher from './AppNotificationDispatcher'
import Log from '../Log/Log'
import { LocalNotification } from './Types'
import config from '../../config/config'

export default class AppNotification {

    private appNotificationProcessor: any
    private appNews: AppNewsItem
    private appNotificationPrepare: LocalNotification

    constructor(appNews: AppNewsItem) {
        this.appNotificationProcessor = new AppNotificationDispatcher(appNews).getNotificationProcessor()
        this.appNews = appNews
        this.appNotificationPrepare = this.appNotificationProcessor.prepareNotification(appNews)
    }

    displayPush = async (): Promise<void> => {
        if (!this.appNotificationProcessor || !this.appNotificationProcessor.canBeShowed()) {
            return
        }

        let localNotification = false
        try {

            localNotification = new firebase.notifications.Notification()
                .setNotificationId(this.appNotificationPrepare.notificationId)
                .setTitle(this.appNotificationPrepare.notificationTitle)
                .setSubtitle(this.appNotificationPrepare.notificationSubtitle)
                .setBody(this.appNotificationPrepare.notificationBody)
                .setData(this.appNotificationPrepare.notificationData)

            if(Platform.OS === 'android') {
                const channel = new firebase.notifications.Android.Channel(
                    'trusteeWalletChannel',
                    'Trustee wallet channel',
                    firebase.notifications.Android.Importance.Max
                ).setDescription('Trustee wallet channel for notifications')
                await firebase.notifications().android.createChannel(channel)

                localNotification = localNotification.android.setChannelId('trusteeWalletChannel')
                    .android.setSmallIcon('ic_notification')
                    .android.setColor('#f24b93')
                    .android.setPriority(firebase.notifications.Android.Priority.High)
            } else {
                const notificationBadge: number | undefined = typeof this.appNotificationPrepare.notificationIosBadge === 'undefined' ? 0 : this.appNotificationPrepare.notificationIosBadge
                localNotification = localNotification.ios.setBadge(notificationBadge)
            }

            this.appNotificationProcessor.incrementNotificationCounter()

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('PUSH displayLocalNotification prep error ' + e.message)
            }
            Log.err('PUSH displayLocalNotification prep error ' + e.message)
        }

        if (!localNotification) {
            return false
        }
        try {
            await firebase.notifications().displayNotification(localNotification)

            await appNewsDS.setNewsNeedPopup({id : this.appNews.id, newsNeedPopup: 0})
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('PUSH displayLocalNotification show error ' + e.message)
            }
            Log.err('PUSH displayLocalNotification show error ' + e.message)
        }
    }
}
