/**
 * Init App
 */

import React, { Component } from 'react'

import { Provider } from 'react-redux'

import store from './app/store'

import Notification from './app/services/notification'

import Router from './app/router'
import Themes from './app/themes/Themes'

import Application from './app/appstores/Actions/App/App'


export default class App extends Component {

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        Themes.init()
    }

    componentDidMount() {
        Application.init()
    }

    render() {
        return (
            <Provider store={store}>
                <Notification>
                    <Router/>
                </Notification>
            </Provider>
        )
    }

}
