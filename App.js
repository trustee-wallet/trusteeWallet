/**
 * @version 0.43
 * Init App
 */
import React from 'react'

import { Provider } from 'react-redux'
import { AppearanceProvider } from 'react-native-appearance'
import { Platform, UIManager, Linking } from 'react-native'
import { enableScreens } from 'react-native-screens'

import store from '@app/store'

import Router from '@app/router'
import { ThemeProvider } from '@app/theme/ThemeProvider'

import Application from '@app/appstores/Actions/App/App'

import appsFlyer from 'react-native-appsflyer'

import { SendReceiveDeepLinking } from '@app/appstores/Stores/Send/SendReceiveDeepLinking'


appsFlyer.initSdk(
    {
        devKey: 'qUa6hSzjW3RDsTgEYQh4oT',
        isDebug: false,
        appId: '1462924276',
        onInstallConversionDataListener: true, // Optional
        onDeepLinkListener: true, // Optional
        timeToWaitForATTUserAuthorization: 10 // for iOS 14.5
    }
);

enableScreens()

const hendler = () => {
    SendReceiveDeepLinking.receiveDeepLink("APP")
}

export default class App extends React.Component {

    componentDidMount() {
        Application.init({ source: 'App.mount', onMount : true })

        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true)
            }
        }
        Linking.addEventListener('url', hendler)
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', hendler)
    }

    render() {
        return (
            <AppearanceProvider>
                <ThemeProvider>
                    <Provider store={store}>
                        <Router />
                    </Provider>
                </ThemeProvider>
            </AppearanceProvider>
        )
    }

}
