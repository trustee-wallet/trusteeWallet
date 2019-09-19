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
import GradientView from '../components/elements/GradientView'

let MainRouter = null

class MainStack extends Component {

    componentWillReceiveProps(nextProps, nextContext) {

        if(!this.props.navigationStore.initialRouteName != nextProps.navigationStore.initialRouteName){
            MainRouter = Router(nextProps.navigationStore)
        }
    }

    render() {

        const { navigationStore } = this.props

        if(!MainRouter){
            MainRouter = Router(navigationStore)
        }

        return (
            <View style={{ flex: 1 }}>
                <MainRouter
                    //onNavigationStateChange={(prev, next) => NavStore.onNavigationStateChange(prev, next)}
                    ref={(ref) => {
                        NavStore.navigator = ref
                    }}
                />
                <Modal/>
                <StatusBar translucent={true} backgroundColor={'transparent'} barStyle="light-content"/>
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
