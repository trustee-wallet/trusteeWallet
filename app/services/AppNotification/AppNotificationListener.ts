/**
 * @version 0.30
 **/
import messaging from '@react-native-firebase/messaging'
import AsyncStorage from '@react-native-community/async-storage'
import Log from '../Log/Log'
import { sublocale } from '../i18n'

import MarketingEvent from '../Marketing/MarketingEvent'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import config from '../../config/config'

import NavStore from '../../components/navigation/NavStore'
import UpdateAppNewsDaemon from '../../daemons/back/UpdateAppNewsDaemon'
import AppNotificationPushSave from './AppNotificationPushSave'
import AppNotificationPopup from './AppNotificationPopup'
import { AppNewsActions } from '../../appstores/Stores/AppNews/AppNewsActions'
import { SettingsKeystore } from '../../appstores/Stores/Settings/SettingsKeystore'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { Platform } from 'react-native'

const ASYNC_CACHE_TITLE = 'pushTokenV2'
const ASYNC_CACHE_TIME = 'pushTokenTime'
const ASYNC_ALL_CACHE = 'allPushTokens'
const CACHE_VALID_TIME = 120000000 // 2000 minute


const TOPICS = ['transactions', 'exchangeRates', 'news']

export default new class AppNotificationListener {

    private messageListener: any
    private inited: boolean = false
    private initing: number = 0
    private timer : any

    async init(): Promise<void> {
        const now = new Date().getTime()
        if (this.inited || (now - this.initing) < 10000) {
            return
        }
        this.initing = now
        if (await this.checkPermission()) {
            this.inited = true
            await this.createRefreshListener()
            await this.createMessageListener()
        }
    }

    async checkPermission(): Promise<boolean> {
        let res = false
        try {
            const enabled: any = await messaging().hasPermission()
            if (enabled) {
                await this.getToken()
                res = true
            } else {
                res = await this.requestPermission()
            }
        } catch (e) {
            if (config.debug.appErrors) {
                await Log.log('PUSH checkPermission error ' + e.message)
            }
            await Log.log('PUSH checkPermission error ' + e.message)
        }

        await Log.log('PUSH checkPermission result ' + JSON.stringify(res))
        /*
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
        */
        return res
    }

    async _subscribe(topic: string, locale: string, isDev: boolean): Promise<void> {
        const { languageList } = config.language
        Log.log('PUSH subscribe ' + topic + ' started ' + locale)

        for (const lang of languageList) {
            const sub = sublocale(lang.code)
            if (sub === locale) {
                Log.log('PUSH subscribe ' + topic + ' lang ' + locale)
                await messaging().subscribeToTopic(topic)
                await messaging().subscribeToTopic(topic + '_' + locale)
                if (Platform.OS === 'ios') {
                    await messaging().subscribeToTopic(topic + '_ios')
                    await messaging().subscribeToTopic(topic + '_ios_' + locale)
                } else {
                    await messaging().subscribeToTopic(topic + '_android')
                    await messaging().subscribeToTopic(topic + '_android_' + locale)
                }
                if (isDev) {
                    await messaging().subscribeToTopic(topic + '_dev')
                    await messaging().subscribeToTopic(topic + '_dev_' + locale)
                } else {
                    await messaging().unsubscribeFromTopic(topic + '_dev')
                    await messaging().unsubscribeFromTopic(topic + '_dev_' + locale)
                }
            } else {
                Log.log('PUSH subscribe ' + topic + ' unlang ' + sub)
                await messaging().unsubscribeFromTopic(topic + '_' + sub)
                await messaging().unsubscribeFromTopic(topic + '_dev_' + sub)
                if (Platform.OS === 'ios') {
                    await messaging().unsubscribeFromTopic(topic + '_ios_' + sub)
                } else {
                    await messaging().unsubscribeFromTopic(topic + '_android_' + sub)
                }
            }
        }

        Log.log('PUSH subscribe ' + topic + ' finished')
    }

    async _unsubscribe(topic: string): Promise<void> {
        const { languageList } = config.language

        Log.log('PUSH unsubscribe ' + topic + ' started')

        await messaging().unsubscribeFromTopic(topic)
        await messaging().unsubscribeFromTopic(topic + '_dev')
        if (Platform.OS === 'ios') {
            await messaging().unsubscribeFromTopic(topic + '_ios')
        } else {
            await messaging().unsubscribeFromTopic(topic + '_android')
        }
        for (const lang of languageList) {
            const sub = sublocale(lang.code)
            await messaging().unsubscribeFromTopic(topic + '_' + sub)
            await messaging().unsubscribeFromTopic(topic + '_dev_' + sub)
            if (Platform.OS === 'ios') {
                await messaging().unsubscribeFromTopic(topic + '_ios_' + sub)
            } else {
                await messaging().unsubscribeFromTopic(topic + '_android_' + sub)
            }
        }

        Log.log('PUSH unsubscribe ' + topic + ' finished')
    }

    async rmvOld(fcmToken: string = ''): Promise<void> {
        if (fcmToken && fcmToken.indexOf('NO_GOOGLE') !== -1) {
            return
        }
        const { languageList } = config.language
        try {
            await Log.log('PUSH rmvOld start')
            await messaging().unsubscribeFromTopic('trustee_all')
            await messaging().unsubscribeFromTopic('trustee_dev')
            for (const lang of languageList) {
                const sub = sublocale(lang.code)
                await messaging().unsubscribeFromTopic('trustee_all_' + sub)
                await messaging().unsubscribeFromTopic('trustee_dev_' + sub)
            }
            await Log.log('PUSH rmvOld finished')
        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('PUSH rmvOld error ' + e.message)
            }
        }
    }

    async updateSubscriptions(fcmToken: string = ''): Promise<void> {
        if (fcmToken && fcmToken.indexOf('NO_GOOGLE') !== -1) {
            return
        }
        Log.log('PUSH updateSubscriptions ' + fcmToken)
        const settings = await settingsActions.getSettings(false)
        if (typeof settings === 'undefined' || !settings) {
            return
        }
        const notifsStatus = settings && typeof settings.notifsStatus !== 'undefined' && settings.notifsStatus ? settings.notifsStatus : '1'
        const locale = settings && typeof settings.language !== 'undefined' && settings.language ? sublocale(settings.language) : sublocale()
        Log.log('settings ' + settings.language + ' locale ' + locale)
        const devMode = await AsyncStorage.getItem('devMode')
        const isDev = devMode && devMode.toString() === '1'


        await this._subscribe('trusteeAll', locale, isDev as boolean)
        if (notifsStatus === '1') {
            for (const key of TOPICS) {
                // @ts-ignore
                if (typeof settings[key + 'Notifs'] === 'undefined' || settings[key + 'Notifs'] === '1') {
                    await this._subscribe(key, locale, isDev as boolean)
                } else {
                    await this._unsubscribe(key)
                }
            }
        } else {
            for (const key of TOPICS) {
                await this._unsubscribe(key)
            }
        }

        if (typeof fcmToken === 'undefined' || fcmToken === '') {
            fcmToken = MarketingEvent.DATA.LOG_TOKEN
        }
        if (typeof settings.dbVersion !== 'undefined' && settings.dbVersion) {
            await settingsActions.setSettings('notifsSavedToken', fcmToken)
        }
    }

    async updateSubscriptionsLater(): Promise<void> {
        await Log.log('PUSH updateSubscriptionsLater')
        await settingsActions.setSettings('notifsSavedToken', '')
        try {
            if (this.timer) {
                clearTimeout(this.timer)
            }
        } catch (e) {
            await Log.log('PUSH updateSubscriptionsLater timer clean error ' + e.message)
        }
        this.timer = setTimeout(() => {
            this.updateSubscriptions()
        }, 2000)
    }

    async getToken(): Promise<string | null> {
        let fcmToken: string | null = await AsyncStorage.getItem(ASYNC_CACHE_TITLE)
        // @ts-ignore
        let time: number = 1 * (await AsyncStorage.getItem(ASYNC_CACHE_TIME))

        const now = new Date().getTime()
        if (time && fcmToken) {
            if (now - time > CACHE_VALID_TIME && fcmToken.indexOf('NO_GOOGLE') === -1) {
                time = 0
                fcmToken = ''
                await Log.log('PUSH getToken cache invalidate ' + (now - time) + ' time ' + time)
            } else {
                // Log.log('PUSH getToken cache valid ' + (now - time) + ' time ' + time)
            }
        }

        const notifsSavedToken = await settingsActions.getSetting('notifsSavedToken')
        const notifsRmvOld = await settingsActions.getSetting('notifsRmvOld')

        // Log.log('notifsSavedToken', notifsSavedToken)
        try {
            if (!time || !fcmToken || fcmToken === '' || notifsSavedToken !== fcmToken) {
                if (fcmToken) {
                    await this.updateSubscriptions(fcmToken)
                }
                try {
                    fcmToken = await messaging().getToken()
                    if (!notifsRmvOld && fcmToken) {
                        await this.rmvOld(fcmToken)
                        await settingsActions.setSettings('notifsRmvOld', '1')
                    }
                } catch (e) {
                    if (config.debug.appErrors) {
                        Log.log('PUSH getToken fcmToken error ' + e.message)
                    }
                    await Log.log('PUSH getToken fcmToken error ' + e.message)
                }

                if (!fcmToken) {
                    try {
                        await messaging().registerDeviceForRemoteMessages()
                        fcmToken = await messaging().getToken()
                    } catch (e) {
                        if (config.debug.appErrors) {
                            Log.log('PUSH getToken fcmToken error ' + e.message)
                        }
                        await Log.log('PUSH getToken fcmToken error ' + e.message)
                        if (e.message.indexOf('MISSING_INSTANCEID_SERVICE') !== -1) {
                            fcmToken = 'NO_GOOGLE_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
                        }
                    }
                }

                await Log.log('PUSH getToken subscribed token ' + fcmToken)
                await this._onRefresh(fcmToken)
                await AsyncStorage.setItem(ASYNC_CACHE_TIME, now + '')
            } else {
                // Log.log('PUSH getToken1 cache result ', fcmToken)
            }

            // @ts-ignore
            MarketingEvent.DATA.LOG_TOKEN = fcmToken
        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('PUSH getToken error ' + e.message)
            }
            await Log.log('PUSH getToken error ' + e.message)
        }
        return fcmToken
    }

    async requestPermission(): Promise<boolean> {
        try {
            await messaging().requestPermission()
            await this.getToken()
            return true
        } catch (e) {
            Log.log('PUSH requestPermission rejected error ' + e.message)
            return false
        }
    }

    createMessageListener = async (): Promise<void> => {
        try {
            const startMessage = await messaging().getInitialNotification()

            if (startMessage && typeof startMessage.messageId !== 'undefined') {
                const lockScreen = await SettingsKeystore.getLockScreenStatus()
                if (+lockScreen) {
                    await Log.log('PUSH _onMessage startMessage not null but lockScreen is needed', startMessage)
                    const unifiedPush = await AppNotificationPushSave.unifyPushAndSave(startMessage)
                    lockScreenAction.setFlowType({
                        flowType: 'JUST_CALLBACK'
                    })
                    lockScreenAction.setActionCallback({
                        actionCallback: async () => {
                            await Log.log('PUSH _onMessage startMessage after lock screen', unifiedPush)
                            if (await AppNewsActions.onOpen(unifiedPush, '', '', false)) {
                                NavStore.reset('NotificationsScreen')
                            }
                        }
                    })
                    NavStore.reset('LockScreenPop')
                } else {
                    await Log.log('PUSH _onMessage startMessage not null', startMessage)
                    UpdateAppNewsDaemon.goToNotifications('AFTER_APP')

                    const unifiedPush = await AppNotificationPushSave.unifyPushAndSave(startMessage)

                    await UpdateAppNewsDaemon.updateAppNewsDaemon()

                    await Log.log('PUSH _onMessage startMessage unified', unifiedPush)
                    if (UpdateAppNewsDaemon.isGoToNotifications('INITED_APP')) {
                        await Log.log('PUSH _onMessage startMessage app is inited first')
                        if (await AppNewsActions.onOpen(unifiedPush)) {
                            NavStore.reset('NotificationsScreen')
                        }
                    } else {
                        await Log.log('PUSH _onMessage startMessage app is not inited')
                        await AppNewsActions.onOpen(unifiedPush)
                    }
                }

                await Log.log('PUSH _onMessage startMessage finished')
            } else {
                await Log.log('PUSH _onMessage startMessage is null', startMessage)
            }
        } catch (e) {
            Log.err('PUSH _onMessage startMessage error ' + e.message)
        }

        this.messageListener = messaging().onMessage(async (message) => {
            await Log.log('PUSH _onMessage inited, locked ' + JSON.stringify(MarketingEvent.UI_DATA.IS_LOCKED))
            await AppNotificationPopup.displayPush(message)
        })

        await messaging().onNotificationOpenedApp(async (message) => {
            await Log.log('PUSH _onNotificationOpened inited, locked ' + JSON.stringify(MarketingEvent.UI_DATA.IS_LOCKED))
            await AppNotificationPopup.onOpened(message)
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
        this.messageListener = messaging().onTokenRefresh((fcmToken) => {
            Log.log('PUSH _onRefresh', fcmToken)
            this._onRefresh(fcmToken)

        })
    }
}
