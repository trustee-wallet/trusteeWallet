/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Image, View, Text, Platform } from 'react-native'
import firebase from 'react-native-firebase'
import {
    UIActivityIndicator,
    MaterialIndicator
} from 'react-native-indicators'

import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'

import App from '../../appstores/Actions/App/App'

import Log from '../../services/Log/Log'

import config from '../../config/config'

import Theme from '../../themes/Themes'
let styles


class InitScreen extends Component {

    constructor(){
        super()
        this.state = {
            init: false,
            initError : false
        }
    }

    componentWillMount() {
        Log.log('InitScreen is mounted')
        styles = Theme.getStyles().initScreenStyles
    }

    componentDidMount() {
        try {
            App.init(false)
        } catch (e) {
            this.setState({
                initError : e.message
            })
        }
    }

    componentWillReceiveProps(props) {
        Log.log('InitScreen is receiving props')
        // @debug for raw testing
        // NavStore.reset('WalletCreateScreen')
        if (props.data.initError) {
            this.setState({
                initError : props.data.initError
            })
        }
        if (props.data.init === true) { //this one is making "freezing"//&& this.props.data.init !== props.data.init) {
            if (+props.settings.data.lock_screen_status) {
                Log.log('InitScreen navigated to LockScreen')
                NavStore.reset('LockScreen')
            } else {
                Log.log('InitScreen navigated to DashboardStack')
                NavStore.reset('DashboardStack')
            }
        } else {
            Log.log('!!!!!!!!!!!!!!!!InitScreen will be here till DB inited')
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('InitScreen.index')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Image
                        style={styles.image}
                        source={styles.image__url.path}
                    />
                    <View style={{ marginTop: -70, marginBottom: 60 }}>
                        { Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#3E3453' /> : <MaterialIndicator size={30} color='#3E3453' /> }
                    </View>
                    <View style={{ position: 'relative' }}>
                        <Text style={styles.appName__text} numberOfLines={1}>
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
                        }} numberOfLines={1}>
                            TRUSTEE  WALLET
                        </Text>
                        {
                            this.state.initError ?
                                <Text>{this.state.initError}</Text>
                                : null
                        }
                    </View>
                </View>
                <View style={{ marginTop: 'auto' }}>
                    <Text style={{ marginBottom: 10, opacity: .5, textAlign: 'center', fontFamily: 'SFUIDisplay-Regular', fontSize: 10, color: '#3E3453' }}>
                        { '#' + config.version.hash + ' | ' + config.version.code }
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
    array: ['#fff', '#fff'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
