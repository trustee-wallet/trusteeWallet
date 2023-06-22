/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */
import './polyfills'
import 'react-native-gesture-handler'

import { AppRegistry } from 'react-native'
import './shim.js'
import './global'
import App from './App'
import { name as appName } from './app.json'

import PushNotification from 'react-native-push-notification'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import AppNotificationPopup from '@app/services/AppNotification/AppNotificationPopup'

MarketingEvent.initMarketing(false, true)

PushNotification.configure({
    // (required) Called when a remote is received or opened, or local notification is opened
    onNotification: function(notification) {
        AppNotificationPopup.onOpened(notification)
    }
})


// @deprecated BackgroundFetch.registerHeadlessTask(BackgroundDaemon.taskToRegister)
AppRegistry.registerComponent(appName, () => App)
