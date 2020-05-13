import { Platform } from 'react-native'
import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'
import Log from '../Log/Log'
import { sublocale } from '../i18n'
import { NotificationJson } from './Types'
import { AppNewsItem } from '../../appstores/Stores/AppNews/Types'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import cryptoWalletActions from '../../appstores/Actions/CryptoWalletActions'
import AppNews from '../../appstores/DataSource/AppNews/AppNews'


export default new class AppNotificationListener {

    private notificationListener: any
    private notificationOpenedListener: any
    private messageListener: any

    async init(): Promise<void> {
        this.checkPermission()
        this.createNotificationListeners()
        this.createNotificationOpenedListener()
        this.createMessageListener()
        this.isAppOpenViaNotification()
    }

    async checkPermission(): Promise<void> {
        try {
            const enabled: boolean = await firebase.messaging().hasPermission()
            if (enabled) {
                this.getToken()
            } else {
                this.requestPermission()
            }
        } catch (e) {
            Log.errDaemon('AppNotificationListener checkPermission error ' + e.message)
        }
    }

    async getToken(): Promise<void> {
        let fcmToken: string | null = await AsyncStorage.getItem('fcmToken')
        if (!fcmToken) {
            fcmToken = await firebase.messaging().getToken()
            if (fcmToken) {
                await AsyncStorage.setItem('fcmToken', fcmToken)
            }
        }
    }

    async requestPermission(): Promise<void> {
        try {
            await firebase.messaging().requestPermission()
            this.getToken()
        } catch (e) {
            Log.errDaemon('AppNotificationListener requestPermission rejected error ' + e.message)
        }
    }

    createNotificationOpenedListener = async (): Promise<void> => {
        /*
        * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
        * */
        try {
            this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {

                let data
                let notificationId
                try {
                    if (typeof notificationOpen.notification._data.notification !== 'undefined') {
                        data = JSON.parse(notificationOpen.notification._data.notification)
                    } else {
                        data = notificationOpen.notification._data.notificationJson
                    }
                    notificationId = notificationOpen.notification._notificationId
                } catch (e) {
                    Log.err('AppNotification.createNotificationOpenedListener parse error ' + e.message, notificationOpen.notification._data)
                }

                try {
                    if (data.newsCreated !== 'undefined') {
                        this.showNewsModal(data, notificationId)
                    } else {
                        this.showNotificationModal(data, notificationId)
                    }
                } catch (e) {
                    Log.err('AppNotification.createNotificationOpenedListener show error ' + e.message, {
                        data,
                        notificationId
                    })
                }
            })
        } catch (e) {
            Log.log('AppNotification.createNotificationOpenedListener outside error ' + e.message)
        }
    }

    createMessageListener = async (): Promise<void> => {
        /*
        * Triggered for data only payload in foreground
        * */
        this.messageListener = firebase.messaging().onMessage((message) => {
            Log.log('AppNotification messageListener', message)
        })
    }

    isAppOpenViaNotification = async (): Promise<void> => {
        /*
        * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
        * */
        let data
        let notificationId
        let notificationOpen
        try {
            notificationOpen = await firebase.notifications().getInitialNotification()
        } catch (e) {
            Log.err('AppNotification.isAppOpenViaNotification init error ' + e.message)
        }

        if (!notificationOpen) {
            return ;
        }

        try {
            if (typeof notificationOpen.notification._data.notification !== 'undefined') {
                data = JSON.parse(notificationOpen.notification._data.notification)
            } else {
                data = notificationOpen.notification._data.notificationJson
            }
        } catch (e) {
            Log.err('AppNotification.isAppOpenViaNotification parse error ' + e.message)
        }

        try {
            if (data.newsCreated !== 'undefined') {
                this.showNewsModal(data, notificationId)
            } else {
                this.showNotificationModal(data, notificationId)
            }
        } catch (e) {
            Log.err('AppNotification.isAppOpenViaNotification show error ' + e.message, { data, notificationId })
        }
    }

    async createNotificationListeners(): Promise<void> {
        try {
            /*
            * Triggered when a particular notification has been received in foreground
            * */
            this.notificationListener = firebase.notifications().onNotification((notification) => {
                try {
                    Log.log('AppNotification got ', notification.data)

                    const channel = new firebase.notifications.Android.Channel(
                        'trusteeWalletChannel',
                        'Trustee wallet channel',
                        firebase.notifications.Android.Importance.Max
                    ).setDescription('Trustee wallet channel for notifications')
                    firebase.notifications().android.createChannel(channel)

                    if (Platform.OS === 'android') {

                        const notificationSubtitle: string | undefined = typeof notification.subtitle === 'undefined' ? '' : notification.subtitle

                        const localNotification = new firebase.notifications.Notification()
                            .setNotificationId(notification.notificationId)
                            .setTitle(notification.title)
                            .setSubtitle(notificationSubtitle)
                            .setBody(notification.body)
                            .setData(notification.data)
                            .android.setChannelId('trusteeWalletChannel') // e.g. the id you chose above
                            .android.setSmallIcon('ic_notification') // create this icon in Android Studio
                            .android.setColor('#f24b93') // you can set a color here
                            .android.setPriority(firebase.notifications.Android.Priority.High)

                        firebase.notifications()
                            .displayNotification(localNotification)
                            .catch(err => console.error(err))

                    } else if (Platform.OS === 'ios') {

                        const notificationSubtitle: string | undefined = typeof notification.subtitle === 'undefined' ? '' : notification.subtitle
                        const notificationBadge: number | undefined = typeof notification.ios.badge === 'undefined' ? 0 : notification.ios.badge

                        const localNotification = new firebase.notifications.Notification()
                            .setNotificationId(notification.notificationId)
                            .setTitle(notification.title)
                            .setSubtitle(notificationSubtitle)
                            .setBody(notification.body)
                            .setData(notification.data)
                            .ios.setBadge(notificationBadge)

                        firebase.notifications()
                            .displayNotification(localNotification)
                            .catch(err => console.error(err))
                    }
                } catch (e) {
                    Log.err('AppNotification.createNotificationListeners inside error ' + e.message)
                }
            })
        } catch (e) {
            Log.err('AppNotification.createNotificationListeners outside error ' + e.message)
        }
    }

    showNotificationModal = (data: NotificationJson, notificationId: string): void => {
        const locale: string = sublocale()

        showModal({
            type: 'CHOOSE_INFO_MODAL',
            data: {
                title: data[locale].title,
                description: data[locale].description,
                hideBottom: true,
                acceptCallback: async () => {
                    firebase.notifications().removeDeliveredNotification(notificationId)
                    hideModal()
                }
            }
        })
    }

    showNewsModal = async (data: AppNewsItem, notificationId: string): void => {
        await appNewsDS.shownPopup(data.id)
        firebase.notifications().removeDeliveredNotification(notificationId)

        const selectedWallet = await BlocksoftKeysStorage.getSelectedWallet()
        if (selectedWallet !== data.walletHash) {
            await cryptoWalletActions.setSelectedWallet(data.walletHash)
        }
    }
}
