/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import 'react-native-gesture-handler'
import BackgroundFetch from 'react-native-background-fetch'
import { AppRegistry } from 'react-native'
import './shim.js'
import './global'
import App from './App'
import { name as appName } from './app.json'
import MarketingEvent from './app/services/Marketing/MarketingEvent'
import BackgroundDaemon from './app/daemons/BackgroundDaemon'

MarketingEvent.initMarketing(false)

BackgroundFetch.registerHeadlessTask(BackgroundDaemon.taskToRegister)
AppRegistry.registerComponent(appName, () => App)
