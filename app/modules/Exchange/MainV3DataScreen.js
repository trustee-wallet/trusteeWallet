/**
 * @version 0.13
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    View,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    StatusBar,
    Keyboard
} from 'react-native'

import Navigation from '../../components/navigation/Navigation'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import ApiV3 from '../../services/Api/ApiV3'
import Log from '../../services/Log/Log'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import { WebView } from 'react-native-webview'
import { strings } from '../../services/i18n'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import AsyncStorage from '@react-native-community/async-storage'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_INIT_KEY = false

class MainV3DataScreen extends Component {

    constructor() {
        super()
        this.state = {
            show: false,
            inited: false,
            apiUrl: 'https://testexchange.trustee.deals/waiting',
            navigationViewV3 : true,
            homePage: false,
        }
    }

    init = async () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        let apiUrl = await ApiV3.initData('EXCHANGE')
        console.log(apiUrl)
        const navigationViewV3 = (await BlocksoftExternalSettings.get('navigationViewV3')) === 1
        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl,
                navigationViewV3
            })
        }, 10)

    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.addListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( 'dark-content' );
    }

    componentWiilUnmount() {
        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.removeListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( 'dark-content' );
    }

    onKeyboardShow = () => {
        StatusBar.setBarStyle( 'dark-content' );
    }

    handlerBackPress = () => {
        if(this.webref) {
            if (this.state.homePage){
                this.setState({
                    homePage: false
                })
                NavStore.goNext('HomeScreen')
            }

            this.webref.goBack()
            return true
        }
    }

    onMessage(event) {
        try {
            const { address, amount, orderHash, comment, inCurrencyCode, dataExchange, error, backToOld, close, homePage } = JSON.parse(event.nativeEvent.data)

            Log.log('EXC/MainV3Screen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                NavStore.goNext('HomeScreen')
                return
            }

            if (backToOld) {
                AsyncStorage.setItem('isNewInterface', 'false')
                NavStore.goNext('HomeScreen')
            }

            if (typeof homePage !== 'undefined' && (homePage === true || homePage === false)) {

                this.setState({
                    homePage
                })
                return
            }

            if (address && amount && orderHash) {
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
            }

            if (dataExchange) {
                const data = {
                    memo: dataExchange.memo,
                    amount: dataExchange.amount,
                    address: dataExchange.address,
                    useAllFunds: dataExchange.useAllFunds,
                    toTransactionJSON: { 'bseOrderID': dataExchange.orderHash, 'comment': dataExchange.comment || '' },
                    currencyCode: dataExchange.currencyCode,
                    type: 'TRADE_SEND'
                }

                NavStore.goNext('ConfirmSendScreen', { confirmWebViewParam: data })
            }

        } catch {
            Log.err('EXC/MainV3Screen.onMessage parse error ', event.nativeEvent)
        }
    }

    modal() {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: null,
            description: strings('modal.modalV3.description')
        },() => {
            NavStore.goNext('HomeScreen')
        })
    }

    render() {
        UpdateOneByOneDaemon.pause()

        this.init()
        firebase.analytics().setCurrentScreen('Exchange.MainV3Screen.Exchange')

        const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta)`

        return (
            <View style={styles.wrapper}>
                <View style={{ flex: 1, position: 'relative', marginTop: this.state.navigationViewV3 ? 80 : 0 }}>
                    {this.state.show ?
                        <KeyboardAvoidingView
                            behavior={Platform.select({ ios: 'height', android: 'height' })}
                            enabled={false}
                            hideKeyboardAccessoryView={false}
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
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
                                }}
                                onError={(e) => {
                                    Log.err('Exchanger.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
                                }}
                                onHttpError={(e) => {
                                    Log.log('Exchanger.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
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
                                onLoadStart={StatusBar.setBarStyle("dark-content")}
                                onLoad={StatusBar.setBarStyle("dark-content")}
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
