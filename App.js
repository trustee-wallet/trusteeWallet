/**
 * Init App
 */

import React, { Component } from 'react'

import { Provider } from 'react-redux'

import store from './app/store'

import Notification from './app/services/notification'

import Router from './app/router'

export default class App extends Component {

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
