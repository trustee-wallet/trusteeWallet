/**
 * @version 0.12
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    Text,
    View,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
    RefreshControl,
    Linking,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native'

import Navigation from '../../components/navigation/Navigation'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import ApiV3 from '../../services/Api/ApiV3'
import Log from '../../services/Log/Log'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import { WebView } from 'react-native-webview'
import { strings } from '../../services/i18n'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_INIT_KEY = false

class MainV3DataScreen extends Component {

    constructor() {
        super()
        this.state = {
            show: false,
            inited : false,
            apiUrl: 'https://testexchange.trustee.deals/waiting'
        }
    }

    init = async () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        setLoaderStatus(true)

        // here to do upload
        let apiUrl = await ApiV3.initData()

        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl
            }, () => {
                setTimeout(() => {
                    setLoaderStatus(false)
                }, 10)
            })
        }, 10)


    }

    onMessage(event) {
        try {
            const { address, amount, orderHash, comment, inCurrencyCode } = JSON.parse(event.nativeEvent.data)
            Log.log('EXC/MainV3Screen.onMessage parsed', event.nativeEvent.data)
            const data = {
                memo: false,
                amount: amount,
                address: address,
                useAllFunds: false,
                toTransactionJSON: { 'bseOrderID': orderHash, 'comment': comment || '' },
                currencyCode: inCurrencyCode,
                type: 'TRADE_SEND'
            }

            NavStore.goNext('ConfirmSendScreen', { confirmWebViewParam: data })
        } catch {
            Log.err('EXC/MainV3Screen.onMessage parse error ', event.nativeEvent)
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()

        this.init()
        firebase.analytics().setCurrentScreen('Exchange.MainV3Screen.Exchange')

        const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta)`

        return (
            <View style={styles.wrapper}>
                <Navigation
                    self={this}
                    handleSetState={this.handleSetState}
                    navigation={this.props.navigation}
                    isBack={false}
                    title={strings('tradeScreen.titleV3')}
                />
                <View style={{ flex: 1, position: 'relative', marginTop: 80 }}>
                    { this.state.show ?
                        <KeyboardAvoidingView
                            behavior={Platform.select({ ios: 'height', android: 'height' })}
                            enabled={false}
                            contentContainerStyle={{ flex: 1 }}
                            style={{ flexGrow: 1 }} >
                            <WebView
                                ref={webView => (this.webref = webView)}
                                javaScriptEnabled={true}
                                onNavigationStateChange={this.handleWebViewNavigationStateChange}
                                source={{ uri: this.state.apiUrl }}
                                injectedJavaScript={INJECTEDJAVASCRIPT}
                                scalesPageToFit={false}
                                scrollEnabled={false}
                                style={{ flex: 1 }}
                                renderError={(e) => {
                                    Log.err('Exchanger.WebViewMainScreen.render error ' + e)
                                }}
                                onError={(e) => {
                                    Log.err('Exchanger.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                }}
                                onHttpError={(e) => {
                                    Log.log('Exchanger.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                }}
                                onMessage={e => {
                                    this.onMessage(e)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('Exchanger.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('Exchanger.WebViewMainScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('Exchanger.WebViewMainScreen.on start load with request ' + e.navigationType)
                                    return true
                                }}
                                useWebKit={true}
                                startInLoadingState={true}
                            />
                        </KeyboardAvoidingView> : null }
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        mainStore: state.mainStore,
        wallet: state.mainStore.selectedWallet,
        selectedInAccount: state.mainStore.selectedInAccount,
        selectedOutAccount: state.mainStore.selectedOutAccount,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainV3DataScreen)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#fff'
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',

        width: '100%',
        paddingHorizontal: 15
    },
    top__item: {
        flex: 1
    },
    top__item_space: {
        minWidth: 7
    },
    titleText: {
        paddingTop: 24,
        marginLeft: 15,
        paddingBottom: 8,

        fontSize: 16,
        color: '#999999'
    },
    titleText_disabled: {
        color: '#DADADA'
    },
    btn: {
        marginTop: 10,
        marginHorizontal: 30,
        marginBottom: 40
    }
}
