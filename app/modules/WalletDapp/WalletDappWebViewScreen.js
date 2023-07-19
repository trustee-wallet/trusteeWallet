/**
 * @version 1.0
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'

import { WebView } from 'react-native-webview'
import UrlParse from 'url-parse'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getWalletDappData } from '@app/appstores/Stores/WalletDapp/selectors'
import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'

import config from '@app/config/config'
import store from '@app/store'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import TrxDappHandler from '@app/modules/WalletDapp/injected/TrxDappHandler'
import EthDappHandler from '@app/modules/WalletDapp/injected/EthDappHandler'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import BlocksoftUtils from "@crypto/common/BlocksoftUtils"
import { Web3Injected } from '@crypto/services/Web3Injected'
import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'
import { INJECTEDJAVASCRIPT, INJECTEDJAVASCRIPT_SMALL } from './ScriptWeb3.js'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'

class WalletDappWebViewScreen extends PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        const prev = NavStore.getParamWrapper(this, 'backOnClose')
        if (prev) {
            NavStore.goBack()
        } else {
            NavStore.reset('HomeScreen')
        }
    }

    handleChangeNetwork = () => {
        NavStore.goNext('WalletConnectChangeNetworkScreen')
    }


    onMessage = async (e) => {

        let showLog = false
        if (config.debug.appErrors) {
            if (e?.nativeEvent?.data && e.nativeEvent.data.indexOf('eth_accounts') === -1 && e.nativeEvent.data.indexOf('net_version') === -1) {
                // console.log('WalletDappWebView message', e.nativeEvent.data)
                // showLog = true
            }
        }
        Log.log('WalletDappWebView message', e.nativeEvent.data)
        if (e?.nativeEvent?.data && e.nativeEvent.data.indexOf('{') !== -1) {
            let tmp = false
            try {
                tmp = JSON.parse(e.nativeEvent.data)
            } catch (e) {
                console.log('WalletDapp.WebViewScreen.onMessage parse error ' + e.message  + ' ' + e.nativeEvent.data)
            }

            try {
                let handler = false
                if (tmp.main === 'tronWeb') {
                    handler = TrxDappHandler
                } else if (tmp.main === 'ethereum') {
                    handler = EthDappHandler
                }

                if (handler) {
                    const { res, shouldAsk, shouldAskText} = await handler.handle(tmp, false)
                    if (config.debug.appErrors && showLog) {
                        console.log('WalletDappWebView res', res)
                    }
                    if (typeof shouldAsk !== 'undefined' && shouldAsk) {
                        showModal({
                            type: 'YES_NO_MODAL',
                            icon: 'WARNING',
                            title: strings('settings.walletConnect.transaction'),
                            description: shouldAskText
                        },  async () => {
                            const { res : resAfterAsk } = await handler.handle(tmp, true)
                            this.webref.postMessage(JSON.stringify({ fromTrustee : 1, req: tmp, res : resAfterAsk }))
                            if (config.debug.appErrors) {
                                console.log('WalletDappWebView resAfterAsk', resAfterAsk)
                            }
                        })
                    } else {
                        this.webref.postMessage(JSON.stringify({ fromTrustee : 1, req: tmp, res }))
                    }
                }
            } catch (e) {
                console.log('WalletDapp.WebViewScreen.onMessage handle error ' + e.message, tmp)
            }
        }
    }

    // general handler (could be not only wallet connect)
    handleWebViewNavigationTestLink = (req) => {
        Log.log('WalletDapp.WebViewScreen handle link ' + req.url)
        let parsedUrl = false
        let url = false
        try {
            url = req.url
            parsedUrl = UrlParse(url)
            if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                let position = req.url.indexOf('/wc?uri=wc%3A')
                if (position !== -1) {
                    position = position + 8
                    const tmp = req.url.substr(position, req.url.length)
                    Log.log('WalletDapp.WebViewScreen handle link update tmp ' + tmp)
                    url = decodeURIComponent(tmp)
                    Log.log('WalletDapp.WebViewScreen handle link update url ' + url)
                    parsedUrl = UrlParse(url)
                }
            }
            if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                console.log('GO ' + JSON.stringify(parsedUrl))
                return true
            }
        } catch (err) {
            if (config.debug.appErrors) {
                console.log(`WalletDapp.WebViewScreen handle parse error `, err.message)
            }
            Log.log(`WalletDapp.WebViewScreen handle parse error `, err.message)
            return false
        }
        try {
            if (parsedUrl.protocol === 'wc:') {
                walletConnectActions.connectAndSetWalletConnectLink(url, 'DAPP', true, this.props.walletDappData)
            }
        } catch (err) {
            if (config.debug.appErrors) {
                console.log(`WalletDapp.WebViewScreen handle dapp error `, err.message)
            }
            Log.log(`WalletDapp.WebViewScreen handle dapp error `, err.message)
        }
        // this.webref.stopLoading()
        return false
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletDapp.WebViewScreen')

        const { walletHash } = this.props.selectedWalletData
        const { dappCode, dappName, dappUrl } = this.props.walletDappData
        const { walletConnectLink, linkSource } = this.props.walletConnectData
        const { disableInjected, dappNetworks } = dappsBlocksoftDict[dappCode]

        Log.log('WalletDapp.WebViewScreen render ' + dappCode )

        let prepared
        if (typeof disableInjected === 'undefined' || !disableInjected) {
            prepared = INJECTEDJAVASCRIPT
            try {
                if (typeof store.getState().accountStore.accountList[walletHash] !== 'undefined') {
                    if (typeof store.getState().accountStore.accountList[walletHash]['TRX'] !== 'undefined') {
                        const found = store.getState().accountStore.accountList[walletHash]['TRX']
                        TrxDappHandler.init(found)
                        prepared = prepared.replace('TRX_ADDRESS_BASE58', found.address)
                        prepared = prepared.replace('TRX_ADDRESS_HEX', TronUtils.addressToHex(found.address))
                    }

                    let found = false
                    if (typeof dappNetworks !== 'undefined' && dappNetworks) {
                        for (const code of dappNetworks) {
                            if (code === 'TRX') continue
                            if (typeof store.getState().accountStore.accountList[walletHash][code] !== 'undefined') {
                                found = store.getState().accountStore.accountList[walletHash][code]
                                found.code = code
                                break
                            }
                        }
                    }
                    if (!found) {
                        for (const code of ['ETH', 'MATIC', 'BNB_SMART', 'ONE']) {
                            if (typeof store.getState().accountStore.accountList[walletHash][code] !== 'undefined') {
                                found = store.getState().accountStore.accountList[walletHash][code]
                                found.code = code
                                break
                            }
                        }
                        if (found && dappNetworks.length > 0) {
                            const code = dappNetworks[0]
                            if (dappNetworks.length === 1) {
                                found.code = code
                            } else if (code === 'TRX') {
                                found.code = dappNetworks[1]
                            }
                        }
                    }

                    if (found) {
                        prepared = prepared.replace('ETH_ADDRESS_HEX', found.address)
                        const web3 = Web3Injected(found.code)
                        const chainId = BlocksoftUtils.decimalToHexWalletConnect(web3.MAIN_CHAIN_ID)
                        prepared = prepared.replace('ETH_CHAIN_ID_INTEGER', web3.MAIN_CHAIN_ID)
                        prepared = prepared.replace('ETH_CHAIN_ID_HEX', chainId)
                        EthDappHandler.init(found, web3)
                    }
                }
            } catch (e) {
                Log.log('WalletDappWebViewScreen found trx error ' + e.message)
            }
        } else {
            prepared = INJECTEDJAVASCRIPT_SMALL
        }

        let isCurrentDappWalletConnect = false
        if (walletConnectLink) {
            if (linkSource === 'DAPP' || linkSource === 'DAPP_SAVED') {
                isCurrentDappWalletConnect = true
            }
        }

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={dappName}
                titleAction={isCurrentDappWalletConnect ? this.handleChangeNetwork : null}
                titleIconType='downArrow'
            >
                <WebView
                    ref={webView => (this.webref = webView)}
                    source={{ uri: dappUrl }}
                    incognito={false}
                    originWhitelist={['*']}

                    onShouldStartLoadWithRequest={this.handleWebViewNavigationTestLink}

                    injectedJavaScript={prepared}
                    onMessage={this.onMessage}

                    onError={(e) => {
                        Log.log('WalletDapp.WebViewScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.description)
                    }}

                    onHttpError={(e) => {
                        Log.log('WalletDapp.WebViewScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                    }}

                    renderLoading={this.renderLoading}
                    renderError={this.renderError}

                    javaScriptEnabled={true}
                    useWebKit={true}
                    startInLoadingState={true}
                    allowsInlineMediaPlayback={true}
                    allowsBackForwardNavigationGestures={true}

                    usePersistentCookie={true}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    domStorageEnabled={true}

                    userAgent='Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.45 Mobile Safari/537.36'
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
        selectedWalletData: getSelectedWalletData(state),
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
