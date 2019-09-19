/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Image, View, Text, Platform } from 'react-native'

import {
    UIActivityIndicator,
    MaterialIndicator
} from 'react-native-indicators'

import GradientView from '../../components/elements/GradientView'

import NavStore from '../../components/navigation/NavStore'

import Log from '../../services/Log/Log'

import App from '../../appstores/Actions/App/App'
import firebase from "react-native-firebase"


class InitScreen extends Component {

    constructor(){
        super()
        this.state = {
            init: false
        }
    }

    componentWillMount() {
        Log.log('InitScreen is mounted')
        App.init()
    }

    componentWillReceiveProps(props) {
        Log.log('InitScreen is receiving props')
        // @debug for raw testing
        // NavStore.reset('WalletCreateScreen')
        if (props.data.init === true && this.props.data.init !== props.data.init) {
            if (+props.settings.data.lock_screen_status) {
                Log.log('InitScreen navigated to LockScreen')
                NavStore.reset('LockScreen')
            } else {
                Log.log('InitScreen navigated to DashboardStack')

                // setTimeout(() => {
                    NavStore.reset('DashboardStack')
                // }, 3000)
            }
        } else {
            Log.log('InitScreen will be here till DB inited')
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('InitScreen.index')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Image
                    style={styles.image}
                    source={require('../../assets/images/logo.png')}
                />
                <View style={{ marginTop: -70, marginBottom: 60 }}>
                    { Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#3E3453' /> : <MaterialIndicator size={30} color='#3E3453' /> }
                </View>
                <View style={{ position: 'relative' }}>
                    <Text style={{
                        position: 'relative',
                        fontSize: 30,
                        fontFamily: 'SFUIDisplay-Bold',
                        color: '#F24B93',
                        textAlign: 'center',
                        zIndex: 2
                    }}>
                        TRUSTEE  WALLET
                    </Text>
                    <Text style={{
                        position: 'absolute',
                        top: 1,
                        left: 1,

                        width: '100%',

                        fontSize: 30,
                        fontFamily: 'SFUIDisplay-Bold',
                        color: '#3E3453',
                        textAlign: 'center',
                        zIndex: 1
                    }}>
                        TRUSTEE  WALLET
                    </Text>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore,
        data: state.mainStore
    }
}

export default connect(mapStateToProps, {})(InitScreen)

const styles_ = {
    array: ['#fff', '#F8FCFF'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 30,
        paddingRight: 30
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 34,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040'
    },
    image: {
        alignSelf: 'center',
        width: 148,
        height: 180,
        marginBottom: 147
    },
    button: {
        marginBottom: 20
    }
}
