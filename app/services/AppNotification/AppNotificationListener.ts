import { Platform } from 'react-native'
import firebase, { RNFirebase } from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'
import Log from '../Log/Log'
import { sublocale } from '../i18n'
import { NotificationJson } from './Types'
import { AppNewsItem } from '../../appstores/Stores/AppNews/Types'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import cryptoWalletActions from '../../appstores/Actions/CryptoWalletActions'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'


const ASYNC_CACHE_TITLE = 'pushToken'
const ASYNC_CACHE_TIME = 'pushTokenTime'
const ASYNC_ALL_CACHE = 'allPushTokens'
const CACHE_VALID_TIME = 120000000 // 2000 minute

export default new class AppNotificationListener {

    private notificationListener: any
    private notificationOpenedListener: any
    private messageListener: any

    async init(): Promise<void> {
        if (await this.checkPermission()) {
            await this.createRefreshListener()
            await this.createNotificationListeners()
            await this.createNotificationOpenedListener()
            await this.createMessageListener()
            await this.isAppOpenViaNotification()
        }
    }

    async checkPermission(): Promise<boolean> {
        let res = false
        try {
            const enabled: boolean = await firebase.messaging().hasPermission()
            if (enabled) {
                await this.getToken()
                res = true
            } else {
                res = await this.requestPermission()
            }
        } catch (e) {
            Log.log('PUSH checkPermission error ' + e.message)
        }
        Log.log('PUSH checkPermission result ', res)
        if (res) {
            await appNewsDS.setRemoved({ newsName: 'PUSH_NOTIFICATION_DISABLED' })
        } else {
            await appNewsDS.saveAppNews({
                onlyOne: true,
                newsGroup: 'PUSHES',
                newsName: 'PUSH_NOTIFICATION_DISABLED',
                newsJson: {}
            })
        }
        return res
    }

    async getToken(): Promise<void> {
        let fcmToken: string | null = await AsyncStorage.getItem(ASYNC_CACHE_TITLE)
        // @ts-ignore
        let time: number = 1 * (await AsyncStorage.getItem(ASYNC_CACHE_TIME))

        const now = new Date().getTime()
        if (time && fcmToken) {
            if (now - time > CACHE_VALID_TIME) {
                time = 0
                fcmToken = ''
                Log.log('PUSH getToken cache invalidate ' + (now - time) + ' time ' + time)
            } else {
                Log.log('PUSH getToken cache valid ' + (now - time) + ' time ' + time)
            }
        }

        if (!time || !fcmToken) {
            await firebase.messaging().subscribeToTopic('trustee_all')
            fcmToken = await firebase.messaging().getToken()
            Log.log('PUSH getToken subscribed token ' + fcmToken)
            await this._onRefresh(fcmToken)
            await AsyncStorage.setItem(ASYNC_CACHE_TIME, now + '')
        } else {
            Log.log('PUSH getToken cache result ' + fcmToken)
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            await firebase.messaging().requestPermission()
            this.getToken()
            return true
        } catch (e) {
            Log.log('PUSH requestPermission rejected error ' + e.message)
            return false
        }
    }

    createNotificationOpenedListener = async (): Promise<void> => {
        /*
        * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
        * */
        Log.log('PUSH _onNotificationOpen inited')
        try {
            this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
                Log.log('PUSH _onNotificationOpen', notificationOpen)
                let data
                let notificationId
                try {
                    // @ts-ignore
                    if (typeof notificationOpen.notification._data.notification !== 'undefined') {
                        // @ts-ignore
                        data = JSON.parse(notificationOpen.notification._data.notification)
                    } else {
                        // @ts-ignore
                        data = notificationOpen.notification._data.notificationJson
                    }
                    // @ts-ignore
                    notificationId = notificationOpen.notification._notificationId
                } catch (e) {
                    // @ts-ignore
                    Log.err('PUSH AppNotification.createNotificationOpenedListener parse error ' + e.message, notificationOpen.notification._data)
                }

                try {
                    if (data.newsCreated !== 'undefined') {
                        this.showNewsModal(data, notificationId)
                    } else {
                        this.showNotificationModal(data, notificationId)
                    }
                } catch (e) {
                    Log.err('PUSH AppNotification.createNotificationOpenedListener show error ' + e.message, {
                        data,
                        notificationId
                    })
                }
            })
        } catch (e) {
            Log.log('PUSH AppNotification.createNotificationOpenedListener outside error ' + e.message)
        }
    }

    createMessageListener = async (): Promise<void> => {
        /*
        * Triggered for data only payload in foreground
        * */
        Log.log('PUSH _onMessage inited')
        this.messageListener = firebase.messaging().onMessage((message) => {
            Log.log('PUSH _onMessage', message)
        })
    }

    _onRefresh = async (fcmToken: string): Promise<void> => {
        if (!fcmToken) return
        await AsyncStorage.setItem(ASYNC_CACHE_TITLE, fcmToken)
        let tmp = await AsyncStorage.getItem(ASYNC_ALL_CACHE)
        let all = {}
        try {
            if (tmp != null) {
                tmp = JSON.parse(tmp)
            }
            if (tmp) all = tmp
        } catch (e) {

        }
        // @ts-ignore
        all[fcmToken] = '1'
        Log.log('PUSH _onRefreshAll ', all)
        await AsyncStorage.setItem(ASYNC_ALL_CACHE, JSON.stringify(all))
    }


    createRefreshListener = async (): Promise<void> => {
        /*
        * Triggered for data only payload in foreground
        * */
        Log.log('PUSH _onRefresh inited')
        this.messageListener = firebase.messaging().onTokenRefresh((fcmToken) => {
            Log.log('PUSH _onRefresh', fcmToken)
            this._onRefresh(fcmToken)

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
            Log.log('PUSH _isAppOpenViaNotification notificationOpen ', notificationOpen)
        } catch (e) {
            Log.log('PUSH _isAppOpenViaNotification init error ' + e.message)
        }

        if (!notificationOpen) {
            return
        }

        try {
            // @ts-ignore
            if (typeof notificationOpen.notification._data.notification !== 'undefined') {
                // @ts-ignore
                data = JSON.parse(notificationOpen.notification._data.notification)
            } else {
                // @ts-ignore
                data = notificationOpen.notification._data.notificationJson
            }
        } catch (e) {
            Log.log('PUSH _isAppOpenViaNotification parse error ' + e.message)
        }

        try {
            if (data.newsCreated !== 'undefined') {
                // @ts-ignore
                this.showNewsModal(data, notificationId)
            } else {
                // @ts-ignore
                this.showNotificationModal(data, notificationId)
            }
        } catch (e) {
            Log.log('PUSH _isAppOpenViaNotification show error ' + e.message, { data, notificationId })
        }
    }

    async _onNotification(notification: RNFirebase.notifications.Notification): Promise<void> {

        console.log('n', notification)
        const toSave = {
            newsSource: 'PUSHES',
            newsGroup: 'PUSHES',
            newsName: 'PUSH_NOTIFICATION',
            newsCustomTitle: notification.title,
            newsCustomText: notification.body,
            newsNeedPopup: 0,
            newsServerId: notification.notificationId,
            newsJson: false
        }
        const locale: string = sublocale()
        if (notification._data) {
            let tmp = false
            if (typeof notification._data !== 'object') {
                try {
                    tmp = JSON.parse(notification._data)
                } catch (e) {
                    Log.log('PUSH _onNotification notification._data not JSON ' + e.message, notification._data)
                }
            } else {
                tmp = notification._data
            }
            if (tmp) {
                toSave.newsJson = tmp
            }
        }
        if (notification.data) {
            let tmp = false
            if (typeof notification.data !== 'object') {
                try {
                    tmp = JSON.parse(notification.data)
                } catch (e) {
                    Log.log('PUSH _onNotification notification.data not JSON ' + e.message, notification.data)
                }
            } else {
                tmp = notification.data
            }
            if (tmp) {
                // @ts-ignore
                toSave.newsJson = { ...tmp, ...toSave.newsJson }
            }
        }

        let needReload = false
        if (toSave.newsJson) {
            if (typeof toSave.newsJson.notification !== 'undefined') {
                let tmp = false
                try {
                    tmp = JSON.parse(toSave.newsJson.notification)
                } catch (e) {
                    // do nothing
                }
                if (tmp) {
                    toSave.newsJson.notification = tmp
                }
            }

            let lang = toSave.newsJson
            if (typeof toSave.newsJson['en'] !== 'undefined') {
                if (toSave.newsJson['en'].title === 'Exchange') {
                    needReload = true
                }
            }

            if (typeof toSave.newsJson.notification !== 'undefined' && typeof toSave.newsJson.notification['en'] !== 'undefined') {
                lang = toSave.newsJson.notification
                if (toSave.newsJson.notification['en'].title === 'Exchange') {
                    needReload = true
                }
            }

            if (typeof lang[locale] !== 'undefined') {
                if (typeof lang[locale].title !== 'undefined' && lang[locale].title) {
                    toSave.newsCustomTitle = lang[locale].title
                }
                if (typeof lang[locale].description !== 'undefined' && lang[locale].description) {
                    toSave.newsCustomText = lang[locale].description
                }
            }
        }
        Log.log('PUSH _onNotification got toSave', toSave)
        await appNewsDS.saveAppNews(toSave)

        const notificationSubtitle: string | undefined = typeof notification.subtitle === 'undefined' ? '' : notification.subtitle

        let localNotification = new firebase.notifications.Notification()
            .setNotificationId(notification.notificationId)
            .setTitle(notification.title)
            .setSubtitle(notificationSubtitle)
            .setBody(notification.body)
            .setData(notification.data)

        if (Platform.OS === 'android') {

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

        } else if (Platform.OS === 'ios') {

            const notificationBadge: number | undefined = typeof notification.ios.badge === 'undefined' ? 0 : notification.ios.badge

            localNotification = localNotification.ios.setBadge(notificationBadge)
        }

        try {
            await firebase.notifications().displayNotification(localNotification)
        } catch (e) {
            Log.err('PUSH AppNotification _onNotification error ' + e.message)
        }

        if (needReload) {
            try {
                await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true })
            } catch (e) {
                Log.err('PUSH AppNotification _onNotification reload Orders error ' + e.message)
            }
        }
    }

    async createNotificationListeners(): Promise<void> {
        try {
            /*
            * Triggered when a particular notification has been received in foreground
            * */
            this.notificationListener = firebase.notifications().onNotification(async (notification) => {
                try {
                    await this._onNotification(notification)
                } catch (e) {
                    Log.err('PUSH _onNotification inside error ' + e.message)
                }
            })
        } catch (e) {
            Log.err('PUSH _onNotification outside error ' + e.message)
        }
    }

    showNotificationModal = (data: NotificationJson, notificationId: string): void => {
        const locale: string = sublocale()
        showModal({
            type: 'CHOOSE_INFO_MODAL',
            data: {
                // @ts-ignore
                title: data[locale].title,
                // @ts-ignore
                description: data[locale].description,
                hideBottom: true,
                acceptCallback: async () => {
                    if (notificationId) {
                        firebase.notifications().removeDeliveredNotification(notificationId)
                    }
                    if (typeof data.walletHash !== 'undefined' && data.walletHash) {
                        const selectedWallet = await BlocksoftKeysStorage.getSelectedWallet()
                        if (selectedWallet !== data.walletHash) {
                            await cryptoWalletActions.setSelectedWallet(data.walletHash, 'showNewsModal')
                        }
                    }
                    hideModal()
                }
            }
        })
    }

    showNewsModal = async (data: AppNewsItem, notificationId: string): Promise<void> => {
        await appNewsDS.shownPopup(data.id)
        if (notificationId) {
            firebase.notifications().removeDeliveredNotification(notificationId)
        }
    }
}
