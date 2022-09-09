/**
 * @version 0.30
 **/
import messaging from '@react-native-firebase/messaging'
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

import { Platform } from 'react-native'
import { setLockScreenConfig, LockScreenFlowTypes } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { LANGUAGE_SETTINGS } from '@app/modules/Settings/helpers'
import ApiProxyLoad from '@app/services/Api/ApiProxyLoad'


const CACHE_VALID_TIME = 120000000 // 2000 minute

const DEBUG_NOTIFS = true

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
        const hasInternet = await ApiProxyLoad.hasInternet()
        if (hasInternet) {
            if (await this.checkPermission()) {
                this.inited = true
                await this.createRefreshListener()
                await this.createMessageListener()
            }
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
                await console.log('PUSH checkPermission error ' + e.message)
            }
            await Log.log('PUSH checkPermission error ' + e.message)
        }

        if (DEBUG_NOTIFS) {
            await Log.log('PUSH checkPermission result ' + JSON.stringify(res))
        }
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
        if (!this.inited) {
            return
        }
        if (DEBUG_NOTIFS) {
            Log.log('PUSH subscribe ' + topic + ' started ' + locale)
        }

        for (const lang of LANGUAGE_SETTINGS) {
            const sub = sublocale(lang.code)
            if (sub === locale) {
                if (DEBUG_NOTIFS) {
                    Log.log('PUSH subscribe ' + topic + ' lang ' + locale + ' isDEV ' + (isDev ? ' true ' : ' false '))
                }
                await messaging().subscribeToTopic(topic)
                await messaging().subscribeToTopic(topic + '_' + locale)
                await messaging().subscribeToTopic(`${topic}_${Platform.OS}`)
                await messaging().subscribeToTopic(`${topic}_${Platform.OS}_${locale}`)
                if (isDev) {
                    await messaging().subscribeToTopic(topic + '_dev')
                    await messaging().subscribeToTopic(topic + '_dev_' + locale)
                } else {
                    await messaging().unsubscribeFromTopic(topic + '_dev')
                    await messaging().unsubscribeFromTopic(topic + '_dev_' + locale)
                }
            } else {
                if (DEBUG_NOTIFS) {
                    Log.log('PUSH subscribe ' + topic + ' unlang ' + sub + ' isDEV ' + (isDev ? ' true ' : ' false '))
                }
                await messaging().unsubscribeFromTopic(topic + '_' + sub)
                await messaging().unsubscribeFromTopic(topic + '_dev_' + sub)
                await messaging().unsubscribeFromTopic(`${topic}_${Platform.OS}_${sub}`)
            }
        }

        if (DEBUG_NOTIFS) {
            Log.log('PUSH subscribe ' + topic + ' finished')
        }
    }

    async _unsubscribe(topic: string): Promise<void> {
        if (!this.inited) {
            return
        }
        if (DEBUG_NOTIFS) {
            Log.log('PUSH unsubscribe ' + topic + ' started')
        }

        await messaging().unsubscribeFromTopic(topic)
        await messaging().unsubscribeFromTopic(topic + '_dev')
        await messaging().unsubscribeFromTopic(`${topic}_${Platform.OS}`)
        for (const lang of LANGUAGE_SETTINGS) {
            const sub = sublocale(lang.code)
            await messaging().unsubscribeFromTopic(topic + '_' + sub)
            await messaging().unsubscribeFromTopic(topic + '_dev_' + sub)
            await messaging().unsubscribeFromTopic(`${topic}_${Platform.OS}_${sub}`)
        }

        if (DEBUG_NOTIFS) {
            Log.log('PUSH unsubscribe ' + topic + ' finished')
        }
    }

    async rmvOld(fcmToken: string = ''): Promise<void> {
        if (!this.inited) {
            return
        }
        if (fcmToken && fcmToken.indexOf('NO_GOOGLE') !== -1) {
            return
        }
        try {
            if (DEBUG_NOTIFS) {
                await Log.log('PUSH rmvOld start')
            }
            await messaging().unsubscribeFromTopic('trustee_all')
            await messaging().unsubscribeFromTopic('trustee_dev')
            for (const lang of LANGUAGE_SETTINGS) {
                const sub = sublocale(lang.code)
                await messaging().unsubscribeFromTopic('trustee_all_' + sub)
                await messaging().unsubscribeFromTopic('trustee_dev_' + sub)
            }
            if (DEBUG_NOTIFS) {
                await Log.log('PUSH rmvOld finished')
            }
        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('PUSH rmvOld error ' + e.message)
            }
        }
    }

    async updateSubscriptions(fcmToken: string = ''): Promise<void> {
        if (!this.inited) {
            if (DEBUG_NOTIFS) {
                Log.log('PUSH updateSubscriptions NOT INITIED')
            }
            return
        }
        if (fcmToken && fcmToken.indexOf('NO_GOOGLE') !== -1) {
            if (DEBUG_NOTIFS) {
                Log.log('PUSH updateSubscriptions NO_GOOGLE')
            }
            return
        }
        if (DEBUG_NOTIFS) {
            Log.log('PUSH updateSubscriptions ' + fcmToken)
        }
        const settings = await settingsActions.getSettings(false, false)
        if (typeof settings === 'undefined' || !settings) {
            return
        }
        const notifsStatus = settings && typeof settings.notifsStatus !== 'undefined' && settings.notifsStatus ? settings.notifsStatus : '1'
        const locale = settings && typeof settings.language !== 'undefined' && settings.language ? sublocale(settings.language) : sublocale()
        if (DEBUG_NOTIFS) {
            Log.log('PUSH updateSubscriptions currentSettings ' + settings.language + ' locale ' + locale)
        }
        const isDev = trusteeAsyncStorage.getDevMode()


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
        if (!this.inited) {
            return
        }
        if (DEBUG_NOTIFS) {
            await Log.log('PUSH updateSubscriptionsLater')
        }
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
        let fcmToken: string | null = await trusteeAsyncStorage.getFcmToken()
        // @ts-ignore
        let time: number = 1 * trusteeAsyncStorage.getFcmTokenTime()

        const now = new Date().getTime()
        if (time && fcmToken) {
            if (now - time > CACHE_VALID_TIME && fcmToken.indexOf('NO_GOOGLE') === -1) {
                time = 0
                fcmToken = ''
                if (DEBUG_NOTIFS) {
                    await Log.log('PUSH getToken cache invalidate ' + (now - time) + ' time ' + time)
                }
            } else {
                // Log.log('PUSH getToken cache valid ' + (now - time) + ' time ' + time)
            }
        }

        await settingsActions.getSettings(false, false)
        const notifsSavedToken = await settingsActions.getSetting('notifsSavedToken')
        const notifsRmvOld = await settingsActions.getSetting('notifsRmvOld')

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
                        console.log('PUSH getToken fcmToken error ' + e.message + ' ' + fcmToken)
                    }
                    await Log.log('PUSH getToken fcmToken error ' + e.message + ' ' + fcmToken)
                }

                if (!fcmToken) {
                    try {
                        await messaging().registerDeviceForRemoteMessages()
                        fcmToken = await messaging().getToken()
                    } catch (e) {
                        if (config.debug.appErrors) {
                            console.log('PUSH getToken fcmToken error ' + e.message)
                        }
                        await Log.log('PUSH getToken fcmToken error ' + e.message)
                        if (e.message.indexOf('MISSING_INSTANCEID_SERVICE') !== -1) {
                            fcmToken = 'NO_GOOGLE_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
                        }
                    }
                }
                if (DEBUG_NOTIFS) {
                    await Log.log('PUSH getToken subscribed token ' + fcmToken)
                }
                await this._onRefresh(fcmToken)
                trusteeAsyncStorage.setFcmTokenTime(now + '')
            } else {
                // Log.log('PUSH getToken1 cache result ', fcmToken)
            }

            // @ts-ignore
            MarketingEvent.DATA.LOG_TOKEN = fcmToken
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('PUSH getToken error ' + e.message)
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
            if (config.debug.appErrors) {
                console.log('PUSH requestPermission rejected error ' + e.message)
            }
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
                    if (DEBUG_NOTIFS) {
                        await Log.log('PUSH _onMessage startMessage not null but lockScreen is needed', startMessage)
                    }
                    const unifiedPush = await AppNotificationPushSave.unifyPushAndSave(startMessage)

                    if (unifiedPush) {
                        setLockScreenConfig({flowType : LockScreenFlowTypes.PUSH_POPUP_CALLBACK, callback : async () => {
                                await Log.log('PUSH _onMessage startMessage after lock screen', unifiedPush)
                                if (await AppNewsActions.onOpen(unifiedPush, '', '', false)) {
                                    NavStore.reset('TabBar', { screen: 'HomeScreen', params: { screen: 'NotificationsScreen', initial: false }})
                                }  else {
                                    NavStore.reset('TabBar')
                                }
                        }})

                        NavStore.goNext('LockScreenPop')
                    }
                } else {
                    if (DEBUG_NOTIFS) {
                        await Log.log('PUSH _onMessage startMessage not null', startMessage)
                    }
                    UpdateAppNewsDaemon.goToNotifications('AFTER_APP')

                    const unifiedPush = await AppNotificationPushSave.unifyPushAndSave(startMessage)

                    await UpdateAppNewsDaemon.updateAppNewsDaemon()

                    if (DEBUG_NOTIFS) {
                        await Log.log('PUSH _onMessage startMessage unified', unifiedPush)
                    }
                    if (unifiedPush) {
                        if (UpdateAppNewsDaemon.isGoToNotifications('INITED_APP')) {
                            await Log.log('PUSH _onMessage startMessage app is inited first')
                            if (await AppNewsActions.onOpen(unifiedPush)) {
                                NavStore.reset('TabBar', { screen: 'HomeScreen', params: { screen: 'NotificationsScreen', initial: false }})
                            }
                        } else {
                            await Log.log('PUSH _onMessage startMessage app is not inited')
                            await AppNewsActions.onOpen(unifiedPush)
                        }
                    }
                }

                if (DEBUG_NOTIFS) {
                    await Log.log('PUSH _onMessage startMessage finished')
                }
            } else {
                if (DEBUG_NOTIFS) {
                    await Log.log('PUSH _onMessage startMessage is null', startMessage)
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('PUSH _onMessage startMessage error ' + e.message)
            }
            await Log.log('PUSH _onMessage startMessage error ' + e.message)
        }

        this.messageListener = messaging().onMessage(async (message) => {
            if (DEBUG_NOTIFS) {
                await Log.log('PUSH _onMessage inited, locked ' + JSON.stringify(MarketingEvent.UI_DATA.IS_LOCKED))
            }
            await AppNotificationPopup.displayPush(message)
        })

        await messaging().onNotificationOpenedApp(async (message) => {
            if (DEBUG_NOTIFS) {
                await Log.log('PUSH _onNotificationOpened inited, locked ' + JSON.stringify(MarketingEvent.UI_DATA.IS_LOCKED))
            }
            await AppNotificationPopup.onOpened(message)
        })

        await messaging().setBackgroundMessageHandler(async (message) => {
            if (DEBUG_NOTIFS) {
                await Log.log('PUSH _onMessage inited, locked ' + JSON.stringify(MarketingEvent.UI_DATA.IS_LOCKED))
            }
            await AppNotificationPopup.displayPush(message)
        })

    }

    _onRefresh = async (fcmToken: string): Promise<void> => {
        if (!fcmToken) return
        let tmp = trusteeAsyncStorage.getFcmTokensAll()
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
        if (DEBUG_NOTIFS) {
            Log.log('PUSH _onRefreshAll ', all)
        }
        await trusteeAsyncStorage.setFcmTokensAll(all, fcmToken)
    }

    createRefreshListener = async (): Promise<void> => {
        /*
        * Triggered for data only payload in foreground
        * */
        if (DEBUG_NOTIFS) {
            Log.log('PUSH _onRefresh inited')
        }
        this.messageListener = messaging().onTokenRefresh((fcmToken) => {
            if (DEBUG_NOTIFS) {
                Log.log('PUSH _onRefresh', fcmToken)
            }
            this._onRefresh(fcmToken)

        })
    }
}
