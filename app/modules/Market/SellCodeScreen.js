/**
 * @version 0.44
 * @author yura
 */

import React, { PureComponent } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import LottieView from 'lottie-react-native'

import axios from 'axios'
import _ from 'lodash'

import queryString from 'query-string'

import { WebView } from 'react-native-webview'
import NavStore from '@app/components/navigation/NavStore'

import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'

import Api from '@app/services/Api/ApiV3'

import store from '@app/store'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import config from '@app/config/config'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

class SellCodeScreen extends PureComponent {

    constructor() {
        super()
        this.state = {
            status: 'NEW',
            loaded: '',
            link: '',
            orderHash: null,
            progress: new Animated.Value(0),
            url: '',
            dataSend: null
        }
        this.webref = React.createRef()
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
            const getCode = new Function('data', 'Log', 'MarketingEvent', 'NavStore', 'setExchangeStatus', 'store', '_', 'state', 'that', 'BlocksoftAxios', 'axios', 'config', 'queryString', prepare)
            return getCode(param, Log, MarketingEvent, NavStore, this.setExchangeStatus, store, _, this.state, that, BlocksoftAxios, axios, config, queryString)
        }
        // else if (type === 'MSG') {
        //     // eslint-disable-next-line no-new-func
        //     const getCode = new Function('e', 'Log', 'showModal', 'setExchangeStatus', 'that', 'BlocksoftAxios', 'axios', 'config', prepare)
        //     return getCode(param, Log, showModal, this.setExchangeStatus, that, BlocksoftAxios, axios, config)
        // }
    }

    componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'data')
        this.prepareFunction(data.didMountSell, data, this, 'GENERAL')
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

    handleWebViewNavigationStateChange = (navState) => {
        this.prepareFunction(this.state.dataSend.navigationSell, navState, this, 'GENERAL')
    }

    onMessage = (e) => {
        console.log(e)
    }

    send = async (data) => {
        try {
            if (config.debug.cryptoErrors) {
                console.log('Market/SellCodeScreen send data ' + JSON.stringify(data))
            }
            Log.log('Market/SellCodeScreen send data', data)

            const limits = data.limits ? JSON.parse(data.limits) : false

            // const trusteeFee = data.trusteeFee ? JSON.parse(data.trusteeFee) : false

            const minCrypto = typeof limits.limits !== 'undefined' && limits.limits ? BlocksoftPrettyNumbers.setCurrencyCode(limits.currencyCode).makeUnPretty(limits.limits) : false

            const bseOrderData = {
                amountReceived: null,
                depositAddress: data.address,
                exchangeRate: null,
                exchangeWayType: data.exchangeWayType,
                inTxHash: null,
                orderHash: data.orderHash,
                orderId: data.orderHash,
                outDestination: data.exchangeWayType === 'SELL'
                    ? `${data.outDestination.substr(0, 2)}***${data.outDestination.substr(-4, 4)}`
                    : data.outDestination,
                outTxHash: null,
                payinUrl: null,
                requestedInAmount: { amount: data.amount, currencyCode: data.currencyCode },
                requestedOutAmount: { amount: data.outAmount, currencyCode: data.outCurrency },
                status: 'pending_payin',
                payway: data.payway || null
            }

            let feeData = false
            try {
                if (typeof data.feeData !== 'undefined' && data.feeData) {
                    feeData = JSON.parse(data.feeData)
                    feeData = typeof feeData.selectedFee !== 'undefined' ? feeData.selectedFee : false
                }
            } catch (e) {
                // do nothing
            }

            const bse = {
                bseProviderType: data.providerType || 'NONE', //  'FIXED' || 'FLOATING'
                bseOrderId: data.orderHash || data.orderId,
                bseMinCrypto: minCrypto,
                bseTrusteeFee: {
                    // value: trusteeFee ? trusteeFee.trusteeFee : 0,
                    // currencyCode: trusteeFee ? trusteeFee.currencyCode : 'USD',
                    value: data.amount, // to unify with Vlad
                    currencyCode: data.currencyCode, // to unify

                    type: 'MARKET',
                    from: data.currencyCode,
                    to: data.outCurrency
                },
                bseOrderData: bseOrderData
            }

            if (typeof data.apiRaw !== 'undefined' && data.apiRaw && typeof data.apiRaw.dexCurrencyCode !== 'undefined' && data.apiRaw.dexCurrencyCode) {
                bse.bseOrderData.status = 'dex'
                await SendActionsStart.startFromDEX({
                    amount: BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.amount),
                    addressTo: data.outDestination,
                    currencyCode: data.currencyCode,
                    dexCurrencyCode: data.apiRaw.dexCurrencyCode,
                    dexOrderData: data.apiRaw.dexOrderData
                },
                    bse)
                return true
            }

            await SendActionsStart.startFromBSE(data, bse, feeData)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen.send ' + e.message)
            }
            throw e
        }
    }

    setExchangeStatus = async (data) =>  {
        Api.setExchangeStatus(data)
    }

    backAction = () => {
        Log.log('Trade.SellCodeScreen.backAction user click')
        this.setExchangeStatus({orderHash: this.state.dataSend.orderHash, status: 'BACK'})
        NavStore.goBack()
    }

    render() {
        UpdateOneByOneDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Trade.SellCodeScreen')

        const { status, link } = this.state

        Log.log('Trade.SellCodeScreen.link status ' + status, link)

        return (
            <ScreenWrapper
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
                            Log.log('Trade.SellCodeScreen.load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                        }}
                        renderError={(e) => {
                            Log.log('Trade.SellCodeScreen.render error ' + e)
                        }}
                        onError={(e) => {
                            Log.log('Trade.SellCodeScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                        }}
                        onHttpError={(e) => {
                            Log.log('Trade.SellCodeScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                        }}
                        onMessage={(e) => {
                            this.onMessage(e)
                        }}
                        onLoadProgress={(e) => {
                            Log.log('Trade.SellCodeScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                        }}
                        onContentProcessDidTerminate={(e) => {
                            Log.log('Trade.SellCodeScreen.on content terminate ' + e.nativeEvent.title)
                        }}
                        onShouldStartLoadWithRequest={(e) => {
                            Log.log('Trade.SellCodeScreen.on start load with request ' + e.navigationType)
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

export default SellCodeScreen

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
