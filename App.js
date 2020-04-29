/**
 * @version 0.9
 * Init App
 */

import React, { Component } from 'react'

import { Provider } from 'react-redux'

import { Linking } from 'react-native'

import store from './app/store'

import Router from './app/router'
import Themes from './app/themes/Themes'

import Application from './app/appstores/Actions/App/App'
import SendActions from './app/appstores/Stores/Send/SendActions'


export default class App extends Component {

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        Themes.init()
    }

    componentDidMount() {
        Application.init()
        Linking.addEventListener('url', (data) => SendActions.handleInitialURL(data.url))
    }

    render() {
        return (
            <Provider store={store}>
                <Router/>
            </Provider>
        )
    }

}
