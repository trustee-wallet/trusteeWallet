/**
 * @version 0.50
 */

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ActivityIndicator, BackHandler } from 'react-native'

import { WebView } from 'react-native-webview'
import UrlParse from 'url-parse'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'
import { getWalletDappData } from '@app/appstores/Stores/WalletDapp/selectors'
import { setWalletConnectData } from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import { getSelectedAccountData } from '@app/appstores/Stores/Main/selectors'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'

import {
    handleParanoidLogout,
    handleSendSign,
    handleSendSignTyped,
    handleSendTransaction,
    handleSessionRequest,
    handleStop
} from '@app/modules/WalletConnect/helpers'
import { AppWalletConnect } from '@app/services/Back/AppWalletConnect/AppWalletConnect'
import config from '@app/config/config'

class WalletDappWebViewScreen extends PureComponent {

    handleBack = () => { NavStore.goBack() }

    handleClose = () => {
        const prev = NavStore.getParamWrapper(this, 'backOnClose')
        if (prev) {
            NavStore.goBack()
        } else {
            NavStore.reset('HomeScreen')
        }
    }

    handleSend = (message, payload) => {
        handleSendSign.call(this, message, payload)
    }

    handleSendTyped = (data, payload) => {
        handleSendSignTyped.call(this, data, payload)
    }

    handleTransactionSend = (data, payload, mainCurrencyCode) => {
        handleSendTransaction.call(this, data, payload, mainCurrencyCode)
    }

    handleRequest = (data) => {
        handleSessionRequest.call(this, data)
    }

    handleDisconnect = (isConnected) => {
        handleStop.call(this, isConnected)
    }

    handleLogout = (func) => {
        const { peerStatus } = this.state
        handleParanoidLogout.call(this, peerStatus, func)
        BackHandler.removeEventListener('hardwareBackPress', this.handleLogout);
    }

    async _init(anyData) {
        Log.log('WalletConnectScreen.init ', anyData)
        try {
            const clientData = await AppWalletConnect.init(anyData,
                this.handleRequest,
                this.handleSessionEnd,
                this.handleTransactionSend,
                this.handleSend,
                this.handleSendTyped
            )
            if (clientData) {
                const stateData = {
                    walletStarted: true,
                    peerStatus: clientData.connected,
                    chainId: clientData.chainId
                }
                if (typeof clientData.peerMeta !== 'undefined' && clientData.peerMeta && clientData.peerMeta !== '') {
                    stateData.peerMeta = clientData.peerMeta
                }
                if (typeof clientData.peerId !== 'undefined' && clientData.peerId && clientData.peerId !== '') {
                    stateData.peerId = clientData.peerId
                }
                this.setState(stateData)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            }
            if (e.message.indexOf('URI format') === -1) {
                Log.log('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            } else {
                Log.log('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            }
            this.setState({
                walletStarted: false,
                linkError: true
            })
        }
    }

    handleWebViewNavigationTestLink = (req) => {
        console.log(`
        
        
        
        
        `)
        console.log('WebView.WebViewMainScreen.on start load with request ' + req.navigationType + ' ' + req.url)
        console.log(req)
        const parsedUrl = UrlParse(req.url)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') return true
        try {
            if (parsedUrl.protocol === 'wc:') {
                console.log('parsedUrl', parsedUrl)
                if (req.url.indexOf('?bridge=') !== -1) {
                    this._init({ fullLink: req.url })
                } else {
                    console.log('will do and go!')
                    return true
                }
                return false
            }
        } catch (err) {
            return true
        }
    }

    handleWebViewNavigationStateChange = (navState) => {
        console.log('WebView.WebViewMainScreen.on handle navState ', navState)
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletDapp.WebView')

        const { dappCode, incognito } = this.props.walletDappData
        const dappParams = typeof dappsBlocksoftDict[dappCode] !== 'undefined' ? dappsBlocksoftDict[dappCode] : false
        if (!dappParams) {
            return <View/>
        }

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={dappParams.dappName}
            >
                <WebView
                    ref={webView => (this.webref = webView)}
                    source={{ uri: dappParams.dappUrl }}
                    incognito={incognito}
                    originWhitelist={['*']}

                    onShouldStartLoadWithRequest={this.handleWebViewNavigationTestLink}
                    onNavigationStateChange={this.handleWebViewNavigationStateChange}

                    onError={(e) => {
                        Log.err('WebView.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.description)
                    }}

                    onHttpError={(e) => {
                        console.log('WebView.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                    }}
                    onLoadProgress={(e) => {
                        console.log('WebView.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.progress)
                    }}

                    onLoadEnd={(e) => {
                        console.log('WebView.WebViewMainScreen.on load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.progress)
                    }}

                    renderLoading={this.renderLoading}
                    renderError={(e) => {
                        this.renderError()
                    }}

                    javaScriptEnabled={true}
                    useWebKit={true}
                    startInLoadingState={true}
                    allowsInlineMediaPlayback={true}
                    allowsBackForwardNavigationGestures={true}
                />
            </ScreenWrapper>
        )
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size="large"
                style={[styles.loader, { backgroundColor: colors.common.background }]}
                color={this.context.colors.common.text2}
            />
        )
    }

    renderError = () => {
        const { colors } = this.context
        return (
            <View style={[styles.error, { backgroundColor: colors.common.background }]}>
                <Text style={[styles.errorText, { color: colors.common.text2 }]}>{strings('components.webview.error')}</Text>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        walletDappData: getWalletDappData(state),
        selectedAccountData: getSelectedAccountData(state),
        lockScreenStatus: getLockScreenStatus(state),
        walletConnectData: getWalletConnectData(state),
    }
}

WalletDappWebViewScreen.contextType = ThemeContext

export default connect(mapStateToProps)(WalletDappWebViewScreen)


const styles = StyleSheet.create({
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    error: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 18,
        lineHeight: 20,
    }
})
