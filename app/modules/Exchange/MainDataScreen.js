/**
 * @version 0.9
 * @misha to review
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Dimensions, View, Animated, Keyboard } from 'react-native'

import Navigation from '../../components/navigation/Navigation'

import AsyncStorage from '@react-native-community/async-storage'
import firebase from 'react-native-firebase'
import WebView from 'react-native-webview'
import LottieView from 'lottie-react-native'
import axios from 'axios'

import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

import accountDS from '../../appstores/DataSource/Account/Account'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import Log from '../../services/Log/Log'
import { setSendData } from '../../appstores/Stores/Send/SendActions'
import NavStore from '../../components/navigation/NavStore'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

const CACHE = {
    NOTHING_DONE: '',
    ON_MESSAGE: ''
}

class MainDataScreen extends Component {

    constructor() {
        super()

        this.state = {
            confirmTransaction: true,
            suggestedResend: 0,
            goneToSend: 0,
            dataToSend: false,
            script: `
                 
                document.getElementsByClassName("header")[0].style = 'display: none;';
                document.getElementsByClassName("footer")[0].style = 'display: none;';
                
                setTimeout(function () {
                    if (typeof document.getElementsByClassName('exchange-step--button')[0] === 'undefined' && typeof document.getElementsByClassName('tx-page--review-block')[0] === 'undefined') {
                          var s = document.createElement('h1');
                          var agent = typeof window.navigator.userAgent !== 'undefined' ? window.navigator.userAgent : 'none';
                          s.innerHTML = 'Internet connection is bad or WebView need to be <a href="https://www.apkmirror.com/apk/google-inc/android-system-webview/">updated</a> as current version ' + agent + ' is not supported';
                          document.body.appendChild(s);
                          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ALL_LOADED", url : window.location, agent : window.navigator.userAgent, html : document.body.innerHTML.toString().substr(0, 500)}));
                          
                        //window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DOESNT_SUPPORT", agent : window.navigator.userAgent }));
                    } else {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ALL_LOADED", url : window.location, html : document.body.innerHTML.toString().substr(0, 500)}));
                    }
                }, 5000)
                
                function setNativeValue(element, value) {
                    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
                    const prototype = Object.getPrototypeOf(element);
                    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
                
                    if (valueSetter && valueSetter !== prototypeValueSetter) {
                      prototypeValueSetter.call(element, value);
                    } else {
                      valueSetter.call(element, value);
                    }
                }
                
                
                document.addEventListener("message", function(event) {
                    var data1 = JSON.parse(event.data);
                
                    if(data1.type === "SET_BALANCE"){
                    
                        var isExist = document.getElementById('myBalance');
                        
                        var currencyCode1 = window.location.search.split('=')[2].split('&')[0].toUpperCase();
                        
                        var currency = data1.currencies[currencyCode1]
                        
                        if(isExist !== null) {
                            isExist.remove();
                        }
                        var toAddBalance = document.getElementsByClassName('exchange-input__light')[0];
                        
                        var newDiv = document.createElement('div');
                        newDiv.innerHTML = '<div id="myBalance" class="exchange--recipient"><h3>' + 'Баланс: ' + currency.balancePretty + ' ' + currency.currencySymbol + '</h3></div>';
                        toAddBalance.parentNode.insertBefore(newDiv, toAddBalance);
                    
                    }
                
                    if(data1.type === "PASTE_ADDRESS"){
                        setNativeValue(document.getElementsByName("destination")[0], data1.data.account.address);
                        
                        document.getElementsByName("destination")[0].dispatchEvent(new Event('input', { bubbles: true }));
                        document.activeElement && document.activeElement.blur();
                    }
                
                    if(data1.type === "SCROLL_TO_BOTTOM"){
                        typeof window != 'undefined' ? window.scrollTo(-200, 1000) : null;
                    }
                    
                    if (data1.type === "YES_NO_TO_BOTTOM") {
                         typeof window != 'undefined' ? window.scrollTo(0, 120) : null;
                    }
                });
          
                
                window.addEventListener("message", function(event) {
                    var data2 = JSON.parse(event.data);
                
                    if(data2.type === "SET_BALANCE"){
                    
                        var isExist = document.getElementById('myBalance');
                        
                        var currencyCode2 = window.location.search.split('=')[2].split('&')[0].toUpperCase();
                        
                        var currency = data2.currencies[currencyCode2]
                        
                        if(isExist !== null) {
                            isExist.remove();
                        }
                        var toAddBalance = document.getElementsByClassName('exchange-input__light')[0];
                        
                        var newDiv = document.createElement('div');
                        newDiv.innerHTML = '<div id="myBalance" class="exchange--recipient"><h3>' + 'Баланс: ' + currency.balancePretty + ' ' + currency.currencySymbol + '</h3></div>';
                        toAddBalance.parentNode.insertBefore(newDiv, toAddBalance);
                    
                    }
                
                    if(data2.type === "PASTE_ADDRESS"){
                        setNativeValue(document.getElementsByName("destination")[0], data2.data.account.address);
                        
                        document.getElementsByName("destination")[0].dispatchEvent(new Event('input', { bubbles: true }));
                        document.activeElement && document.activeElement.blur();
                    }
                
                    if(data2.type === "SCROLL_TO_BOTTOM"){
                        typeof window != 'undefined' ? window.scrollTo(-200, 1000) : null;
                    }
                    
                });
         
                
                function addListener2() {
                
                     if (document.getElementsByName("destination")[0].getAttribute('listener') !== 'true') {

                        document.getElementsByName("destination")[0].setAttribute('listener', 'true');
            
                        document.getElementsByName("destination")[0].addEventListener("focus", function () {
            
                            var el = document.getElementsByClassName("exchange-input exchange-input__light")[1];
                            el = el.getElementsByClassName("exchange-input--currency")[0];
                            el = el.textContent;
            
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RECEIVE_ADDRESS_INPUT_FOCUS", currencySymbol: el }));
                        }, true);
                    }
                }
                
                
                setInterval(function () {
                   var exchangeId = window.location.href.split("/");
                   exchangeId = exchangeId[exchangeId.length - 1];
                
                   if(window.location.href.includes("txs")){ 
                       window.ReactNativeWebView.postMessage(JSON.stringify({ type: "CONFIRM_TRANSACTION", exchangeId: exchangeId }));
                   }
                   
                   try {
                        var removeEl = document.querySelector('.exchange--recipient');
                        removeEl = removeEl.getElementsByTagName('span');
                        removeEl[0].remove();
                    } catch (e) {
                    
                    };  
                
                }, 1000)
                
                
                setTimeout(function() { 
           
                    setInterval(function() {
                        try {
                            
                              addListener2();
                           
                            } catch (e) {}
                    }, 500);
                }, 3000)
                
                
    
                setTimeout(function() {
                   typeof window != 'undefined' ? window.scrollTo(-200, -200) : null; 
                }, 5000); 
                 
            `,
            progress: new Animated.Value(0),
            show: true,
            status: null,
            type: null,
            interval: {}
        }


        this.exchangeId = null
        this.account = null
        this.cryptocurrency = null
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {

        setLoaderStatus(false)

        const param = this.props.navigation.getParam('exchangeMainDataScreenParam')

        this.setState({
            source: param.url,
            type: param.type
        })
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            try {

                const { selectedWallet, accountStore } = this.props

                let accountList = JSON.parse(JSON.stringify(accountStore.accounts))

                accountList = accountList[selectedWallet.walletHash]
                accountList['USDTERC20'] = {
                    ...accountList['ETH_USDT'],
                    currencyCode: 'USDTERC20'
                }

                this.webRef.postMessage(JSON.stringify({ type: 'SET_BALANCE', currencies: accountList }))
            } catch {
            }
        }, 1000)

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

        setTimeout(() => {
            if (this.state.status !== 'DOESNT_SUPPORT') {
                this.setState({
                    status: 'LOAD_END'
                })
            }
        }, 13000)
    }

    onMessage = async (event) => {
        const text2 = 'Exchange/MainDataScreen.on message ' + event.nativeEvent.data + JSON.stringify({
            confirmTransaction: this.state.confirmTransaction,
            suggestedResend: this.state.suggestedResend,
            show: this.state.show,
            source: this.state.source,
            status: this.state.status,
            type: this.state.type
        })
        if (CACHE.ON_MESSAGE !== text2) {
            CACHE.ON_MESSAGE = text2
            Log.log(text2)
        }

        try {

            const selectedWallet = this.props.selectedWallet
            const data = JSON.parse(event.nativeEvent.data)

            let accounts = JSON.parse(JSON.stringify(this.props.accountStore.accounts))
            let account
            if (data.currencySymbol === 'USDTERC20') {
                account = accounts[selectedWallet.walletHash]['ETH_USDT']
            } else {
                account = accounts[selectedWallet.walletHash][data.currencySymbol]
            }

            if (data.type === 'DOESNT_SUPPORT') {
                this.setState({
                    status: 'DOESNT_SUPPORT'
                })
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.sorryYourDeviceDoesntSupportModal.description', { agent: data.agent })
                }, () => {
                    NavStore.goBack()
                    NavStore.goBack()
                })
                Log.log('Exchange.MainDataScreen.on message no support ' + data.agent)
                return
            } else if (data.type === 'RECEIVE_ADDRESS_INPUT_FOCUS') {
                if (typeof account !== 'undefined') {
                    if (account.currencyCode === 'BTC') {
                        accounts = await accountDS.getAccountData({
                            walletHash: selectedWallet.walletHash,
                            currencyCode: account.currencyCode,
                            splitSegwit: true
                        })
                        accounts = accounts.segwit
                    } else {
                        accounts = await accountDS.getAccountData({
                            walletHash: selectedWallet.walletHash,
                            currencyCode: account.currencyCode
                        })
                    }

                    showModal({
                        type: 'YES_NO_MODAL',
                        icon: 'WARNING',
                        title: strings('exchangeScreen.receiveAddressModal.title'),
                        description: strings('exchangeScreen.receiveAddressModal.description1') + ' "' + selectedWallet.walletName + '" ' + strings('exchangeScreen.receiveAddressModal.description2') + ' "' + accounts[0].address.slice(0, 6) + '...' + accounts[0].address.slice(accounts[0].address.length - 4, accounts[0].address.length) + '"',
                        noCallback: () => {
                            Log.log('Exchange.MainDataScreen.on message selectAccount noCallback')
                            this.webRef.postMessage(JSON.stringify({ type: 'SCROLL_TO_BOTTOM' }))
                        }
                    }, async () => {
                        Log.log('Exchange.MainDataScreen.on message selectAccount modal ok', accounts[0])
                        this.webRef.postMessage(JSON.stringify({
                            type: 'PASTE_ADDRESS',
                            data: { account: accounts[0] }
                        }))
                        Keyboard.dismiss()
                    })
                } else {
                    Log.log('Exchange.MainDataScreen.on message noAccount for wallet ' + selectedWallet.walletHash + ' ' + data.currencySymbol, accounts)
                }
                return
            }

            if (this.state.type === 'CREATE_NEW_ORDER' && data.type === 'CONFIRM_TRANSACTION' && this.state.confirmTransaction) {
                this.state.confirmTransaction = false

                setLoaderStatus(true)

                setTimeout(async () => {
                    try {
                        await this._loadOrdersAndGotoPayment(data, selectedWallet, 'inTimeout')

                    } catch (e) {
                        Log.err('Exchange.MainDataScreen.inTimeout error ' + e.message)
                    }
                }, 5000)
                return
            }

            if (this.state.type === 'VIEW_ORDER' && data.type === 'CONFIRM_TRANSACTION' && this.state.status === 'LOAD_END' && !this.state.suggestedResend && this.state.confirmTransaction) {
                this.state.suggestedResend = new Date().getTime()

                await this._loadOrdersAndGotoPayment(data, selectedWallet, 'inResend')

                return
            }

            const text = 'Exchange.MainDataScreen.onMessage nothing done ' + JSON.stringify({
                confirmTransaction: this.state.confirmTransaction,
                suggestedResend: this.state.suggestedResend,
                goneToSend: this.state.goneToSend,
                show: this.state.show,
                dataType: data.type,
                data: data,
                source: this.state.source,
                status: this.state.status,
                type: this.state.type
            })
            if (CACHE.NOTHING_DONE !== text) {
                CACHE.NOTHING_DONE = text
                Log.log(text)
            }


        } catch (e) {
            Log.err('Exchange.MainDataScreen.onMessage error ' + e.message)
        }
    }

    async _loadOrdersAndGotoPayment(data, selectedWallet, source) {
        if (typeof data === 'undefined' || !data || typeof data.exchangeId === 'undefined') {
            Log.err('Exchange.MainDataScreen._load ' + source + ' data error ' + JSON.stringify(data))
            return false
        }
        const link = `https://changenow.io/api/v1/transactions/${data.exchangeId}/96b632f9a3f2271bd6b3026a7aad09bfa6aa9dbbad668078c92f662b9f270413`
        Log.log('Exchange.MainDataScreen._load ' + source + ' will load link ' + link)

        const res = await BlocksoftAxios.get(link)
        Log.log('Exchange.MainDataScreen._load ' + source + ' loaded from link ' + link, res.data)

        const exchangeOrders = await AsyncStorage.getItem('EXCHANGE_ORDERS')

        Log.log('Exchange.MainDataScreen._load ' + source + ' loaded from store ', exchangeOrders)

        let exchangeOrdersToSave = []

        let resave = false
        if (exchangeOrders === null) {
            exchangeOrdersToSave.push(res.data)
            resave = true
        } else {
            try {
                exchangeOrdersToSave = JSON.parse(exchangeOrders)
            } catch (e) {
                exchangeOrdersToSave = []
            }
            const unique = {}
            if (exchangeOrdersToSave.length > 0) {
                let tmp
                for (tmp of exchangeOrdersToSave) {
                    if (typeof unique[tmp.id] === 'undefined') {
                        unique[tmp.id] = 1
                    }
                }
            }
            if (typeof unique[res.data.id] === 'undefined') {
                exchangeOrdersToSave.push(res.data)
                resave = true
            }
        }

        if (resave) {
            Log.log('Exchange.MainDataScreen._load ' + source + ' saved to store ', exchangeOrders)
            await AsyncStorage.setItem('EXCHANGE_ORDERS', JSON.stringify(exchangeOrdersToSave))
        } else {
            Log.log('Exchange.MainDataScreen._load ' + source + ' skipped save id ' + res.data.id)
        }

        setLoaderStatus(false)

        const accounts = JSON.parse(JSON.stringify(this.props.accountStore.accounts))
        const cryptoCurrencyList = JSON.parse(JSON.stringify(this.props.currencyStore.cryptoCurrencies))
        let account
        if (res.data.fromCurrency.toUpperCase() === 'USDTERC20') {
            account = accounts[selectedWallet.walletHash]['ETH_USDT']
        } else {
            account = accounts[selectedWallet.walletHash][res.data.fromCurrency.toUpperCase()]
        }

        if (typeof account !== 'undefined') {

            const cryptoCurrency = cryptoCurrencyList.find(item => item.currencyCode === account.currencyCode)

            const dataToSend = {
                disabled: true,
                address: res.data.payinAddress,
                value: res.data.expectedSendAmount.toString(),

                account: account,
                cryptoCurrency: cryptoCurrency,

                description: strings('send.description'),
                useAllFunds: false,
                type: 'TRADE_SEND',
                copyAddress: true
            }

            if (typeof res.data.payinExtraId !== 'undefined') {
                dataToSend.destinationTag = res.data.payinExtraId
            }

            Log.log('Exchange.MainDataScreen._load ' + source + ' account for wallet ' + selectedWallet.walletHash + ' ' + res.data.fromCurrency, {
                account,
                dataToSend
            })

            if (source === 'inResend' || source === 'inResendAfterBack') {
                if (res.data.status === 'waiting') {
                    let diff = 0
                    try {
                        const created = Date.parse(res.data.createdAt)
                        diff = new Date().getTime() - created
                        Log.log('Exchange.MainDataScreen._load ' + source + ' account for wallet ' + selectedWallet.walletHash + ' ' + res.data.fromCurrency + ' created at ' + created + ' => diff ' + diff)
                    } catch (e) {
                        Log.log('Exchange.MainDataScreen._load ' + source + ' account for wallet ' + selectedWallet.walletHash + ' ' + res.data.fromCurrency + ' error in date ' + e.message, { data: res.data })
                    }
                    this.webRef.postMessage(JSON.stringify({ type: 'YES_NO_TO_BOTTOM' }))
                    if (diff < 60 * 20 * 1000) {
                        showModal({
                            type: 'YES_NO_MODAL',
                            icon: 'INFO',
                            title: strings('exchangeScreen.resendModal.title'),
                            description: strings('exchangeScreen.resendModal.description'),
                            noCallback: () => {
                               this.setState({ 'goneToSend': new Date().getTime()})
                            }
                        }, async () => {
                            this.setState({ 'goneToSend': new Date().getTime(), dataToSend: data })
                            setSendData(dataToSend)
                            NavStore.goNext('SendScreen')
                        })
                    } else {
                        showModal({
                            type: 'INFO_MODAL',
                            icon: 'INFO',
                            title: strings('exchangeScreen.expiredModal.title'),
                            description: strings('exchangeScreen.expiredModal.description', { txHash: res.data.payinHash || '' })
                        }, async () => {
                            setLoaderStatus(false)
                        })
                    }
                } else if (res.data.status === 'confirming') {

                    setLoaderStatus(false)
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'INFO',
                        title: strings('exchangeScreen.waitConfirmModal.title'),
                        description: strings('exchangeScreen.waitConfirmModal.description', { txHash: res.data.payinHash || '' })
                    }, async () => {
                        setLoaderStatus(false)
                    })
                } else {
                    Log.log('Exchange.MainDataScreen._load ' + source + ' data.status = ' + res.data.status + ' != waiting ' + JSON.stringify(res.data))
                }
            } else {
                this.setState({ 'goneToSend': new Date().getTime(), dataToSend: data })
                setSendData(dataToSend)
                NavStore.goNext('SendScreen')
            }
        } else {
            Log.log('Exchange.MainDataScreen._load ' + source + ' noAccount for wallet ' + selectedWallet.walletHash + ' ' + res.data.fromCurrency, {
                accounts,
                res: res.data
            })

            showModal({
                type: 'INFO_MODAL',
                icon: 'WARNING',
                title: strings('exchangeScreen.noAddressModal.title'),
                description: strings('exchangeScreen.noAddressModal.description'),
                noCallback: () => {
                    Log.log('Exchange.MainDataScreen.on message selectAccount noCallback')
                    this.webRef.postMessage(JSON.stringify({ type: 'NO_ADDRESS_TO_BOTTOM' }))
                }
            }, async () => {
                NavStore.goBack()
            })
        }
    }

    render() {
        const { exchangeStore, selectedWallet, currentScreen } = this.props
        const { source, script, status, suggestedResend, goneToSend, dataToSend } = this.state

        firebase.analytics().setCurrentScreen('Exchange.MainScreen.' + exchangeStore.tradeType)

        const now = new Date().getTime()
        const diff = now - goneToSend // when click / auto go forward to send is set here
        const diff2 = now - suggestedResend // when auto display modal is set here
        let diff3 = 1000000
        if (typeof currentScreen !== 'undefined' && currentScreen.changed) {
            diff3 = now - currentScreen.changed // when click back is set here
        }
        const current = NavStore.getCurrentRoute()
        // console.log('render', current, currentScreen, {diff, diff2, diff3})
        if (current.routeName === 'MainDataScreen') {

            if (dataToSend && goneToSend > 0 && diff > 100 && (suggestedResend === 0 || diff2 > 2000) && diff3 > 0) {
                Log.log('Exchange.MainDataScreen._load goto checked and go', { current, goneToSend, suggestedResend, diff, diff2, dataToSend, diff3 })
                this.setState({ suggestedResend: now })
                this._loadOrdersAndGotoPayment(dataToSend, selectedWallet, 'inResendAfterBack')
            } else {
                Log.log('Exchange.MainDataScreen._load goto checked and stay ', { current, goneToSend, suggestedResend, diff, diff2, dataToSend, diff3 })
            }
        }
        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('exchangeScreen.title')}
                    navigation={this.props.navigation}
                />
                <View style={styles.wrapper__content}>
                    {
                        status !== 'LOAD_END' ?
                            <View style={styles.img}>
                                <LottieView style={{
                                    width: 200,
                                    height: 200,
                                    marginTop: -50
                                }} source={require('../../assets/jsons/animations/loaderBlue.json')}
                                            progress={this.state.progress}/>
                            </View> : null
                    }
                    <WebView
                        ref={r => (this.webRef = r)}
                        style={{ flex: 1 }}
                        javaScriptEnabled={true}
                        // onLoadEnd={() => this.webref.injectJavaScript(script)}
                        showsVerticalScrollIndicator={false}
                        source={{ uri: source }}
                        onMessage={this.onMessage}
                        onLoadEnd={(e) => {
                            Log.log('Exchange.MainDataScreen.load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                            this.webRef.injectJavaScript(script)
                        }}
                        renderError={(e) => {
                            Log.log('Exchange.MainDataScreen.render error ' + e)
                        }}
                        onError={(e) => {
                            Log.log('Exchange.MainDataScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                        }}
                        onHttpError={(e) => {
                            Log.log('Exchange.MainDataScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                        }}
                        onLoadProgress={(e) => {
                            Log.log('Exchange.MainDataScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                        }}
                        onContentProcessDidTerminate={(e) => {
                            Log.log('Exchange.MainDataScreen.on content terminate ' + e.nativeEvent.title)
                        }}
                        onShouldStartLoadWithRequest={(e) => {
                            Log.log('Exchange.MainDataScreen.on start load with request ' + e.navigationType)
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
        selectedWallet: state.mainStore.selectedWallet,
        selectedAccount: state.mainStore.selectedAccount,
        currencyStore: state.currencyStore,
        accountStore: state.accountStore,
        currencies: state.currencyStore.cryptoCurrencies,
        exchangeStore: state.exchangeStore,
        currentScreen : state.mainStore.currentScreen
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainDataScreen)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#fff'
    },
    wrapper__content: {
        flex: 1,

        position: 'relative',

        marginTop: 80,
        backgroundColor: '#fff'
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        width: '100%',
        paddingHorizontal: 15
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
    }
}
