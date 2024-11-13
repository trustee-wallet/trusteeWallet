/**
 * @version 0.43
 * Init App
 */
import React, { useEffect } from 'react'
import SplashScreen from 'react-native-splash-screen'
import notifee, { EventType } from '@notifee/react-native'
import { Provider } from 'react-redux'
import { enableScreens } from 'react-native-screens'

import store from '@app/store'
import Application from '@app/appstores/Actions/App/App'

import Router from '@app/router'
import { ThemeProvider } from '@app/theme/ThemeProvider'

import Log from '@app/services/Log/Log'
import AppNotificationPopup from '@app/services/AppNotification/AppNotificationPopup'

enableScreens()

const App = () => {
    useEffect(() => {
        SplashScreen.hide()
        Application.init({ source: 'App.mount', onMount: true })

        const unsubscribePush = notifee.onForegroundEvent(async (message) => {
            await Log.log('App.js notifee.useForegroundEvent message ' + JSON.stringify(message))
            switch (message.type) {
                case EventType.DISMISSED:
                    break
                case EventType.PRESS:
                    AppNotificationPopup.onOpened(message?.detail?.notification)
                    break
            }
        })

        return () => {
            if (unsubscribePush) {
                unsubscribePush()
            }

            Application.willUnmount()
        }
    }, [])

    return (
        <ThemeProvider>
            <Provider store={store}>
                <Router />
            </Provider>
        </ThemeProvider>
    )
}

export default App
