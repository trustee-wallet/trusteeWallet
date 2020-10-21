import { Platform } from 'react-native'
import firebase, { RNFirebase } from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage'
import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'
import Log from '../Log/Log'
import { sublocale } from '../i18n'
import { NotificationUnified } from './Types'
import { AppNewsItem } from '../../appstores/Stores/AppNews/Types'

import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import cryptoWalletActions from '../../appstores/Actions/CryptoWalletActions'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'


const ASYNC_CACHE_TITLE = 'pushTokenV2'
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

    async unsetLang(): Promise<void> {
        const locale: string = sublocale()
        try {
            await firebase.messaging().unsubscribeFromTopic('trustee_all_' + locale)
        } catch (e) {
            Log.log('PUSH unsetLang ' + locale + ' error ' + e.message)
        }
        try {
            await firebase.messaging().unsubscribeFromTopic('trustee_dev_' + locale)
        } catch (e) {
            Log.log('PUSH unsetLang ' + locale + ' error ' + e.message)
        }
    }

    async setLang(): Promise<void> {
        const locale: string = sublocale()
        try {
            await firebase.messaging().subscribeToTopic('trustee_all_' + locale)
        } catch (e) {
            Log.log('PUSH setLang ' + locale + ' error ' + e.message)
        }
        const devMode = await AsyncStorage.getItem('devMode')
        if (devMode && devMode.toString() === '1') {
            try {
                await firebase.messaging().subscribeToTopic('trustee_dev_' + locale)
            } catch (e) {
                Log.log('PUSH setLang ' + locale + ' error ' + e.message)
            }
        }
    }

    async unsetDev(): Promise<void> {
        const locale: string = sublocale()
        const keys = ['trustee_dev', 'trustee_dev_' + locale, 'trustee_dev_ua', 'trustee_dev_en', 'trustee_dev_ru']
        for (const key of keys) {
            try {
                await firebase.messaging().unsubscribeFromTopic(key)
            } catch (e) {
                Log.log('PUSH unsetDev ' + locale + ' error ' + e.message)
            }
        }
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

        const locale: string = sublocale()

        if (!time || !fcmToken || fcmToken === '') {
            await firebase.messaging().subscribeToTopic('trustee_all')
            await firebase.messaging().subscribeToTopic('trustee_all_' + locale)
            const devMode = await AsyncStorage.getItem('devMode')
            if (devMode && devMode.toString() === '1') {
                await firebase.messaging().subscribeToTopic('trustee_dev')
                await firebase.messaging().subscribeToTopic('trustee_dev_' + locale)
            }
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
                    data = this._unifyAnyPush(notificationOpen.notification)
                    notificationId = data.toSave.newsServerId
                } catch (e) {
                    // @ts-ignore
                    Log.err('PUSH AppNotification.createNotificationOpenedListener parse error ' + e.message, notificationOpen.notification._data)
                }

                try {
                    if (typeof data.toShow !== 'undefined' && data.toShow && typeof data.toShow.newsCreated !== 'undefined') {
                        this.showNewsModal(data.toShow, notificationId)
                    } else {
                        this.showNotificationModal(data.toSave, notificationId)
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
            data = this._unifyAnyPush(notificationOpen.notification)
            notificationId = data.toSave.newsServerId
        } catch (e) {
            Log.log('PUSH _isAppOpenViaNotification parse error ' + e.message)
        }

        try {
            if (typeof data.toShow !== 'undefined' && data.toShow && typeof data.toShow.newsCreated !== 'undefined') {
                // @ts-ignore
                this.showNewsModal(data.toShow, notificationId)
            } else {
                // @ts-ignore
                this.showNotificationModal(data.toSave, notificationId)
            }
        } catch (e) {
            Log.log('PUSH _isAppOpenViaNotification show error ' + e.message, { data, notificationId })
        }
    }


    _unifyAnyPush(notification: RNFirebase.notifications.Notification): { toSave: NotificationUnified, toShow: AppNewsItem, needReload: boolean } {

        let toShow = false
        try {
            // @ts-ignore
            if (typeof notification._data.notification !== 'undefined') {
                // @ts-ignore
                toShow = JSON.parse(notification._data.notification)
            } else {
                // @ts-ignore
                toShow = notification._data.notificationJson
            }
        } catch (e) {
            // do nothing
        }

        const toSave = {
            newsSource: 'PUSHES',
            newsGroup: 'PUSHES',
            newsName: 'PUSH_NOTIFICATION',
            newsCustomTitle: notification.title,
            newsCustomText: notification.body,
            newsNeedPopup: 0,
            newsServerId: notification.notificationId,
            newsJson: {}
        } as NotificationUnified

        const locale: string = sublocale()

        const keys = [
            notification.data,
            notification.body
        ]
        // @ts-ignore
        if (typeof notification._data !== 'undefined') {
            // @ts-ignore
            if (typeof notification._data.notification !== 'undefined') {
                // @ts-ignore
                keys.push(notification._data.notification)
                // @ts-ignore
            } else if (typeof notification._data.notificationJson !== 'undefined') {
                // @ts-ignore
                keys.push(notification._data.notificationJson)
            } else {
                // @ts-ignore
                keys.push(notification._data)
            }
        }
        if (typeof notification.data !== 'undefined') {
            keys.push(notification.data)
        }
        if (typeof notification.body !== 'undefined') {
            keys.push(notification.body)
        }

        for (const key of keys) {
            if (!key) continue
            let tmp = false
            if (typeof notification.body !== 'object') {
                try {
                    tmp = JSON.parse(key)
                } catch (e) {
                    Log.log('PUSH _onNotification notification not JSON ' + e.message, key)
                }
            } else {
                tmp = key
            }
            if (tmp && typeof tmp === 'object') {
                // @ts-ignore
                toSave.newsJson = { ...tmp, ...toSave.newsJson }
            }
        }

        if (toSave.newsJson === {}) {
            // @ts-ignore
            toSave.newsJson = false
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
            if (typeof toSave.newsJson.notification !== 'undefined' && typeof toSave.newsJson.notification['en'] !== 'undefined') {
                lang = toSave.newsJson.notification
            }
            if (typeof toSave.newsJson.inCurrencyCode !== 'undefined') {
                needReload = true
            }
            if (typeof lang !== 'undefined' && typeof lang['en'] !== 'undefined' && typeof lang['en'].title !== 'undefined' && lang['en'].title === 'Exchange') {
                needReload = true
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
        return { toSave, needReload, toShow }
    }

    async _onNotification(notification: RNFirebase.notifications.Notification): Promise<void> {

        const { toSave, needReload } = this._unifyAnyPush(notification)
        Log.log('PUSH _onNotification got toSave', toSave)
        await appNewsDS.saveAppNews(toSave)

        const notificationSubtitle: string | undefined = typeof notification.subtitle === 'undefined' ? '' : notification.subtitle

        let localNotification = new firebase.notifications.Notification()
            .setNotificationId(notification.notificationId)
            .setTitle(toSave.newsCustomTitle)
            .setSubtitle(notificationSubtitle)
            .setBody(toSave.newsCustomText)
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
                return false
            })
        } catch (e) {
            Log.err('PUSH _onNotification outside error ' + e.message)
        }
    }

    showNotificationModal = (data: NotificationUnified, notificationId: string): void => {
        const locale: string = sublocale()
        showModal({
            type: 'CHOOSE_INFO_MODAL',
            data: {
                // @ts-ignore
                title: data.newsCustomTitle,
                // @ts-ignore
                description: data.newsCustomText,
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
