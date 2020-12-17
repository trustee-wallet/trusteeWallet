
import React from 'react'
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ActivityIndicator,
    Linking
} from 'react-native'
import firebase from 'react-native-firebase'
import { WebView } from 'react-native-webview'
import UrlParse from 'url-parse'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'


class WebViewScreen extends React.Component {
    state = {
        headerHeight: 0,
        url: this.props.navigation.getParam('url', ''),
        title: this.props.navigation.getParam('title', ''),
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    test = async (req) => {
        const parsedUrl = UrlParse(req.url)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' || !parsedUrl.slashes) return true

        try {
            await Linking.openURL(req.url)
            this.handleBack()
            return false
        } catch (err) {
            return true
        }
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const { headerHeight, title, url } = this.state

        firebase.analytics().setCurrentScreen('WebViewScreen')

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
                        renderLoading={this.renderLoading}
                        renderError={this.renderError}
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
                <Text style={[styles.errorText, { color: colors.common.text2 }]}>Oops... Something went wrong</Text>
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
