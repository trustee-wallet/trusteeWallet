/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { View, Dimensions, StatusBar } from 'react-native'
import { connect } from 'react-redux'

import Modal from '../components/modal'
import NavStore from '../components/navigation/NavStore.js'
import Loader from '../components/elements/Loader'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

import Router from './Router'

let MainRouter = null


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
            <View style={{ flex: 1 }}>
                <Router
                    //onNavigationStateChange={(prev, next) => NavStore.onNavigationStateChange(prev, next)}
                    ref={(ref) => {
                        NavStore.navigator = ref
                    }}
                />
                <Modal/>
                <StatusBar translucent={true} backgroundColor={'transparent'} barStyle="dark-content"/>
                <Loader/>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        navigationStore: state.navigationStore
    }
}

export default connect(mapStateToProps, {})(MainStack)
