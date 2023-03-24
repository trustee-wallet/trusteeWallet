/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'

import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import config from '@app/config/config'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

class NotificationsSettingScreen extends PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    async componentDidMount() {
        if (MarketingEvent.DATA.LOG_TOKEN === 'NO_GOOGLE') {
            await this.handleAllChangeNotifications('0')
        }
    }

    handleChangeAllNotifications = async (value = false) => {
        try {
            const { notifsStatus } = this.props.settingsData
            await settingsActions.setSettingKeyArray({
                'notifsStatus': value || (notifsStatus ? '0' : '1'),
                'transactionsNotifs': value || (notifsStatus ? '0' : '1'),
                'exchangeRatesNotifs': value || (notifsStatus ? '0' : '1'),
                'newsNotifs': value || (notifsStatus ? '0' : '1')
            })
            await AppNotificationListener.updateSubscriptionsLater()
            AppNewsActions.updateSettings()
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NotificationsScreen.handleChangeNotifications error ' + e.message)
            }
        }
    }

    handleChangeTransactions = async () => {
        const { transactionsNotifs, newsNotifs, exchangeRatesNotifs } = this.props.settingsData
        await settingsActions.setSettingKeyArray({
            'transactionsNotifs': transactionsNotifs ? '0' : '1',
            'notifsStatus': exchangeRatesNotifs * 1 === 1 && !transactionsNotifs * 1 === 1 && newsNotifs * 1 === 1 ? '1' : '0'
        })

        await AppNotificationListener.updateSubscriptionsLater()
    }

    handleChangeRates = async () => {
        const {
            transactionsNotifs,
            exchangeRatesNotifs,
            newsNotifs
        } = this.props.settingsData

        await settingsActions.setSettingKeyArray({
            'exchangeRatesNotifs': exchangeRatesNotifs ? '0' : '1',
            'notifsStatus': !exchangeRatesNotifs * 1 === 1 && transactionsNotifs * 1 === 1 && newsNotifs * 1 === 1 ? '1' : '0'
        })
        await AppNotificationListener.updateSubscriptionsLater()
        AppNewsActions.updateSettings()
    }

    handleChangeNews = async () => {
        const { newsNotifs, transactionsNotifs, exchangeRatesNotifs } = this.props.settingsData
        await settingsActions.setSettingKeyArray({
            'newsNotifs': newsNotifs ? '0' : '1',
            'notifsStatus': exchangeRatesNotifs * 1 === 1 && transactionsNotifs * 1 === 1 && !newsNotifs * 1 === 1 ? '1' : '0'
        })
        await AppNotificationListener.updateSubscriptionsLater()
    }

    handleChangeNotifications = async () => {
        if (MarketingEvent.DATA.LOG_TOKEN === 'NO_GOOGLE') {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.notification'),
                description: strings('modal.notification.description')
            })

            return
        }

        await this.handleChangeAllNotifications()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.NotificationsSettingScreen')

        const { colors, GRID_SIZE } = this.context

        const {
            notifsStatus,
            transactionsNotifs,
            exchangeRatesNotifs,
            newsNotifs
        } = this.props.settingsData

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.notifications.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ paddingHorizontal: GRID_SIZE }}>

                        <View style={{ marginVertical: GRID_SIZE }}>
                            <ListItem
                                title={strings('settings.notifications.allNotificationsTitle')}
                                iconType='notifications'
                                onPress={this.handleChangeNotifications}
                                rightContent='switch'
                                switchParams={{ value: notifsStatus, onPress: this.handleChangeNotifications }}
                                last
                            />
                        </View>

                        <View style={{ marginVertical: GRID_SIZE }}>
                            <Text style={[styles.blockTitle, {
                                color: colors.common.text3,
                                marginLeft: GRID_SIZE,
                                marginBottom: GRID_SIZE / 2
                            }]}>{strings('settings.notifications.additional')}</Text>
                            <ListItem
                                title={strings('settings.notifications.transactionsTitle')}
                                subtitle={strings('settings.notifications.transactionsSubtitle')}
                                iconType='transactions'
                                onPress={this.handleChangeTransactions}
                                rightContent='switch'
                                switchParams={{
                                    value: transactionsNotifs,
                                    onPress: this.handleChangeTransactions
                                }}
                            />
                            <ListItem
                                title={strings('settings.notifications.exchangeRatesTitle')}
                                subtitle={strings('settings.notifications.exchangeRateSubtitle')}
                                iconType='exchangeRates'
                                onPress={this.handleChangeRates}
                                rightContent='switch'
                                switchParams={{
                                    value: exchangeRatesNotifs,
                                    onPress: this.handleChangeRates
                                }}
                            />
                            <ListItem
                                title={strings('settings.notifications.newsTitle')}
                                iconType='news'
                                onPress={this.handleChangeNews}
                                rightContent='switch'
                                switchParams={{ value: newsNotifs, onPress: this.handleChangeNews }}
                                last
                            />
                        </View>

                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsData: getSettingsScreenData(state)
    }
}

NotificationsSettingScreen.contextType = ThemeContext

export default connect(mapStateToProps)(NotificationsSettingScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    }
})
