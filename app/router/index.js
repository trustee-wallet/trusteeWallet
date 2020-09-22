/**
 * @version 0.9
 * @misha check if commented out is needed
 */
import React, { Component } from 'react'
import { View, Dimensions, StatusBar } from 'react-native'
import { connect } from 'react-redux'

import Modal from '../components/modal/MainModal'
import NavStore from '../components/navigation/NavStore.js'
import Loader from '../components/elements/Loader'

import Router from './Router'
import ErrorBoundary from 'react-native-error-boundary'
import ErrorScreen from './ErrorScreen'
import Log from '../services/Log/Log'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function getStackTrace(err) {
    let stack = err.stack || ''
    stack = stack.split('\n').map(function(line) {
        const tmp = line.split('(http://localhost:')
        if (tmp && tmp.length > 1) {
            return tmp[0].trim()
        }
        return line.trim()
    })
    return stack.splice(stack[0] === 'Error' ? 2 : 1)
}

const myErrorHandler = (err) => {
    Log.err('myErrorHandler error ' + err.message, getStackTrace(err))
}

class MainStack extends Component {

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
                <View style={{ flex: 1 }}>
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

const mapStateToProps = (state) => {
    return {
        navigationStore: state.navigationStore
    }
}

export default connect(mapStateToProps, {})(MainStack)
