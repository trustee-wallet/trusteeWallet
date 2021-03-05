/**
 * @version 0.30
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
    Keyboard,
    ActivityIndicator,
    SafeAreaView
} from 'react-native'

import Navigation from '../../components/navigation/Navigation'

import NavStore from '../../components/navigation/NavStore'

import ApiV3 from '../../services/Api/ApiV3'
import Log from '../../services/Log/Log'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import { WebView } from 'react-native-webview'
import { strings } from '../../services/i18n'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import AsyncStorage from '@react-native-community/async-storage'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransferUtils } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'

import config from '../../config/config'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'

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
            countedFees: false,
            selectedFee: false
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

        const navigationViewV3 = BlocksoftExternalSettings.getStatic('navigationViewV3') === 1
        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl,
                navigationViewV3
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

        const { isLight } = this.context

        if(this.webref) {
            if (this.state.homePage){
                this.setState({
                    homePage: false
                })
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
            }

            this.webref.goBack()
            return true
        }
    }

    onMessage(event) {

        const { isLight } = this.context

        try {
            const allData = JSON.parse(event.nativeEvent.data)
            const { address, amount, orderHash, comment, inCurrencyCode, dataExchange, error,
                backToOld, close, homePage, useAllFunds, goToNew } = allData

            Log.log('EXC/MainV3Screen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
                return
            }

            if (backToOld) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                AsyncStorage.setItem('isNewInterface', 'false')
                NavStore.goNext('HomeScreen')
            }

            if (goToNew) {
                NavStore.goNext('MarketScreen')
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
            }

            if (typeof homePage !== 'undefined' && (homePage === true || homePage === false)) {

                this.setState({
                    homePage
                })
                return
            }

            if (useAllFunds) {
                this.handleTransferAll(useAllFunds)
            }

            if (address && amount && orderHash) {
                const data = {
                    memo: false,
                    amount: amount,
                    address: address,
                    useAllFunds: false,
                    bseOrderId: orderHash,
                    comment: comment || '' ,
                    currencyCode: inCurrencyCode,
                    type: 'TRADE_SEND'
                }

                NavStore.goNext('ConfirmSendScreen', { confirmWebViewParam: data })
            }

            if (dataExchange) {
                this.exchangeV3(dataExchange)
            }

        } catch {
            Log.err('EXC/MainV3Screen.onMessage parse error ', event.nativeEvent)
        }
    }

    exchangeV3 = async (data) => {
        // console.log('Exchange/MainV3Screen dataExchange', JSON.stringify(data))
        const limits = JSON.parse(data.limits)
        const trusteeFee = JSON.parse(data.trusteeFee)

        const minCrypto = BlocksoftPrettyNumbers.setCurrencyCode(limits.currencyCode).makeUnPretty(limits.limits)

        try {
            Log.log('Exchange/MainV3Screen dataExchange', data)

            /*
            const bseOrderData = {
                amountReceived: null,
                depositAddress: data.address,
                exchangeRate: null,
                exchangeWayType: "EXCHANGE",
                inTxHash: null,
                orderHash: data.orderHash,
                orderId: data.orderHash,
                outDestination: data.outDestination,
                outTxHash: null,
                payinUrl: null,
                requestedInAmount: {amount: data.amount, currencyCode: data.currencyCode},
                requestedOutAmount: {amount: data.outAmount, currencyCode: data.outCurrency},
                status: "pending_payin"
            }

            SendActions.setUiType({
                ui: {
                    uiType: 'TRADE_SEND',
                    uiApiVersion: 'v3',
                    uiProviderType: data.providerType, // 'FIXED' || 'FLOATING'
                    uiInputAddress: typeof data.address !== 'undefined' && data.address && data.address !== ''
                },
                addData: {
                    gotoReceipt: true,
                    comment: data.comment || ''
                }
            })
            await SendActions.startSend({
                addressTo: data.address,
                amountPretty: data.amount.toString(),
                memo: data.memo,
                currencyCode: data.currencyCode,
                isTransferAll: data.useAllFunds,
                bseOrderId: data.orderHash || data.orderId,
                bseMinCrypto : minCrypto,
                bseTrusteeFee : {
                    value : trusteeFee.trusteeFee,
                    currencyCode : trusteeFee.currencyCode,
                    type : 'EXCHANGE',
                    from : data.currencyCode,
                    to : data.outCurrency
                },
                bseOrderData: bseOrderData
            })

             */
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('EXC/MainV3Screen exchangeV3', e)
            }
            throw e
        }
    }

    handleTransferAll = async (params) => {
        // console.log('EXC/MainV3DataScreen.handleTransferAll', JSON.stringify(params))
        const currencyCode = params.currencyCode
        const address = params.address
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            //const addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })
            const { transferBalance } = 0 /*await SendActions.countTransferAllBeforeStartSend({
                currencyCode,
                addressTo: addressToForTransferAll
            })*/
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferBalance, 'V3.exchangeAll')
            this.webref.postMessage(JSON.stringify({ fees: { countedFees: 'notUsedNotPassed', selectedFee : 'notUsedNotPassed', amount: amount ? amount : 0 } }))
            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('EXC/MainV3Screen.handleTransferAll', e)
            }

            this.webref.postMessage(JSON.stringify({serverError: true}))

            Log.errorTranslate(e, 'Trade/MainV3Screen.handleTransferAll', extend)

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.qrScanner.sorry'),
                description: e.message,
                error: e
            })
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

        this.init()
        MarketingAnalytics.setCurrentScreen('Exchange.MainV3Screen.Exchange')

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
                                // onLoadStart={StatusBar.setBarStyle("dark-content")}
                                // onLoad={StatusBar.setBarStyle("dark-content")}
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

MainV3DataScreen.contextType = ThemeContext

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
