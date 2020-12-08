
import React from 'react'
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
} from 'react-native'
import firebase from 'react-native-firebase'
import { WebView } from 'react-native-webview'

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
                        style={{ flex: 1 }}
                    />
                </SafeAreaView>
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
})
