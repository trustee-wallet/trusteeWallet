/**
 * @version 0.43
 * Init App
 */
import React from 'react'

import { Provider } from 'react-redux'
import { AppearanceProvider } from 'react-native-appearance'
import { enableScreens } from 'react-native-screens'

import store from '@app/store'

import Router from '@app/router'
import { ThemeProvider } from '@app/theme/ThemeProvider'

import Application from '@app/appstores/Actions/App/App'

enableScreens()

export default class App extends React.Component {

    componentDidMount() {
        Application.init({ source: 'App.mount', onMount : true })
    }

    componentWillUnmount() {
        Application.willUnmount()
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
