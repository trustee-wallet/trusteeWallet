import { Platform } from 'react-native'
import firebase from 'react-native-firebase'

import { AppNewsItem } from '../../appstores/Stores/AppNews/Types'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import AppNotificationDispatcher from './AppNotificationDispatcher'
import Log from '../Log/Log'
import { LocalNotification } from './Types'

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
        if (!this.appNotificationProcessor || !this.appNotificationPrepare.notificationNeedPopup || !this.appNotificationProcessor.canBeShowed()) {
            return
        }

        try {
            let localNotification = new firebase.notifications.Notification()
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
            await firebase.notifications().displayNotification(localNotification)
            await appNewsDS.setNewsNeedPopup(this.appNews.id, 0)
        } catch (e) {
            Log.err('AppNotification.displayLocalNotification error ' + e.message)
        }
    }
}
