/**
 * @version 0.14
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

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

class EnterMnemonicPhraseGoogle extends PureComponent {

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

        Log.log('EnterMnemonicPhraseGoogle url', url)
        if (url.indexOf('https://trustee.deals/?code=') === -1) {
            return false
        }

        this.setState({show : false})

        try {
            const checked = await GoogleDrive.checkCode(url)

            if (checked) {
                const files = await GoogleDrive.getFiles()
                if (!files) {
                    // no files shown - go back
                    showModal({
                        type: 'INFO_MODAL',
                        title: strings('walletCreate.importGoogleNoWallet.title'),
                        icon: 'WARNING',
                        description: strings('walletCreate.importGoogleNoWallet.description')
                    }, () => {
                        NavStore.goBack()
                    })
                } else {
                    let selectedFile
                    if (files.length > 1) {
                        const notImported = []
                        for (const file of files) {
                            const fileName = file.name
                            const fileWallet = fileName.split('_remove_trustee_')[1]
                            // @todo from store if (typeof DaemonCache.CACHE_WALLET_NAMES_AND_CB[fileWallet] === 'undefined') {
                                notImported.push(file)
                            //}
                        }
                        if (notImported.length === 0) {
                            selectedFile = files[0] // will autoshow but not import
                        } else if (notImported.length === 1) {
                            selectedFile = notImported[0] // will be selected first not imported
                        } else {
                            // @yura need to show select somehow - temporary also first not imported
                            selectedFile = notImported[0] // will be selected first not imported
                        }
                    } else {
                        selectedFile = files[0] // will autoshow but check later
                    }

                    await GoogleDrive.getMnemonic(selectedFile)
                    NavStore.reset('EnterMnemonicPhrase', {flowSubtype : 'GOOGLE_SUBTYPE'})
                }
            }

        } catch (e) {
            Log.err('EnterMnemonicPhraseGoogle auth error ' + e.message)
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

        MarketingAnalytics.setCurrentScreen('EnterMnemonicPhraseGoogle')

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
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on load end ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                }}
                                renderError={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.render error ' + e)
                                }}
                                onError={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                }}
                                onHttpError={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('EnterMnemonicPhraseGoogle.WebViewMainScreen.on start load with request ' + e.navigationType)
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
    return {}
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EnterMnemonicPhraseGoogle)

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
