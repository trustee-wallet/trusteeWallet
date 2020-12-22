/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Animated, Dimensions, Linking, View } from 'react-native'

import LottieView from 'lottie-react-native'

import { WebView } from 'react-native-webview'
import NavStore from '../../components/navigation/NavStore'

import firebase from 'react-native-firebase'

import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Header from '../../components/elements/new/Header'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import Api from '../../services/Api/ApiV3'

import store from '../../store'
import _ from 'lodash'

import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import config from '../../config/config'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_IS_ERROR = false
class SMSV3CodeScreen extends Component {

    constructor() {
        super()
        this.state = {
            status: 'NEW',
            loaded: '',
            link: '',
            orderHash: null,
            receiptPay: true,
            lastStep: true,
            scriptLoadEnd: '',
            progress: new Animated.Value(0),
            url: '',
            currencySelect: null,
            sign: {},
            api: '',
            navigation: ''
        }
        this.webref = React.createRef()
    }

    handleStartAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(this.state.progress, {
                    toValue: 1,
                    duration: 5000
                }),
                Animated.timing(this.state.progress, {
                    toValue: 0,
                    duration: 5000
                })
            ]),
            {
                iterations: 50
            }
        ).start()
    }

    handleState(obj) {
        this.setState({
            ...obj
        })
    }

    prepareFunction(dataString, param, that, type) {
        let prepare = JSON.parse(JSON.stringify(dataString))
        let item
        for (item of prepare) {
            if (item !== '{')
                prepare = prepare.substr(1)
            else
                break
        }

        prepare = prepare.substr(1)
        prepare = prepare.substring(0, prepare.length - 1)

        if (type === 'GENERAL') {
            // eslint-disable-next-line no-new-func
            const getCode = new Function('tradeWebParam', 'Log', 'MarketingEvent', 'NavStore', 'setExchangeStatus', 'store', '_', 'state', 'CACHE_IS_ERROR', 'that', prepare)
            return getCode(param, Log, MarketingEvent, NavStore, this.setExchangeStatus, store, _, this.state, CACHE_IS_ERROR, that)
        } else if (type === 'MSG') {
            // eslint-disable-next-line no-new-func
            const getCode = new Function('e', 'Log', 'Linking', 'copyToClipboard', 'showModal', 'setExchangeStatus', 'CACHE_IS_ERROR', 'that', prepare)
            return getCode(param, Log, Linking, copyToClipboard, showModal, this.setExchangeStatus, CACHE_IS_ERROR, that)
        }
    }

    async componentDidMount() {
        const tradeWebParam = this.props.navigation.getParam('tradeWebParam')
        this.prepareFunction(tradeWebParam.didMount, tradeWebParam, this, 'GENERAL')
    }

    onMessage(e) {
        const tradeWebParam = this.props.navigation.getParam('tradeWebParam').message
        this.prepareFunction(tradeWebParam, e, this, 'MSG')
    }

    handleWebViewNavigationStateChange = async newNavState => {
        this.prepareFunction(this.state.navigation, newNavState, this, 'GENERAL')
    }

    async setExchangeStatus(body, orderHash, status) {
        Api.setExchangeStatus(orderHash, status)
    }

    closeAction = () => {
        this.setExchangeStatus(this.state.api, this.state.orderHash, 'CLOSE')
        NavStore.goBack()
    }

    backAction = () => {
        this.setExchangeStatus(this.state.api, this.state.orderHash, 'BACK')
        NavStore.goBack()
    }

    render() {
        UpdateOneByOneDaemon.pause()
        firebase.analytics().setCurrentScreen('Trade.SMSV3CodeScreen')

        const { scriptLoadEnd, status, link } = this.state

        Log.log('Trade.SMSV3CodeScreen.link status ' + status, link)

        CACHE_IS_ERROR = false
        return (
            <View style={{ ...styles.wrapper }}>
                <Header
                    rightType="close"
                    rightAction={this.closeAction}
                    leftType={'back'}
                    leftAction={this.backAction}
                />
                <View style={styles.wrapper__content}>
                    {
                        status !== 'SUCCESS' ?
                            <View style={styles.img}>
                                <LottieView style={{
                                    width: 200,
                                    height: 200,
                                    marginTop: -50
                                }} source={require('../../assets/jsons/animations/loaderBlue.json')}
                                    progress={this.state.progress} />
                            </View> : null
                    }
                    <WebView
                        ref={r => (this.webref = r)}
                        javaScriptEnabled={true}
                        onNavigationStateChange={this.handleWebViewNavigationStateChange}
                        source={{ uri: link }}
                        style={{ flex: 1, maxHeight: status !== 'SUCCESS' ? 0 : 10000 }}
                        onLoadEnd={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                            this.webref.injectJavaScript(scriptLoadEnd)
                        }}
                        renderError={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.render error ' + e)
                        }}
                        onError={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                        }}
                        onHttpError={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                        }}
                        onMessage={(e) => {
                            this.onMessage(e)
                        }}
                        onLoadProgress={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                        }}
                        onContentProcessDidTerminate={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.on content terminate ' + e.nativeEvent.title)
                        }}
                        onShouldStartLoadWithRequest={(e) => {
                            Log.log('Trade.SMSV3CodeScreen.on start load with request ' + e.navigationType)
                            return true
                        }}
                        useWebKit={true}
                        startInLoadingState={true}
                    />
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        exchange: state.exchangeStore.data,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SMSV3CodeScreen)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#fff'
    },
    wrapper__content: {
        flex: 1,

        position: 'relative',

        marginTop: 80
    },
    img: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: WINDOW_HEIGHT,
        zIndex: 2,
        backgroundColor: '#fff'
    },
    img__item: {
        width: 100,
        height: 100,
        marginTop: 100
    }
}