/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Linking, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View, SafeAreaView } from 'react-native'

import firebase from 'react-native-firebase'


import NavStore from '../../components/navigation/NavStore'

import AsyncStorage from '@react-native-community/async-storage'

import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'

import UIDict from '../../services/UIDict/UIDict'

import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'
import SettingsXMR from './elements/SettingsXMR'
import SettingsTRX from './elements/SettingsTRX'

import config from '../../config/config'

import { strings } from '../../services/i18n'
import Toast from '../../services/UI/Toast/Toast'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Setting'

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

    render() {
        firebase.analytics().setCurrentScreen('Account.SettingScreen')

        const { colors, GRID_SIZE } = this.context

        const { mainStore, cryptoCurrency, account } = this.props

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
        } else if (account.currencyCode === 'XMR') {
            settingsComponent =
                <SettingsXMR containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} account={account} />
        } else if (account.currencyCode === 'TRX') {
            settingsComponent =
                <SettingsTRX containerStyle={{ overflow: 'hidden' }}
                    wallet={mainStore.selectedWallet} account={account} />
        }
        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
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
        lineHeight: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
}
