
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet
} from 'react-native'
import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import AsyncStorage from '@react-native-community/async-storage'

import { strings } from '../../services/i18n'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Setting'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'


class NotificationsSettingScreen extends React.Component {
    state = {
        headerHeight: 0
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    handleChangeNotifications = async () => {
        const { notifsStatus } = this.props.settings
        await settingsActions.setSettings('notifsStatus', +notifsStatus ? '0' : '1')
        await settingsActions.setSettings('transactionsNotifs', +notifsStatus ? '0' : '1')
        await settingsActions.setSettings('exchangeRatesNotifs', +notifsStatus ? '0' : '1')
        await settingsActions.setSettings('newsNotifs', +notifsStatus ? '0' : '1')
        // use "later" function as usual makes some mess when a lot of clicking
        await AppNotificationListener.updateSubscriptionsLater()
    }

    handleChangeTransactions = async () => {
        const { transactionsNotifs } = this.props.settings
        await settingsActions.setSettings('transactionsNotifs', +transactionsNotifs ? '0' : '1')
        await AppNotificationListener.updateSubscriptionsLater()
    }

    handleChangeRates = async () => {
        const { exchangeRatesNotifs } = this.props.settings
        await settingsActions.setSettings('exchangeRatesNotifs', +exchangeRatesNotifs ? '0' : '1')
        await AppNotificationListener.updateSubscriptionsLater()
    }

    handleChangeNews = async () => {
        const { newsNotifs } = this.props.settings
        await settingsActions.setSettings('newsNotifs', +newsNotifs ? '0' : '1')
        await AppNotificationListener.updateSubscriptionsLater()
    }

    render() {
        firebase.analytics().setCurrentScreen('Settings.NotificationsSettingScreen')

        const { colors, GRID_SIZE } = this.context
        const { headerHeight } = this.state

        const {
            notifsStatus,
            transactionsNotifs,
            exchangeRatesNotifs,
            newsNotifs,
        } = this.props.settings
        const notificationsEnabled = notifsStatus === '1'
        const transactionsNotifications = transactionsNotifs === '1'
        const exchangeRatesNotifications = exchangeRatesNotifs === '1'
        const newsNotifications = newsNotifs === '1'


        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.notifications.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ paddingHorizontal: GRID_SIZE }}>

                            <View style={{ marginVertical: GRID_SIZE }}>
                                <ListItem
                                    title={strings('settings.notifications.allNotificationsTitle')}
                                    iconType="notifications"
                                    onPress={this.handleChangeNotifications}
                                    rightContent="switch"
                                    switchParams={{ value: notificationsEnabled, onPress: this.handleChangeNotifications }}
                                    last
                                />
                            </View>

                            <View style={{ marginVertical: GRID_SIZE }}>
                                <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginBottom: GRID_SIZE / 2 }]}>{strings('settings.notifications.additional')}</Text>
                                <ListItem
                                    title={strings('settings.notifications.transactionsTitle')}
                                    subtitle={strings('settings.notifications.transactionsSubtitle')}
                                    iconType="transactions"
                                    onPress={this.handleChangeTransactions}
                                    rightContent="switch"
                                    disabled={!notificationsEnabled}
                                    switchParams={{ value: notificationsEnabled && transactionsNotifications, onPress: this.handleChangeTransactions }}
                                />
                                <ListItem
                                    title={strings('settings.notifications.exchangeRatesTitle')}
                                    subtitle={strings('settings.notifications.exchangeRateSubtitle')}
                                    iconType="exchangeRates"
                                    onPress={this.handleChangeRates}
                                    rightContent="switch"
                                    disabled={!notificationsEnabled}
                                    switchParams={{ value: notificationsEnabled && exchangeRatesNotifications, onPress: this.handleChangeRates }}
                                />
                                <ListItem
                                    title={strings('settings.notifications.newsTitle')}
                                    iconType="news"
                                    onPress={this.handleChangeNews}
                                    rightContent="switch"
                                    disabled={!notificationsEnabled}
                                    switchParams={{ value: notificationsEnabled && newsNotifications, onPress: this.handleChangeNews }}
                                    last
                                />
                            </View>

                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore.data
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

NotificationsSettingScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsSettingScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
})
