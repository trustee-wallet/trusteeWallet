/**
 * @version 0.44
 * @author yura
 */
import React, { PureComponent } from 'react'
import { Animated, Linking, StyleSheet, View } from 'react-native'

import LottieView from 'lottie-react-native'

import axios from 'axios'
import _ from 'lodash'

import { WebView } from 'react-native-webview'
import NavStore from '@app/components/navigation/NavStore'

import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import Api from '@app/services/Api/ApiV3'

import store from '@app/store'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import config from '@app/config/config'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'


let CACHE_IS_ERROR = false
class SMSV3CodeScreen extends PureComponent {

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
            navigation: '',
            additionalData: {
                close: false
            }
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
            const getCode = new Function('tradeWebParam', 'Log', 'MarketingEvent', 'NavStore', 'setExchangeStatus', 'store', '_', 'state', 'CACHE_IS_ERROR', 'that', 'BlocksoftAxios', 'axios', 'config', prepare)
            return getCode(param, Log, MarketingEvent, NavStore, this.setExchangeStatus, store, _, this.state, CACHE_IS_ERROR, that, BlocksoftAxios, axios, config)
        } else if (type === 'MSG') {
            // eslint-disable-next-line no-new-func
            const getCode = new Function('e', 'Log', 'Linking', 'copyToClipboard', 'showModal', 'setExchangeStatus', 'CACHE_IS_ERROR', 'that', 'BlocksoftAxios', 'axios', 'config', prepare)
            return getCode(param, Log, Linking, copyToClipboard, showModal, this.setExchangeStatus, CACHE_IS_ERROR, that, BlocksoftAxios, axios, config)
        }
    }

    async componentDidMount() {
        const tradeWebParam = NavStore.getParamWrapper(this, 'tradeWebParam')
        this.prepareFunction(tradeWebParam.didMount, tradeWebParam, this, 'GENERAL')
    }

    onMessage(e) {
        const tradeWebParam = NavStore.getParamWrapper(this, 'tradeWebParam').message
        this.prepareFunction(tradeWebParam, e, this, 'MSG')
    }

    handleWebViewNavigationStateChange = async newNavState => {
        this.prepareFunction(this.state.navigation, newNavState, this, 'GENERAL')
    }

    async setExchangeStatus(body, data) {
        Api.setExchangeStatus(data)
    }

    closeAction = () => {
        Log.log('Trade.SMSV3CodeScreen.closeAction user click')

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('modal.titles.attention'),
            description: strings('modal.cancelPayment.description')
        }, () => {
            if (this.state.additionalData.close) {
                Log.log('Trade.SMSV3CodeScreen.backAction CLOSE')
                this.setExchangeStatus(null, { orderHash: this.state.orderHash, status: 'CLOSE' })
            }
            NavStore.reset('TabBar')
        })
    }

    backAction = () => {
        Log.log('Trade.SMSV3CodeScreen.backAction user click')

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('modal.titles.attention'),
            description: strings('modal.cancelPayment.description')
        }, () => {
            if (this.state.additionalData.close) {
                Log.log('Trade.SMSV3CodeScreen.backAction BACK')
                this.setExchangeStatus(null, { orderHash: this.state.orderHash, status: 'BACK' })
            }
            NavStore.goBack()
        })
    }

    render() {
        UpdateOneByOneDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Trade.SMSV3CodeScreen')

        const { scriptLoadEnd, status, link } = this.state

        Log.log('Trade.SMSV3CodeScreen.link status ' + status, link)

        CACHE_IS_ERROR = false
        return (
            <ScreenWrapper
                rightType={'close'}
                rightAction={this.closeAction}
                leftType={'back'}
                leftAction={this.backAction}
            >
                <View style={styles.wrapper__content}>
                    {
                        status !== 'SUCCESS' ?
                            <View style={styles.img}>
                                <LottieView style={{
                                    width: 200,
                                    height: 200,
                                    marginTop: -50
                                }} source={require('@assets/jsons/animations/loaderBlue.json')}
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
                        sharedCookiesEnabled
                        thirdPartyCookiesEnabled
                        allowsInlineMediaPlayback={true}
                        allowsBackForwardNavigationGestures={true}
                    />
                </View>
            </ScreenWrapper>
        )
    }
}

export default SMSV3CodeScreen

const styles = StyleSheet.create({
    wrapper__content: {
        flex: 1,
        position: 'relative'
    },
    img: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        backgroundColor: '#fff'
    },
    img__item: {
        width: 100,
        height: 100,
        marginTop: 100
    }
})
