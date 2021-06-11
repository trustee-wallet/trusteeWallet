/**
 * @version 0.44
 * @author ksu
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import { View, Dimensions, KeyboardAvoidingView, Platform } from 'react-native'

import GoogleDrive from '@app/services/Back/Google/GoogleDrive'
import Log from '@app/services/Log/Log'

import { WebView } from 'react-native-webview'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

class BackupStepGoogle extends PureComponent {

    constructor() {
        super()
        this.state = {
            show: 1,
            apiUrl: GoogleDrive.getLink()
        }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    handleWebViewNavigationStateChange = async newNavState => {

        const { url } = newNavState

        if (!url) return

        Log.log('BackupStepGoogle url', url)
        if (url.indexOf('https://trustee.deals/?code=') === -1) {
            return false
        }

        this.setState({ show: false })
        try {
            const checked = await GoogleDrive.checkCode(url)

            if (checked) {

                const selectedWallet = this.props.selectedWallet
                const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(selectedWallet.walletHash, 'BackupStepGoogle.navigatorChange')

                const files = await GoogleDrive.getFiles(selectedWallet.walletHash)
                if (files) {
                    // no files shown - go back
                    showModal({
                        type: 'INFO_MODAL',
                        title: strings('walletCreate.backupGoogleHasWallet.title'),
                        icon: 'WARNING',
                        description: strings('walletCreate.backupGoogleHasWallet.description')
                    }, () => {
                        NavStore.goBack()
                    })
                } else {
                    await GoogleDrive.saveMnemonic(selectedWallet.walletHash, mnemonic)
                    showModal({
                        type: 'INFO_MODAL',
                        title: strings('walletCreate.backupGoogleSuccess.title'),
                        icon: 'success',
                        description: strings('walletCreate.backupGoogleSuccess.description')
                    }, () => {
                        NavStore.goBack()
                    })
                }
            }

        } catch (e) {
            Log.err('BackupStepGoogle auth error ' + e.message)
            showModal({
                type: 'INFO_MODAL',
                title: strings('walletCreate.importGoogleError.title'),
                icon: 'WARNING',
                description: strings('walletCreate.importGoogleError.description')
            }, () => {
                NavStore.goBack()
            })
        }

    }

    render() {

        MarketingAnalytics.setCurrentScreen('BackupStepGoogle')

        return (
            <ScreenWrapper
                rightType="close"
                rightAction={this.closeAction}
                title={strings('walletCreate.importGoogle')}
            >
                <View style={{ flex: 1, position: 'relative', marginTop: 80 }}>
                    {this.state.show ?
                        <KeyboardAvoidingView
                            behavior={Platform.select({ ios: 'height', android: 'height' })}
                            enabled={false}
                            hideKeyboardAccessoryView={false}
                            contentContainerStyle={{ flex: 1 }}
                            style={{ flexGrow: 1 }}>
                            <WebView
                                ref={webView => (this.webref = webView)}

                                useWebKit
                                sharedCookiesEnabled
                                source={{ uri: this.state.apiUrl }}
                                mixedContentMode="compatibility"
                                javaScriptEnabled
                                javaScriptEnabledAndroid
                                bounces
                                userAgent="Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19"
                                domStorageEnabled
                                thirdPartyCookiesEnabled
                                originWhitelist={['*']}
                                style={{ flex: 1 }}
                                onNavigationStateChange={this.handleWebViewNavigationStateChange}
                                onLoadEnd={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                }}
                                renderError={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.render error ' + e)
                                }}
                                onError={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                }}
                                onHttpError={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('BackupStepGoogle.WebViewMainScreen.on start load with request ' + e.navigationType)
                                    return true
                                }}
                                startInLoadingState={true}
                            />
                        </KeyboardAvoidingView> : null}
                </View>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore.data,
        selectedWallet: state.mainStore.selectedWallet,
        createWalletStore: state.createWalletStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BackupStepGoogle)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#fff'
    },
    wrapper__scrollView: {
        marginTop: 80
    }
}
