/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import 'react-native-gesture-handler'
import {AppRegistry} from 'react-native';
import './shim.js'
import './global';
import App from './App';
import {name as appName} from './app.json';
import MarketingEvent from './app/services/Marketing/MarketingEvent'

MarketingEvent.initMarketing(false)

AppRegistry.registerComponent(appName, () => App);
