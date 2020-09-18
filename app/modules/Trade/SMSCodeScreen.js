/**
 * @version todo
 * @misha to review
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

import Navigation from '../../components/navigation/Navigation'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import {strings} from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_IS_ERROR = false
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

        Log.log('Trade.SMSCodeScreen.componentDidMount started')

        const {
            cardNumber,
            expirationDate,
            uniqueParams
        } = this.props.exchange


        const expirationDateTmp = typeof expirationDate !== 'undefined' ? expirationDate.split('/') : null
        let easybitsCardNumber = null
        let xPayCardNumber = ''
        if (cardNumber && typeof cardNumber !== 'undefined') {
            easybitsCardNumber = cardNumber.trim().match(/.{1,4}/g)
            xPayCardNumber = easybitsCardNumber.join(' ').trim().toString()
        }

        const phoneNumber = typeof uniqueParams !== 'undefined' && typeof uniqueParams.phone !== 'undefined' ? uniqueParams.phone : ''

        const firstName = typeof uniqueParams !== 'undefined' && typeof uniqueParams.firstName !== 'undefined' ? uniqueParams.firstName : ''
        const lastName = typeof uniqueParams !== 'undefined' && typeof uniqueParams.lastName !== 'undefined' ? uniqueParams.lastName : ''

        const nameToPaste = firstName + ' ' + lastName

        this.setState({
            //     document.getElementById("pay_in_card_number").value = '${cardNumber}';
            // document.getElementById("pay_in_expires_at").value = '${expirationDate}';
            // var form = document.getElementsByTagName("form")[0];
            // document.getElementById(form.id).submit();
            scriptLoadEnd: `
            try {
              window.ReactNativeWebView.postMessage('WebView Loaded ' + window.location + ' webview ' +  document.body.innerHTML.toString().substr(0, 500));
            } catch(error) {
              window.ReactNativeWebView.postMessage('Debug Error ' + window.location + ' webview ' + error.toString());
            }
            try {
                 
       
                     
                     if((window.location.href).indexOf('easybits.io') !== -1){
                        setTimeout(function() {
                            var input1 = document.getElementById("pan1");
                            var input2 = document.getElementById("pan2");
                            var input3 = document.getElementById("pan3");
                            var input4 = document.getElementById("pan4");
                            var input5 = document.getElementById("month");
                            var input6 = document.getElementById("year");
                        
                   
                            input1.value = '${easybitsCardNumber != null ? easybitsCardNumber[0].toString() : ''}';
                            input2.value = '${easybitsCardNumber != null ? easybitsCardNumber[1].toString() : ''}';
                            input3.value = '${easybitsCardNumber != null ? easybitsCardNumber[2].toString() : ''}';
                            input4.value = '${easybitsCardNumber != null ? easybitsCardNumber[3].toString() : ''}';
                            input5.value = '${expirationDateTmp != null ? expirationDateTmp[0].toString() : ''}';
                            input6.value = '${expirationDateTmp != null ? expirationDateTmp[1].toString() : ''}';
                             
                            var ev = new Event('input');
                            input1.dispatchEvent(ev);
                            input2.dispatchEvent(ev);
                            input3.dispatchEvent(ev);
                            input4.dispatchEvent(ev);
                            input5.dispatchEvent(ev);
                            input6.dispatchEvent(ev);
                            
                        }, 5000)
                     }
                     
                    /*if((window.location.href).indexOf('mapi.xpay.com.ua') !== -1 && !((window.location.href).indexOf('/check') !== -1)){
                        document.getElementsByName("create[acc]")[0].value = 'Vadymvad@gmail.com';
                        
                        document.getElementById("xpayAgreed").checked = true;
                        
                        var form = document.getElementsByTagName("form")[0];
                        document.getElementById(form.id).submit();
                     }*/

                     if((window.location.href).includes('cardgate.paycore.io')){
                        var ev = new Event('input');
                        var input1 = document.getElementsByName("number")[0];
                        if (typeof input1 !== 'undefined') {
                          ${xPayCardNumber.length ? ' input1.disabled = true; ' : ''}
                          input1.value = '${xPayCardNumber.length ? xPayCardNumber : ''}';
                          input1.dispatchEvent(ev);
                        } else {
                          
                          var txt  = document.body.innerHTML.toString().substr(0, 500);
                          var orderInfo = document.getElementsByClassName('form__info_order')[0];
                          if (typeof orderInfo !== 'undefined') {
                               setInterval(() => {
                                      var txt  = document.body.innerHTML.toString().substr(0, 5000);
                                      window.ReactNativeWebView.postMessage('WebView Agent ServerError ' + window.location + ' ' + txt);
                               }, 1000)
                          } else {
                              var s = document.createElement('div');
                              var agent = typeof window.navigator.userAgent !== 'undefined' ? window.navigator.userAgent : 'none';
                              s.innerHTML = '<div style="font-size: 34px; padding:10px;"><a href="#" onClick="goToThis(); return false;">${strings('confirmScreen.openLink')}</a></div>';
                              document.body.innerHTML = '';
                              document.body.appendChild(s);
                              window.ReactNativeWebView.postMessage('WebView Agent Error ' + window.location + ' agent ' + agent + ' ' + txt);
                              goToThis();
                          }
                          
                          
                        }
                        var input2 = document.getElementsByName("date")[0];
                        if (typeof input2 !== 'undefined') {
                           input2.value = '${expirationDateTmp !== null ? expirationDateTmp[0] : ''} / ${expirationDateTmp !== null ? expirationDateTmp[1] : ''}';
                           input2.dispatchEvent(ev);
                        }
                     }
                     
                     function goToThis() {
                        window.ReactNativeWebView.postMessage('WebView Agent OPEN=' + window.location.href);
                     }
                     
                      if((window.location.href).includes('mapi.xpay.com.ua')){
                        document.getElementById("hdr").remove()
                      
                        document.getElementsByName("create[n]")[0].value = '${xPayCardNumber}';
                        document.getElementsByName("create[m]")[0].value = '${expirationDateTmp !== null ? expirationDateTmp[0] : ''}';
                        document.getElementsByName("create[y]")[0].value = '${expirationDateTmp !== null ? expirationDateTmp[1] : ''}'; 
                        
                        var elem = document.querySelector(".btnGrp");
                        elem.removeChild(elem.firstElementChild)
                        
                        document.getElementById("create[a]").checked = true;
                        
                     }
                     
                    if((window.location.href).includes('wallet.advcash.com')){
                        var title365 = document.getElementsByClassName('welcome__desc');
                        if (typeof title365 !== 'undefined' && typeof title365[0] !== 'undefined' && typeof title365[0].firstElementChild !== 'undefined') {
                          title365[0].firstElementChild.innerHTML = ''
                        }
                        title365 =  document.getElementsByClassName('pay__head-details');
                        if (typeof title365 !== 'undefined' && typeof title365[0] !== 'undefined' && typeof title365[0].firstElementChild !== 'undefined') {
                          title365[0].firstElementChild.innerHTML = ''
                        }
                    }

                    if((window.location.href).includes('oplata.qiwi.com')){
                        localStorage.clear();
                    
                        setTimeout(function () {
                            
                            var inputQIWI = document.getElementById("PhoneForm-Input");
                            var btnQIWI = document.getElementById("PhoneForm-Submit");
                            
                            var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetter.call(inputQIWI, '${phoneNumber}');
                            
                            var ev2 = new Event('input', { bubbles: true});
                            inputQIWI.dispatchEvent(ev2);
                            
                            btnQIWI.click();
                            
                            setTimeout(function() {
                                var input1QIWI = document.getElementById("radio-PasscodeForm-SmsRadioButton");
                                input1QIWI.click();
                                typeof window != 'undefined' ? window.scrollTo( 0, 0 ) : null;
                            }, 4000)
                        }, 5000)
                    }
                    
                    if((window.location.href).includes('online.contact-sys.com/payment-form')){
                        setTimeout(function () {
                            
                            var htmlContactSys = document.getElementsByTagName("html")[0];

 
                            var input1ContactSys = document.getElementsByName("cardNumber")[0];
                            input1ContactSys.disabled = true;
                            var input2ContactSys = document.getElementsByName("expireDate")[0];
                            var input3ContactSys = document.getElementsByName("offer")[0];
                            input3ContactSys.click();
                            var input4ContactSys = document.getElementsByName("cardHolder")[0];
                            var input5ContactSys = document.getElementsByName("cvv2")[0];
                            input4ContactSys.parentNode.style.cssText = "display: none;";
                            
                           
                            // var nativeInputValueSetter1 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            // nativeInputValueSetter1.call(input1ContactSys, '${xPayCardNumber}');
                            //
                            //
                            // var nativeInputValueSetter2 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            // nativeInputValueSetter2.call(input2ContactSys, '${expirationDate}');
                            //
                            //
                            // var nativeInputValueSetter4 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            // nativeInputValueSetter4.call(input4ContactSys, '${nameToPaste}');
                            
                            
                            var ev1 = new Event('input', { bubbles: true});
                            input1ContactSys.dispatchEvent(ev1);
                            input2ContactSys.dispatchEvent(ev1);
                            input4ContactSys.dispatchEvent(ev1);
                            
                          
                            
                            var nativeInputValueSetterInput1ContactSys = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetterInput1ContactSys.call(input1ContactSys, '${xPayCardNumber}');

                            var nativeInputValueSetterInput2ContactSys = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetterInput2ContactSys.call(input2ContactSys, '${expirationDate}');

                            var nativeInputValueSetterInput4ContactSys = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetterInput4ContactSys.call(input4ContactSys, '${nameToPaste}');

                            var inputEventContactSys = new Event('input', { bubbles: true});
                            input1ContactSys.dispatchEvent(inputEventContactSys);
                            input2ContactSys.dispatchEvent(inputEventContactSys);
                            input4ContactSys.dispatchEvent(inputEventContactSys);
                          
                            
                            htmlContactSys.style = "height: auto;"
                           
                           
                            input5ContactSys.focus();

                            var input6ContactSys = document.getElementById('root')
                            input6ContactSys.style.cssText = "height: 0;";
                            input6ContactSys.style.cssText = "height: auto;";
                             
                        }, 2000)
                    }

                     if((window.location.href).includes('sci.any.cash')){
                        setTimeout(function () {
                           window.open(document.getElementsByTagName("iframe")[0].src, '_self')
                        }, 5000)
                     }
                     
                     if((window.location.href).includes('pay.4bill.io/cards')){
                        document.getElementsByName("card_number")[0].value = '${cardNumber}';
                        document.getElementsByName("expire_date")[0].value = '${expirationDateTmp !== null ? expirationDateTmp[0] : ''} / ${expirationDateTmp !== null ? expirationDateTmp[1] : ''}';
                     }
                     
                     setTimeout(function() {
                        typeof window != 'undefined' ? window.scrollTo( 0, 0 ) : null;
                     }, 2000);
                     
                     function findAndReplace(searchText, replacement, searchNode) {
                        if (!searchText || typeof replacement === 'undefined') {
                            // Throw error here if you want...
                            return;
                        }
                        var regex = typeof searchText === 'string' ?
                                    new RegExp(searchText, 'g') : searchText,
                            childNodes = (searchNode || document.body).childNodes,
                            cnLength = childNodes.length,
                            excludes = 'html,head,style,title,link,meta,script,object,iframe';
                        while (cnLength--) {
                            var currentNode = childNodes[cnLength];
                            if (currentNode.nodeType === 1 &&
                                (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) {
                                arguments.callee(searchText, replacement, currentNode);
                            }
                            if (currentNode.nodeType !== 3 || !regex.test(currentNode.data) ) {
                                continue;
                            }
                            if (typeof currentNode.parentNode !== 'undefined') {
                             currentNode.parentNode.innerHTML = '';
                            }
                        }
                        
                        var kunaIcon = document.getElementsByClassName('kuna-icon')[0];
                        if(typeof kunaIcon !== 'undefined') {
                            kunaIcon.remove();
                            }
                        }
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 3000)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 1000)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 700)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 500)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 400)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 300)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 200)
                        
                        setTimeout(() => {
                            findAndReplace('(kuna|Kuna|KUNA|powered)', '')
                        }, 100)
                
                         if((window.location.href).indexOf('pay.receipt-pay.com') !== -1){
                            document.getElementsByName("card_number")[0].value = '${cardNumber}';
                            document.getElementsByName("expire_date")[0].value = '${expirationDateTmp !== null ? expirationDateTmp[0] : ''} / ${expirationDateTmp !== null ? expirationDateTmp[1] : ''}';
                            //document.getElementsByName("cvv")[0].value = '${'000'}';
                            //var form = document.getElementsByTagName("form")[0];
                            //document.getElementById(form.id).submit();
                         }  
                 } catch(error) {
                    window.ReactNativeWebView.postMessage('Inner Error ' + window.location + ' webview ' + error.toString());
                    alert(error);
                    true;
                 }
            `,
            status: 'pending'
        })

        this.handleStartAnimation()

        Log.log('Trade.SMSCodeScreen.componentDidMount created payin')


        const data = {
            link: this.props.exchange.link,
            id: this.props.exchange.id
        }

        MarketingEvent.logEvent('exchange_main_screen_buy_goto', { link: data.link, id: data.id + '' })

        Log.log('Trade.SMSCodeScreen.handleSubmit.BUY goto', {
            link: this.props.exchange.link,
            id: this.props.exchange.id,
            cardNumber,
            xPayCardNumber
        })
        this.setState(data)

        try {
            Log.log('Trade.SMSCodeScreen.componentDidMount timeout0 will be created')
            setTimeout(() => {
                Log.log('Trade.SMSCodeScreen.componentDidMount timeout0 will be finished ' + this.state.url)
                if (!this.state.url.includes('pay.receipt-pay.com/cards') && !this.state.url.includes('mapi.xpay.com') && !this.state.url.includes('easybits.io') && !this.state.url.includes('kuna.io/')) {
                    Log.log('Trade.SMSCodeScreen.componentDidMount timeout0 will be in1')
                    if (this.state.receiptPay) {
                        Log.log('Trade.SMSCodeScreen.componentDidMount timeout0 will be in2')
                        this.setState({
                            receiptPay: false,
                            status: 'success'
                        })
                    }
                }
            }, 30000)
        } catch (e) {
            Log.log('Trade.SMSCodeScreen.componentDidMount timeout0 error ' + e.message)
        }
    }

    onMessage(e) {
        if (e.nativeEvent.data.indexOf('paycore.io') !== -1 && e.nativeEvent.data.indexOf('<section class="error-message') !== -1) {
            CACHE_IS_ERROR = true
            Log.log('Trade.SMSCodeScreen.on message ' + e.nativeEvent.data + ' SET ERROR')
        } else {
            Log.log('Trade.SMSCodeScreen.on message ' + e.nativeEvent.data + ' NO ERROR')
        }
        if (e.nativeEvent.data.indexOf('WebView Loaded') !== -1) { // https://wallet.advcash.com/sci/paymentRequest.jsf
            this.setState({
                status: 'success'
            })
        } else if (e.nativeEvent.data.indexOf('WebView Agent OPEN=') !== -1) {
            const link = e.nativeEvent.data.substr(19)
            Linking.canOpenURL(link).then(supported => {
                if (supported) {
                    Linking.openURL(link)
                } else {
                    copyToClipboard(link)
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'WARNING',
                        title: strings('modal.exchange.sorry'),
                        description: strings('confirmScreen.openLinkError')
                    })
                    Log.log('Trade.SMSCodeScreen Dont know how to open URI', link)
                }
            })
        }
    }

    handleWebViewNavigationStateChange = async newNavState => {

        const { url } = newNavState

        if (!url) return

        Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange url', url)

        this.setState({
            url
        })

        Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange started', url)

        if (url.includes('acs') && url !== 'about:blank') {
            Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange timeout0 will be created')
            this.setState({
                status: 'pending'
            })
            setTimeout(() => {
                Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange timeout0 finished', this.state)
                this.setState({
                    status: 'success'
                })
            }, 5000)
        }

        if (
            (url.includes('pay.receipt-pay.com/cards') && url !== 'about:blank')
            || (url.includes('cardgate.paycore.io') && url !== 'about:blank')
            || (url.includes('mapi.xpay.com') && url !== 'about:blank')
            || (url.includes('easybits.io') && url !== 'about:blank')
        ) {
            Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange timeout1 will be created')
            setTimeout(() => {
                if (this.state.receiptPay) {
                    this.setState({
                        receiptPay: false,
                        status: 'success'
                    })
                }
            }, 10000)
        }


        if (
            (
                url.includes('kuna.io/') || url.includes('cardgate.paycore.io/hpp/status') || url.includes('cb1.xpay.com.ua/')
                || url.includes('365cash.co/currency/success') || url.includes('365cash.co/currency/failure')
                || (url.includes('trustee.deals') && !url.includes('redirectUrl=https://trustee.deals/') && !url.includes('successUrl=https://trustee.deals/'))
                || (url.includes('https://blocksoftlab.com/') && !url.includes('successUrl=https://blocksoftlab.com/') && !url.includes('redirectUrl=https://blocksoftlab.com/'))
            )
            && url !== 'about:blank' && this.state.lastStep
        ) {
            Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange timeout2 will be created ' + url + ' CACHE_IS_ERROR ' + (CACHE_IS_ERROR ? 'true' : 'false'))
            this.handleStartAnimation()

            this.setState({
                status: 'pending',
                lastStep: false
            })

            if (CACHE_IS_ERROR || url.includes('365cash.co/currency/failure')) {
                NavStore.goNext('FinishErrorScreen', {
                    finishScreenParam: {
                        selectedCryptoCurrency: this.props.exchange.selectedCryptocurrency
                    }
                })
            } else {
                NavStore.goNext('FinishScreen', {
                    finishScreenParam: {
                        selectedCryptoCurrency: this.props.exchange.selectedCryptocurrency
                    }
                })
            }


            // setTimeout(async () => {
            //     const { data: res } = await axios.post(`${baseUrl}/get-payin-status`, data)
            //
            //
            //     Log.log('Trade.SMSCodeScreen.handleWebViewNavigationStateChange check', res.data)
            //
            //     if (res.data.status == 'failed') {
            //         NavStore.goNext('MainDataScreen')
            //
            //         // showModal({
            //         //     type: 'INFO_MODAL',
            //         //     icon: false,
            //         //     title: strings('modal.exchange.failed'),
            //         //     description: strings('modal.exchange.txCanceled')
            //         // }, () => {
            //         //     NavStore.goNext('MainDataScreen');
            //         // });
            //     } else {
            //         NavStore.goNext('MainDataScreen')
            //
            //         /*showModal({
            //             type: 'INFO_MODAL',
            //             icon: true,
            //             title: strings('modal.exchange.success'),
            //             description: strings('modal.exchange.txSuccess')
            //         }, () => {
            //             NavStore.goNext('MainDataScreen');
            //         });*/
            //     }
            // }, 5000)
        }
    }

    render() {
        UpdateOneByOneDaemon.pause()
        firebase.analytics().setCurrentScreen('Trade.SMSCodeScreen')
        Log.log(`Trade.SMSCodeScreen is rendered`)

        const { scriptLoadEnd, status, link } = this.state

        Log.log('Trade.SMSCodeScreen.link', link, status)

        CACHE_IS_ERROR = false
        return (
            <View style={{ ...styles.wrapper }}>
                <Navigation/>
                <View style={styles.wrapper__content}>
                    {
                        status !== 'success' ?
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
                        ref={r => (this.webref = r)}
                        javaScriptEnabled={true}
                        onNavigationStateChange={this.handleWebViewNavigationStateChange}
                        source={{ uri: link }}
                        style={{ flex: 1, maxHeight: status !== 'success' ? 0 : 10000 }}
                        onLoadEnd={(e) => {
                            Log.log('Trade.SMSCodeScreen.load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                            this.webref.injectJavaScript(scriptLoadEnd)
                        }}
                        renderError={(e) => {
                            Log.log('Trade.SMSCodeScreen.render error ' + e)
                        }}
                        onError={(e) => {
                            Log.log('Trade.SMSCodeScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                        }}
                        onHttpError={(e) => {
                            Log.log('Trade.SMSCodeScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                        }}
                        onMessage={(e) => {
                            this.onMessage(e)
                        }}
                        onLoadProgress={(e) => {
                            Log.log('Trade.SMSCodeScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                        }}
                        onContentProcessDidTerminate={(e) => {
                            Log.log('Trade.SMSCodeScreen.on content terminate ' + e.nativeEvent.title)
                        }}
                        onShouldStartLoadWithRequest={(e) => {
                            Log.log('Trade.SMSCodeScreen.on start load with request ' + e.navigationType)
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

export default connect(mapStateToProps, mapDispatchToProps)(SMSCodeScreen)

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
