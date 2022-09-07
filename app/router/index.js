/**
 * @version 0.50
 * https://reactnavigation.org/docs/navigating-without-navigation-prop
 */
import React from 'react'
import { View, StatusBar, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import ErrorBoundary from 'react-native-error-boundary'
import { PortalProvider } from '@gorhom/portal'

import Modal from '@app/components/modal/MainModal'
import Loader from '@app/components/elements/Loader'

import ErrorScreen from '@app/modules/Error/ErrorScreen'
import Log from '@app/services/Log/Log'

import NewRouter from './NewRouter'
import { navigationRef } from '@app/components/navigation/NavRoot'
import AppLockBlur from '@app/components/AppLockBlur'

const getStackTrace = (err) => {
    let stack = err.stack || ''
    let isIndex = false
    let deepIndex = 0
    stack = stack.split('\n').map(function(line) {
        const tmp = line.split('(http://localhost:')
        deepIndex++
        if (deepIndex > 3) {
            return ''
        }
        if (tmp && tmp.length > 1) {
            return tmp[0].trim() + ' '
        }
        if (line.indexOf('index.android.bundle') !== -1) {
            if (isIndex) {
                return ''
            }
            isIndex = true
        }
        return line.trim() + ' '
    })
    return stack.splice(stack[0] === 'Error' ? 2 : 1).join('')
}

const myErrorHandler = (err) => {
    Log.err('myErrorHandler error ' + err.message, getStackTrace(err))
}

export default class RouterMainWrapper extends React.Component {

    render() {

        return (
            <ErrorBoundary onError={myErrorHandler} FallbackComponent={ErrorScreen}>
                <View style={styles.container}>
                    <NavigationContainer ref={navigationRef}>
                        <PortalProvider>
                            <NewRouter />
                        </PortalProvider>
                    </NavigationContainer>
                    <Modal />
                    <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
                </View>
                <Loader />
                <AppLockBlur />
            </ErrorBoundary>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})
