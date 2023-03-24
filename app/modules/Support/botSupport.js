/**
 * @version 0.43
 * @author yura
 * @description ksu jumping
 */
import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Linking,
    TouchableOpacity
} from 'react-native'

import { WebView } from 'react-native-webview'
import UrlParse from 'url-parse'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftCustomLinks from '@crypto/common/BlocksoftCustomLinks'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

class BotSupportScreen extends React.PureComponent {
    state = {
        url: ' ',
        title: ' ',
    }

    async componentDidMount() {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        this.setState({
            url: link,
            title: strings('settings.about.contactSupportTitle')
        })
    }

    handleBack = () => {
        this.props.navigation.jumpTo('HomeScreen')
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

    handleSupportEmail = () => {
        Linking.openURL('mailto: ' + BlocksoftExternalSettings.getStatic('SUPPORT_EMAIL'))
    }

    handleSite = () => {
        const link = `${BlocksoftCustomLinks.getLink('SOCIAL_LINK_SITE', this.context.isLight)}`
        if (typeof link !== 'undefined' && link && link.indexOf('https://') !== -1) {
            Linking.openURL(BlocksoftCustomLinks.getLink('SOCIAL_LINK_SITE', this.context.isLight))
        } else {
            Linking.openURL(`https://${BlocksoftCustomLinks.getLink('SOCIAL_LINK_SITE', this.context.isLight)}`)
        }
    }

    render() {
        const { title, url } = this.state

        MarketingAnalytics.setCurrentScreen('SupportScreen')

        return (
            <ScreenWrapper
                title={title}
            >
                <WebView
                    source={{ uri: url }}
                    originWhitelist={['*']}
                    onShouldStartLoadWithRequest={this.test}
                    startInLoadingState

                    onError={(e) => {
                        if (typeof e?.nativeEvent?.description !== 'undefined' && e?.nativeEvent?.description && e?.nativeEvent?.description.indexOf('net::ERR_UNKNOWN_URL_SCHEME') !== -1) {
                            Linking.openURL(this.state.url)
                        } else {
                            // do nothing
                            // Log.err('Support.WebViewScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.description)
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
                <Text style={[styles.errorText, { color: colors.common.text2 }]}>{strings('settings.about.contactSupportTitle')}</Text>
                <View style={styles.errorDescription}>
                    <Text style={[styles.errorTextInner, { color: colors.common.text2 }]}>
                        {strings('settings.about.contactSupportLoadingText')}
                    </Text>
                    <TouchableOpacity onPress={this.handleSite}>
                        <Text style={[styles.errorTextLink, { color: colors.common.checkbox.bgChecked }]}>
                            {BlocksoftExternalSettings.getStatic('SOCIAL_LINK_SITE')}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.errorTextInner, { color: colors.common.text2, marginTop: 16 }]}>
                        {strings('settings.about.contactSupportLoadingTextEmail')}
                    </Text>
                    <TouchableOpacity onPress={this.handleSupportEmail}>
                        <Text style={[styles.errorTextLink, { color: colors.common.checkbox.bgChecked }]}>
                            {BlocksoftExternalSettings.getStatic('SUPPORT_EMAIL')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

BotSupportScreen.contextType = ThemeContext

export default BotSupportScreen

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
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 18,
        lineHeight: 20,
    },
    errorTextInner: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'center'
    },
    errorTextLink: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        textDecorationLine: 'underline'
    },
    errorDescription: {
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    link: {
        marginTop: 16
    }
})
