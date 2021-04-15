
import React from 'react'
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ActivityIndicator,
    Linking
} from 'react-native'


import { WebView } from 'react-native-webview'
import UrlParse from 'url-parse'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import Log from '../../services/Log/Log'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'

class WebViewScreen extends React.PureComponent {
    state = {
        headerHeight: 0,
        url: NavStore.getParamWrapper(this,'url', ''),
        title: NavStore.getParamWrapper(this,'title', ''),
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => {
        const prev = NavStore.getParamWrapper(this, 'backOnClose')
        if (prev) {
            NavStore.goBack()
        } else {
            NavStore.reset('HomeScreen')
        }
    }

    test = async (req) => {
        // console.log('WebView.WebViewMainScreen.on start load with request ' + req.navigationType + ' ' + req.url)
        const parsedUrl = UrlParse(req.url)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' || !parsedUrl.slashes) return true
        try {
            const available = await Linking.canOpenURL(req.url)
            if (!available) return true
            await Linking.openURL(req.url)
            this.handleBack()
            return false
        } catch (err) {
            return true
        }
    }

    render() {
        const { colors } = this.context
        const { headerHeight, title, url } = this.state

        MarketingAnalytics.setCurrentScreen('WebViewScreen')

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={title}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <WebView
                        source={{ uri: url }}
                        originWhitelist={['*']}
                        onShouldStartLoadWithRequest={this.test}
                        startInLoadingState

                        onError={(e) => {
                            if (e.nativeEvent.description.indexOf('net::ERR_UNKNOWN_URL_SCHEME') !== -1) {
                                Linking.openURL(this.state.url)
                            } else {
                                Log.err('WebView.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.description)
                            }
                        }}

                        /*
                        onHttpError={(e) => {
                            console.log('WebView.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                        }}
                        onLoadProgress={(e) => {
                            console.log('WebView.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.progress)
                        }}
                        onContentProcessDidTerminate={(e) => {
                            console.log('WebView.WebViewMainScreen.on content terminate ' + e.nativeEvent.title)
                        }}

                        onNavigationStateChange={(e) => {
                            console.log('WebView.WebViewMainScreen.on NavigationStateChanges changed ' + e.title + ' ' + e.url)
                        }}
                        */

                        renderLoading={this.renderLoading}
                        renderError={(e) => {
                            //Log.err('WebView.WebViewMainScreen.render error ' + e)
                            return this.renderError()
                        }}
                    />
                </SafeAreaView>
            </View>
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

WebViewScreen.contextType = ThemeContext

export default WebViewScreen

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
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
