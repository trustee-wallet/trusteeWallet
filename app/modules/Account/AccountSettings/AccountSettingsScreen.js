/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Linking, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View, SafeAreaView } from 'react-native'




import NavStore from '../../../components/navigation/NavStore'

import AsyncStorage from '@react-native-community/async-storage'

import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import lockScreenAction from '../../../appstores/Stores/LockScreen/LockScreenActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import CashBackSettings from '../../../appstores/Stores/CashBack/CashBackSettings'

import UIDict from '../../../services/UIDict/UIDict'

import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'
import SettingsETH from './elements/SettingsETH'
import SettingsXMR from './elements/SettingsXMR'
import SettingsTRX from './elements/SettingsTRX'
import SettingsBNB from './elements/SettingsBNB'

import config from '../../../config/config'

import { strings } from '../../../services/i18n'
import Toast from '../../../services/UI/Toast/Toast'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'
import AppNotificationListener from '../../../services/AppNotification/AppNotificationListener'

import { ThemeContext } from '../../theme/ThemeProvider'
import Header from '../../../components/elements/new/Header'
import ListItem from '../../../components/elements/new/list/ListItem/Setting'
import MarketingAnalytics from '../../../services/Marketing/MarketingAnalytics'

class AccountSettingScreen extends React.Component {
    constructor() {
        super()
        this.state = {
            devMode: false,
            mode: '',
            testerMode: '',
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('DashboardStack')
    }

    render() {
        const { colors, GRID_SIZE } = this.context

        const { mainStore, cryptoCurrency, account } = this.props

        MarketingAnalytics.setCurrentScreen('Account.AccountSettingsScreen.' + cryptoCurrency.currencyCode)

        const {
            headerHeight,
        } = this.state

        let settingsComponent = null
        if (account.currencyCode === 'BTC') {
            settingsComponent =
                <SettingsBTC containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} />
        } else if (account.currencyCode === 'USDT') {
            settingsComponent =
                <SettingsUSDT containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} account={account} />
        } else if (account.currencyCode === 'ETH') {
            settingsComponent =
                <SettingsETH containerStyle={{ overflow: 'hidden' }} />
        } else if (account.currencyCode === 'XMR') {
            settingsComponent =
                <SettingsXMR containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} account={account} />
        } else if (account.currencyCode === 'TRX') {
            settingsComponent =
                <SettingsTRX containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} account={account} />
        } else if (account.currencyCode === 'BNB') {
            settingsComponent =
                <SettingsBNB containerStyle={{ overflow: 'hidden' }}
                             wallet={mainStore.selectedWallet} account={account} />
        }
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.title')}
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
                        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
                            {settingsComponent}
                        </View>
                    </ScrollView>

                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

AccountSettingScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettingScreen)

const styles = {
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
}
