/**
 * @version 0.41
 * Init App
 */

import React, { Component, useEffect } from 'react'

import { Provider } from 'react-redux'
import { AppearanceProvider } from 'react-native-appearance'
import { Linking } from 'react-native'


import store from '@app/store'

import Router from '@app/router'
import Themes from '@app/themes/Themes'
import { ThemeProvider } from '@app/modules/theme/ThemeProvider'

import Application from '@app/appstores/Actions/App/App'
import { SendDeepLinking } from '@app/appstores/Stores/Send/SendDeepLinking'

export default class App extends Component {

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        Themes.init()
    }

    componentDidMount() {
        Application.init({ source: 'App.mount' })
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
