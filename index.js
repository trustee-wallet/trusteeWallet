/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */
import './polyfills'
import 'react-native-gesture-handler'

import { AppRegistry, Platform } from 'react-native'
import messaging from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'
import './global'
import App from './App'
import { name as appName } from './app.json'

import PushNotification from 'react-native-push-notification'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import AppNotificationPopup from '@app/services/AppNotification/AppNotificationPopup'
import Log from '@app/services/Log/Log'

MarketingEvent.initMarketing(false, true)

PushNotification.configure({
    // (required) Called when a remote is received or opened, or local notification is opened
    onNotification: async function(notification) {
        const initNotification = await messaging().getInitialNotification()
        Log.log('PushNotification.configure.onNotification ' + JSON.stringify(notification))
        if (Platform.OS === 'android' && !notification?.data?.title && !!initNotification) {
            AppNotificationPopup.onOpened(notification)
        }
    }
})

messaging().setBackgroundMessageHandler(async (message) => {
    await Log.log('index.js messaging.setBackgroundMessageHandler ' + JSON.stringify(message))
    if (Platform.OS === 'ios') {
        await AppNotificationPopup.displayPush(message)
    }
})

notifee.onBackgroundEvent(async (message) => {
    await Log.log('PushNotificationsActions.onBackgroundEvent message ' + JSON.stringify(message))

    switch (message.type) {
        case EventType.DISMISSED:
            break
        case EventType.PRESS:
            if (Platform.OS === 'ios' || message?.detail?.notification?.data?.title) {
                AppNotificationPopup.onOpened(message?.detail?.notification)
            }
            break
    }
})

AppRegistry.registerComponent(appName, () => App)
