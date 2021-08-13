/**
 * @version 0.43
 * Init App
 */
import React from 'react'

import { Provider } from 'react-redux'
import { AppearanceProvider } from 'react-native-appearance'
import { Linking } from 'react-native'

import store from '@app/store'

import Router from '@app/router'
import { ThemeProvider } from '@app/theme/ThemeProvider'

import Application from '@app/appstores/Actions/App/App'
import { SendDeepLinking } from '@app/appstores/Stores/Send/SendDeepLinking'

import appsFlyer from 'react-native-appsflyer'

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

export default class App extends React.Component {

    componentDidMount() {
        Application.init({ source: 'App.mount', onMount : true })
        Linking.addEventListener('url', (data) => SendDeepLinking.handleInitialURL(data.url))
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
