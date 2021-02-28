/**
 * @version 0.9
 * @misha check if commented out is needed
 */
import React, { Component } from 'react'
import {
    View,
    Dimensions,
    StatusBar,
    StyleSheet
} from 'react-native'

import Modal from '../components/modal/MainModal'
import NavStore from '../components/navigation/NavStore.js'
import Loader from '../components/elements/Loader'

import Router from './Router'
import ErrorBoundary from 'react-native-error-boundary'
import ErrorScreen from '../modules/Error/ErrorScreen'
import Log from '../services/Log/Log'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function getStackTrace(err) {
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

export default class MainStack extends Component {

    // UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    //
    //     if(!this.props.navigationStore.initialRouteName != nextProps.navigationStore.initialRouteName){
    //         MainRouter = Router(nextProps.navigationStore)
    //     }
    // }

    render() {

        const { navigationStore } = this.props

        // if(!MainRouter){
        //     MainRouter = Router(navigationStore)
        // }

        return (
            <ErrorBoundary onError={myErrorHandler} FallbackComponent={ErrorScreen}>
                <View style={styles.container}>
                    <Router
                        // onNavigationStateChange={(prev, next) => NavStore.onNavigationStateChange(prev, next)}
                        ref={(ref) => {
                            NavStore.navigator = ref
                        }}
                    />
                    <Modal/>
                    <StatusBar translucent={true} backgroundColor={'transparent'} barStyle="dark-content"/>
                    <Loader/>
                </View>
            </ErrorBoundary>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})
