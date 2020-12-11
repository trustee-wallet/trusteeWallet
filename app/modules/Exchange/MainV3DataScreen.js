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

import store from '../../store'
import SendTmpConstants from '../Send/elements/SendTmpConstants'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { BlocksoftTransferUtils } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import config from '../../config/config'
import _ from 'lodash'

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
            const allData = JSON.parse(event.nativeEvent.data)
            const { address, amount, orderHash, comment, inCurrencyCode, dataExchange, error, 
                backToOld, close, homePage, useAllFunds } = allData

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

            if (useAllFunds) {
                this.handleTransferAll(useAllFunds)
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
                this.exchangeV3(dataExchange)
            }

        } catch {
            Log.err('EXC/MainV3Screen.onMessage parse error ', event.nativeEvent)
        }
    }

    exchangeV3 = (dataExchange) => {
        
        const { accountList } = store.getState().accountStore
        const walletHash = store.getState().mainStore.selectedWallet.walletHash
        const account = accountList[walletHash]
        const { cryptoCurrencies } = store.getState().currencyStore
        const selectedCryptocurrency = _.find(cryptoCurrencies, { currencyCode: dataExchange.currencyCode})
        const selectedAccount = account[dataExchange.currencyCode]

        console.log('EXC/ManV3Screen dataExchange', JSON.stringify(dataExchange))

        // @todo simplify goto receipt with transfer all to one function
        const recipientAmount = dataExchange.amount.toString()
        const recipientAddress = dataExchange.address
        SendTmpConstants.COUNTED_FEES = dataExchange.useAllFunds ? SendTmpConstants.COUNTED_FEES : false
        SendTmpConstants.SELECTED_FEE = dataExchange.useAllFunds ? SendTmpConstants.SELECTED_FEE : false

        const dataToScreen = {
            amount: recipientAmount,
            address: recipientAddress,
            cryptoCurrency: selectedCryptocurrency,
            account: selectedAccount,
            useAllFunds: dataExchange.useAllFunds,
            toTransactionJSON: { 'bseOrderID': dataExchange.orderHash, 'comment': dataExchange.comment || '' },
            type: 'TRADE_SEND',
            apiVersion : 'v3',
            currencyCode: selectedCryptocurrency.currencyCode,
            providerType: dataExchange.providerType // 'FIXED' || 'FLOATING'
        }
        if (typeof dataExchange.memo !== 'undefined') {
            dataToScreen.memo = dataExchange.memo
        }

        if (!dataExchange.useAllFunds) {
            SendTmpConstants.PRESET = false
            SendTmpConstants.SELECTED_FEE = false
            SendTmpConstants.COUNTED_FEES = false
        } else {
            SendTmpConstants.PRESET = true
            SendTmpConstants.COUNTED_FEES = this.state.countedFees
            SendTmpConstants.SELECTED_FEE = this.state.selectedFee
            if (dataToScreen.providerType === 'FIXED') {
                // only one left
                if (SendTmpConstants.COUNTED_FEES && SendTmpConstants.COUNTED_FEES.fees.length > 1) {
                    SendTmpConstants.COUNTED_FEES.fees = [SendTmpConstants.SELECTED_FEE]
                    SendTmpConstants.COUNTED_FEES.selectedFeeIndex = 0
                }
            }
        }
        
        NavStore.goNext('ReceiptScreen', {
            ReceiptScreen: dataToScreen
        })
    }

    handleTransferAll = async (params) => {

        const currencyCode = params.currencyCode
        const address = params.address
        // const balance = params.balance
        const { selectedWallet } = store.getState().mainStore
        
        const {
            walletHash,
            walletUseUnconfirmed,
            walletAllowReplaceByFee,
            walletUseLegacy,
            walletIsHd
        } = selectedWallet

        const { accountList } = store.getState().accountStore
        const account = accountList[selectedWallet.walletHash][currencyCode]
        
        // ksu plz check address BTC (legacy/segwit) - default from v3 segwit
        // const { address, derivationPath, balance, unconfirmed, accountJson } = account
        const { derivationPath, balance, unconfirmed, accountJson } = account

        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            const addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })

            // @todo simplify goto receipt with transfer all to one function
            const countedFeesData = {
                currencyCode,
                walletHash,
                derivationPath,
                addressFrom: address,
                addressTo: addressToForTransferAll,
                amount: balance,
                unconfirmed: walletUseUnconfirmed,
                isTransferAll: true,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                useLegacy: walletUseLegacy,
                isHd: walletIsHd,
                accountJson
            }
            console.log('EXC.MainV3Screen.countedFeesData ', JSON.stringify(countedFeesData))
            
            const transferAllCount = await BlocksoftTransfer.getTransferAllBalance(countedFeesData)
            transferAllCount.feesCountedForData = countedFeesData
            let selectedFee
            if (typeof transferAllCount.selectedFeeIndex !== 'undefined' && transferAllCount.selectedFeeIndex >= 0) {
                selectedFee = transferAllCount.fees[transferAllCount.selectedFeeIndex]
            }

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferAllCount.selectedTransferAllBalance)

            SendTmpConstants.PRESET = true
            SendTmpConstants.COUNTED_FEES = transferAllCount
            SendTmpConstants.SELECTED_FEE = selectedFee

            this.setState({
                countedFees: transferAllCount,
                selectedFee
            })

            console.log('EXC.MainV3Screen.transferAllCount', JSON.stringify(transferAllCount))
            console.log('EXC.MainV3Screen.selectedFee', JSON.stringify(selectedFee))

            this.webref.postMessage(JSON.stringify({ "fees": { 'amount': amount } }))

            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferAllCount.selectedTransferAllBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('EXC.MainV3Screen.handleTransferAll', e)
            }

            Log.errorTranslate(e, 'EXC.MainV3Screen.handleTransferAll', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

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
