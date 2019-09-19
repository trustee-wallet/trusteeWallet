import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Animated, Dimensions, Image, StatusBar, View, Aler, Clipboard } from 'react-native'

import LottieView from 'lottie-react-native'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

import { WebView } from 'react-native-webview'
import { showModal } from '../../appstores/Actions/ModalActions'
import NavStore from '../../components/navigation/NavStore'
import axios from 'axios'

import { strings } from 'root/app/services/i18n'
import firebase from 'react-native-firebase'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import Navigation from '../../components/navigation/Navigation'

import config from '../../config/config'

let baseUrl, exchangeMode, apiEndpoints

class SMSCodeScreen extends Component {

    constructor() {
        super()
        this.state = {
            status: 'new',
            loaded: '',
            link: '',
            id: null,
            receiptPay: true,
            lastStep: true,
            scriptLoadEnd: '',
            progress: new Animated.Value(0),
            url: ''
        }
        this.webref = React.createRef()
    }

    componentWillMount() {
        exchangeMode = config.exchange.mode
        apiEndpoints = config.exchange.apiEndpoints

        baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL
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

    async componentDidMount() {


        Log.log('Exchange.SMSCodeScreen.componentDidMount started')

        const {
            address,
            sendToApiCrypto,
            sendToApiFiat,
            cardNumber,
            countryCode,
            expirationDate,
            currency,
            deviceToken,
            cashbackToken,
        } = this.props.exchange

        const expirationDateTmp = expirationDate.split('/')
        let easybitsCardNumber = cardNumber.match(/.{1,4}/g)
        let xPayCardNumber = cardNumber.match(/.{1,4}/g)
        xPayCardNumber = xPayCardNumber.join(' ')


        this.setState({
            //     document.getElementById("pay_in_card_number").value = '${cardNumber}';
            // document.getElementById("pay_in_expires_at").value = '${expirationDate}';
            // var form = document.getElementsByTagName("form")[0];
            // document.getElementById(form.id).submit();
            scriptLoadEnd: `
            try {
                     if((window.location.href).indexOf('pay.receipt-pay.com') !== -1){
                        document.getElementsByName("card_number")[0].value = '${cardNumber}';
                        document.getElementsByName("expire_date")[0].value = '${expirationDateTmp[0]} / ${expirationDateTmp[1]}';
                        //document.getElementsByName("cvv")[0].value = '${'000'}';
                        //var form = document.getElementsByTagName("form")[0];
                        //document.getElementById(form.id).submit();
                     }
                     
                     if((window.location.href).indexOf('easybits.io') !== -1){
                        setTimeout(function() {
                            var input1 = document.getElementById("pan1");
                            var input2 = document.getElementById("pan2");
                            var input3 = document.getElementById("pan3");
                            var input4 = document.getElementById("pan4");
                            var input5 = document.getElementById("month");
                            var input6 = document.getElementById("year");
                        
                   
                            input1.value = '${easybitsCardNumber[0].toString()}';
                            input2.value = '${easybitsCardNumber[1].toString()}';
                            input3.value = '${easybitsCardNumber[2].toString()}';
                            input4.value = '${easybitsCardNumber[3].toString()}';
                            input5.value = '${expirationDateTmp[0].toString()}';
                            input6.value = '${expirationDateTmp[1].toString()}';
                             
                            var ev = new Event('input');
                            input1.dispatchEvent(ev);
                            input2.dispatchEvent(ev);
                            input3.dispatchEvent(ev);
                            input4.dispatchEvent(ev);
                            input5.dispatchEvent(ev);
                            input6.dispatchEvent(ev);
                            
                        }, 5000)
                     }
                     
                     if((window.location.href).indexOf('mapi.xpay.com.ua') !== -1 && !((window.location.href).indexOf('/check') !== -1)){
                        document.getElementsByName("create[acc]")[0].value = '${'example@gmail.com'}';
                        
                        var form = document.getElementsByTagName("form")[0];
                        document.getElementById(form.id).submit();
                      
                     }
                     
                     if((window.location.href).includes('mapi.xpay.com.ua') && (window.location.href).includes('/check')){
                        document.getElementsByName("create[n]")[0].value = '${xPayCardNumber}';
                        document.getElementsByName("create[m]")[0].value = '${expirationDateTmp[0]}';
                        document.getElementsByName("create[y]")[0].value = '${expirationDateTmp[1]}'; 
                     }

                     if((window.location.href).includes('sci.any.cash')){
                        setTimeout(function () {
                           window.open(document.getElementsByTagName("iframe")[0].src, '_self')
                        }, 5000)
                     }
                     
                     if((window.location.href).includes('pay.4bill.io/cards')){
                        document.getElementsByName("card_number")[0].value = '${cardNumber}';
                        document.getElementsByName("expire_date")[0].value = '${expirationDateTmp[0]} / ${expirationDateTmp[1]}';
                     }
                     
                     setTimeout(function() {
                        typeof window != 'undefined' ? window.scrollTo( 0, 0 ) : null;
                     }, 2000);
                 } catch(error) {
        
                    true;
                 }
     
            `,
            status: 'pending'
        })

        this.handleStartAnimation()

        const data = {
            address,
            amount_crypto: sendToApiCrypto,
            amount_fiat: sendToApiFiat,
            currency,
            device_token: deviceToken,
            country_code: countryCode,
            locale: this.props.settingsStore.data.language.split('-')[0]
        }

        cashbackToken != null ? data.cashback_token = cashbackToken : null

        try {
            const { data: res } = await axios.post(`${baseUrl}/create-payin`, data)

            Log.log('Exchange.SMSCodeScreen.componentDidMount created payin', res)

            if (res.state == 'success') {
                let data = {
                    link: res.data.url,
                    id: res.data.id
                }
                MarketingEvent.logEvent('exchange_main_screen_buy_goto', data)
                Log.log('Exchange.SMSCodeScreen.handleSubmit.BUY goto', data)
                this.setState(data)
            } else {
                Log.err('Exchange.SMSCodeScreen.componentDidMount error', res)

                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: res.errorMsg[0].msg
                })
            }

        } catch (error) {
            Log.err('Exchange.SMSCodeScreen.componentDidMount error', error)
        }

        try {
            setTimeout(() => {
                if (!this.state.url.includes('pay.receipt-pay.com/cards') && !this.state.url.includes('mapi.xpay.com') && !this.state.url.includes('easybits.io') && !this.state.url.includes('kuna.io/')) {
                    if (this.state.receiptPay) {
                        this.setState({
                            receiptPay: false,
                            status: 'success'
                        })
                    }
                }
            }, 30000)
        } catch(e) {}
    }

    handleWebViewNavigationStateChange = async newNavState => {

        const { url } = newNavState
        if (!url) return

        this.setState({
            url
        })

        Log.log('Exchange.SMSCodeScreen.handleWebViewNavigationStateChange started', url)

        if ((url.includes('pay.receipt-pay.com/cards') && url != 'about:blank') || (url.includes('mapi.xpay.com') && url.includes('/check') && url != 'about:blank') || (url.includes('easybits.io') && url != 'about:blank')) {
            setTimeout(() => {
                if (this.state.receiptPay) {
                    this.setState({
                        receiptPay: false,
                        status: 'success'
                    })
                }
            }, 10000)
        }

        if (url.includes('kuna.io/') && url != 'about:blank' && this.state.lastStep) {

            this.handleStartAnimation()

            this.setState({
                status: 'pending',
                lastStep: false
            })

            const data = {
                id: this.state.id
            }

            setTimeout(async () => {
                const { data: res } = await axios.post(`${baseUrl}/get-payin-status`, data)


                Log.log('Exchange.SMSCodeScreen.handleWebViewNavigationStateChange check', res.data)

                if (res.data.status == 'failed') {
                    NavStore.goNext('MainDataScreen')

                    // showModal({
                    //     type: 'INFO_MODAL',
                    //     icon: false,
                    //     title: strings('modal.exchange.failed'),
                    //     description: strings('modal.exchange.txCanceled')
                    // }, () => {
                    //     NavStore.goNext('MainDataScreen');
                    // });
                } else {
                    NavStore.goNext('MainDataScreen')

                    /*showModal({
                        type: 'INFO_MODAL',
                        icon: true,
                        title: strings('modal.exchange.success'),
                        description: strings('modal.exchange.txSuccess')
                    }, () => {
                        NavStore.goNext('MainDataScreen');
                    });*/
                }
            }, 5000)
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('Exchange.SMSCodeScreen')
        Log.log(`Exchange.SMSCodeScreen is rendered`)

        const { scriptLoadEnd, status, link } = this.state

        return (
            <View style={{ ...styles.wrapper }}>
                <Navigation />
                {
                    status != 'success' ?
                        <View style={styles.img}>
                            <LottieView style={{
                                width: 200,
                                height: 200,
                                marginTop: -50
                            }} source={require('../../assets/jsons/animations/loader.json')} progress={this.state.progress}/>
                        </View> : null
                }
                <WebView
                    ref={r => (this.webref = r)}
                    javaScriptEnabled={true}
                    onNavigationStateChange={this.handleWebViewNavigationStateChange}
                    source={{ uri: link }}
                    style={{ flex: 1, marginTop: 20, maxHeight: status != 'success' ? 0 : 10000 }}
                    onLoadEnd={() => this.webref.injectJavaScript(scriptLoadEnd)}
                    onMessage={event => {

                    }}
                    useWebKit={true}
                />
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

export default connect(mapStateToProps, mapDispatchToProps)(SMSCodeScreen)

const styles = {
    wrapper: {
        flex: 1,
        paddingTop: 80,
        height: WINDOW_HEIGHT,
        backgroundColor: '#fff'
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
