/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import {
    View,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    StatusBar,
    Keyboard,
    ActivityIndicator,
    SafeAreaView
} from 'react-native'



import NavStore from '../../components/navigation/NavStore'

import ApiV3 from '../../services/Api/ApiV3'
import Log from '../../services/Log/Log'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import { WebView } from 'react-native-webview'
import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_INIT_KEY = false

class CheckV3DataScreen extends Component {

    constructor() {
        super()
        this.state = {
            show: false,
            inited: false,
            apiUrl: 'https://testexchange.trustee.deals/waiting',
        }
    }

    init = async (orderHash) => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        let apiUrl = await ApiV3.getMobileCheck(orderHash)

        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl
            })
        }, 10)

    }

    componentDidMount() {
        const { isLight } = this.context

        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.addListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( isLight ? 'dark-content' : 'light-content' );
    }

    componentWiilUnmount() {
        const { isLight } = this.context

        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.removeListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( isLight ? 'dark-content' : 'light-content' );
    }

    onKeyboardShow = () => {
        const { isLight } = this.context
        StatusBar.setBarStyle( isLight ? 'dark-content' : 'light-content' );
    }

    handlerBackPress = () => {
        if(this.webref) {
            NavStore.goBack()
        }
    }

    onMessage(event) {
        try {
            const { close, error } = JSON.parse(event.nativeEvent.data)

            Log.log('BSE/CheckV3DataScreen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                NavStore.goBack()
                return
            }

        } catch {
            Log.err('BSE/CheckV3DataScreen.onMessage parse error ', event.nativeEvent)
        }
    }

    modal() {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: null,
            description: strings('modal.modalV3.description')
        },() => {
            NavStore.goBack()
        })
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size="large"
                style={{ backgroundColor: colors.common.header.bg, position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center' }}
                color={this.context.colors.common.text2}
            />
        )
    }

    render() {
        UpdateOneByOneDaemon.pause()

        const { colors, isLight } = this.context

        const orderHash = this.props.navigation.getParam('orderHash')

        this.init(orderHash)
        MarketingAnalytics.setCurrentScreen('BSE/CheckV3DataScreen')

        const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta)`

        return (
            <View style={styles.wrapper}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />
                <View style={{ flex: 1, position: 'relative', marginTop: 0 }}>
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
                                    Log.err('BSE/CheckV3DataScreen.render error ' + e)
                                    this.modal()
                                    NavStore.goBack()
                                }}
                                onError={(e) => {
                                    Log.err('BSE/CheckV3DataScreenon error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goBack()
                                }}
                                onHttpError={(e) => {
                                    Log.log('BSE/CheckV3DataScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goBack()
                                }}
                                onMessage={e => {
                                    this.onMessage(e)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('BSE/CheckV3DataScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('BSE/CheckV3DataScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('BSE/CheckV3DataScreen.on start load with request ' + e.navigationType)
                                    return true
                                }}
                                onLoadStart={StatusBar.setBarStyle( isLight ? 'dark-content' : 'light-content' )}
                                onLoad={StatusBar.setBarStyle( isLight ? 'dark-content' : 'light-content' )}
                                useWebKit={true}
                                startInLoadingState={true}
                                renderLoading={this.renderLoading}
                            />
                        </KeyboardAvoidingView> :
                        <>
                            {this.renderLoading()}
                        </> }
                </View>
            </View>
        )
    }
}

CheckV3DataScreen.contextType = ThemeContext

export default CheckV3DataScreen

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
