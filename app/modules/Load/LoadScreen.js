/**
 * @version 0.43
 */
import React from 'react'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'

import NavStore from '@app/components/navigation/NavStore'

import App from '@app/appstores/Actions/App/App'

import { connect } from 'react-redux'

import config from '@app/config/config'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { getInit, getInitError } from '@app/appstores/Stores/Init/selectors'


class LoadScreen extends React.PureComponent {

    constructor() {
        super()
        this.state = {
            status: ''
        }
    }

    componentDidMount() {
        try {
            this.statusTimeout = setTimeout(() => {
                this.setState({
                    status: App.initStatus + ' ' + App.initError
                })
            }, 10000)
        } catch (e) {
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.init === true) {
            clearTimeout(this.statusTimeout)
            if (this.props.lockScreenStatus * 1 > 0) {
                NavStore.reset('LockScreen')
            } else {
                NavStore.reset('HomeScreen')
            }
        }
    }

    render() {
        MarketingAnalytics.setCurrentScreen('LoadScreen.index')
        if (App.initStatus === 'resetError') {
            App.init({source : 'LoadScreen.render'})
        }
        return (
            <View style={styles.wrapper}>
                <View style={{ position: 'absolute', top: 20, left: 20 }}>
                    <Text style={{ marginTop: 40 }}>
                        {this.state.status}
                    </Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Image
                        style={styles.image}
                        source={require('../../assets/images/logo.png')}
                    />
                    <View style={{ marginTop: -70, marginBottom: 60 }}>
                        {Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#3E3453'/> : <MaterialIndicator size={30} color='#3E3453'/>}
                    </View>
                    <View style={{ position: 'relative' }}>
                        <Text style={styles.appName__text} numberOfLines={1}>
                            TRUSTEE WALLET
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
                            TRUSTEE WALLET
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
                        {'#' + config.version.hash + ' | ' + config.version.code}
                    </Text>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus: getLockScreenStatus(state),
        init : getInit(state),
        initError : getInitError(state)
    }
}

export default connect(mapStateToProps, {})(LoadScreen)


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: '#f2f2f2'
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
    },
    appName__text: {
        position: 'relative',
        fontSize: 30,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#F24B93',
        textAlign: 'center',
        zIndex: 2
    }
})
