/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, Vibration, StyleSheet, Linking } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'

import config from '@app/config/config'

import { strings } from '@app/services/i18n'
import Toast from '@app/services/UI/Toast/Toast'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'
import store from '@app/store'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import Log from '@app/services/Log/Log'

import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import { getWalletsNumber } from '@app/appstores/Stores/Wallet/selectors'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getWalletConnectIsConnected } from '@app/appstores/Stores/WalletConnect/selectors'
import BlocksoftCustomLinks from '@crypto/common/BlocksoftCustomLinks'

import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'
import { LANGUAGE_SETTINGS } from './helpers'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

class SettingsMainScreen extends PureComponent {

    state = {
        devMode: trusteeAsyncStorage.getDevMode(),
        mode: trusteeAsyncStorage.getDevMode() ? config.exchange.mode : '',
        testerMode: trusteeAsyncStorage.getTesterModeStatic() || '',
        useFirebaseForBSE: trusteeAsyncStorage.getUseFirebaseForBSE() || true
    }

    getLangCode = () => {
        const { language } = this.props.settingsData
        const tmpLanguage = LANGUAGE_SETTINGS.find((item) => item.code.split('-')[0] === language.split('-')[0])
        return typeof tmpLanguage === 'undefined' ? 'en-US' : tmpLanguage.code
    }

    handleChangeLockScreenStatus = (_callback) => {
        try {

            const { lockScreenStatus } = this.props.settingsData

            if (+lockScreenStatus) {
                setLockScreenConfig({
                    flowType : LockScreenFlowTypes.DELETE_PINCODE,
                    callback: () => _callback(!lockScreenStatus)
                })
                NavStore.goNext('LockScreen')
            } else {
                const isAllWalletBackUp = this.isAllWalletBackUp()
                if (isAllWalletBackUp) {
                    setLockScreenConfig({
                        flowType : LockScreenFlowTypes.CREATE_PINCODE,
                        callback: () => _callback(!lockScreenStatus)
                    })
                    NavStore.goNext('LockScreen')
                } else {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'INFO',
                        title: strings('modal.exchange.sorry'),
                        description: strings('modal.disabledLockScreenModal.description'),
                    })
                }
                return
            }


        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Settings handleChangeLockScreenStatus error ' + e.message)
            }
            Log.log('Settings handleChangeLockScreenStatus error ' + e.message)
        }

    }

    isAllWalletBackUp = () => {
        const { wallets } = store.getState().walletStore
        for (const wallet of wallets) {
            if (!wallet.walletIsBackedUp) {
                return false
            }
        }
        return true
    }

    handleChangeTouchIDStatus = (_callback) => {
        const { touchIDStatus } = this.props.settingsData
        setLockScreenConfig({
            flowType : LockScreenFlowTypes.CHANGE_TOUCHID_STATUS,
            callback: () => _callback(!touchIDStatus)
        })
        NavStore.goNext('LockScreen')
    }

    changeAskWhenSending = (_callback) => {
        const { askPinCodeWhenSending } = this.props.settingsData
        setLockScreenConfig({
            flowType : LockScreenFlowTypes.CHANGE_ASKING_STATUS,
            callback: () => _callback(!askPinCodeWhenSending)
        })
        NavStore.goNext('LockScreen')
    }

    handleChangePassword = () => {
        setLockScreenConfig({flowType : LockScreenFlowTypes.CHANGE_PINCODE_FIRST_STEP})
        NavStore.goNext('LockScreen')
    }

    handleChangeLang = () => { NavStore.goNext('LanguageListScreen') }

    handleChangeScanner = () => { NavStore.goNext('ScannerSettingsScreen') }

    handleChangeLogging = () => { NavStore.goNext('LoggingSettingsScreen') }

    handleChangeLocalCurrency = () => { NavStore.goNext('LocalCurrencyScreen') }

    handleChangeTheme = (changeTheme) => {
        changeTheme()
        setBseLink(null)
    }

    handleToggleConfig = () => {
        let mode

        if (config.exchange.mode === 'DEV') {
            config.exchange.mode = 'PROD'
            config.cashback.mode = 'PROD'
            mode = 'PROD'
        } else {
            config.exchange.mode = 'DEV'
            config.cashback.mode = 'DEV'
            mode = 'DEV'
        }

        Toast.setMessage(strings('settings.config', { config: mode })).show()

        this.setState({
            mode
        })

        setBseLink(null)

        Vibration.vibrate(100)
    }


    handleToggleTester = async () => {
        let testerMode
        if (this.state.testerMode === 'TESTER') {
            testerMode = 'USER'
            MarketingEvent.initMarketing(testerMode)
        } else {
            testerMode = 'TESTER'
            MarketingEvent.initMarketing(testerMode)
        }

        trusteeAsyncStorage.setTesterMode(testerMode)

        Toast.setMessage(strings('settings.tester', { testerMode })).show()

        this.setState({
            testerMode
        })
        Vibration.vibrate(100)
    }

    toggleDevMode = async () => {
        if (this.state.devMode) {
            this.setState({
                devMode: false,
                mode: ''
            })

            Toast.setMessage('DEV MODE OFF').show()

            await trusteeAsyncStorage.setDevMode('0')
        } else {
            this.setState({
                devMode: true,
                mode: config.exchange.mode
            })

            Toast.setMessage('DEV MODE').show()

            await trusteeAsyncStorage.setDevMode('1')
        }

        await AppNotificationListener.updateSubscriptions()

        Vibration.vibrate(100)
    }


    handleOpenNotifications = () => NavStore.goNext('NotificationsSettingsScreen')

    handleWalletManagement = () => NavStore.goNext('WalletListScreen')

    handleBack = () => NavStore.goBack()

    handleWalletConnect = () => NavStore.goNext('WalletConnectScreen')

    handleFAQ = () => {
        Linking.openURL(BlocksoftCustomLinks.getLink('SOCIAL_LINK_FAQ', this.context.isLight))
    }

    handleCoinSettings = () => NavStore.goNext('GlobalCoinSettings')

    handleClearNotifications = async () => {
        Vibration.vibrate(100)
        await AppNewsActions.markAllAsOpened()
    }

    handleChangeUseFirebaseForBSE = async () => {
        this.setState({
            useFirebaseForBSE: !this.state.useFirebaseForBSE
        })
        trusteeAsyncStorage.setUseFirebaseForBSE(!this.state.useFirebaseForBSE)
        setBseLink(null)
    }


    render() {
        MarketingAnalytics.setCurrentScreen('Settings.SettingsMainScreen')

        let { localCurrency, lockScreenStatus, touchIDStatus, askPinCodeWhenSending } = this.props.settingsData
        const { isWalletConnected, walletsNumber } = this.props

        lockScreenStatus = +lockScreenStatus
        touchIDStatus = +touchIDStatus
        askPinCodeWhenSending = !(typeof askPinCodeWhenSending === 'undefined' || askPinCodeWhenSending === '0')

        const {
            colors,
            GRID_SIZE,
            changeTheme,
            isLight
        } = this.context
        const {
            devMode,
            testerMode,
            mode,
            useFirebaseForBSE
        } = this.state

        // @todo uncomment payment accounts
        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleBack}
                title={strings('settings.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ paddingHorizontal: GRID_SIZE }}>

                        <View style={{ marginVertical: GRID_SIZE }}>
                            <ListItem
                                title={strings('settings.wallets.listTitle')}
                                subtitle={strings('settings.wallets.listSubtitle', { number: walletsNumber })}
                                iconType="wallet"
                                onPress={this.handleWalletManagement}
                                rightContent="arrow"
                            />
                            {false && (
                                <ListItem
                                    title={strings('settings.paymentAccounts.listTitle')}
                                    subtitle={strings('settings.paymentAccounts.listSubtitle', { number: 0 })}
                                    iconType="accounts"
                                    onPress={null}
                                    rightContent="arrow"
                                    last
                                />
                            )}
                            <ListItem
                                title={strings('settings.walletConnect.title')}
                                subtitle={strings(`settings.walletConnect.${isWalletConnected ? 'activated' : 'disabled'}`)}
                                iconType="walletConnect"
                                onPress={this.handleWalletConnect}
                                rightContent="arrow"
                                last
                            />
                        </View>


                        <View style={{ marginVertical: GRID_SIZE }}>
                            <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('settings.security.title')}</Text>
                            <ListItem
                                title={strings('settings.security.lock')}
                                iconType="pinCode"
                                onPress={this.handleChangeLockScreenStatus}
                                rightContent="switch"
                                switchParams={{ value: !!lockScreenStatus, onPress: this.handleChangeLockScreenStatus }}
                            />
                            <ListItem
                                title={strings('settings.security.change')}
                                iconType="changePinCode"
                                onPress={this.handleChangePassword}
                                rightContent="arrow"
                                disabled={!lockScreenStatus}
                            />
                            <ListItem
                                title={strings('settings.security.touch')}
                                iconType="biometricLock"
                                onPress={this.handleChangeTouchIDStatus}
                                rightContent="switch"
                                disabled={!lockScreenStatus}
                                switchParams={{ value: !!lockScreenStatus && !!touchIDStatus, onPress: this.handleChangeTouchIDStatus }}
                            />
                            <ListItem
                                title={strings('settings.security.askPINCodeToSend')}
                                subtitle={strings('settings.security.askPINCodeSubtitle')}
                                iconType="transactionConfirmation"
                                onPress={this.changeAskWhenSending}
                                rightContent="switch"
                                disabled={!lockScreenStatus}
                                switchParams={{ value: !!lockScreenStatus && !!askPinCodeWhenSending, onPress: this.changeAskWhenSending }}
                                last
                            />
                        </View>

                        <View style={{ marginVertical: GRID_SIZE }}>
                            <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('settings.other.title')}</Text>
                            {devMode && (
                                <ListItem
                                    title={strings('settings.other.configMode')}
                                    subtitle={mode}
                                    iconType="config"
                                    onPress={null}
                                    onLongPress={this.handleToggleConfig}
                                    delayLongPress={1000}
                                />
                            )}
                            {(devMode || testerMode === 'TESTER') && (
                                <ListItem
                                    title={strings('settings.other.testerMode')}
                                    subtitle={testerMode}
                                    iconType="testerMode"
                                    onPress={null}
                                    onLongPress={this.handleToggleTester}
                                    delayLongPress={1000}
                                />
                            )}
                            <ListItem
                                title={strings('settings.other.darkModeTitle')}
                                subtitle={strings(`settings.other.${isLight ? 'darkModeDisabledSubtitle' : 'darkModeEnabledSubtitle'}`)}
                                iconType="darkMode"
                                onPress={() => this.handleChangeTheme(changeTheme)}
                                rightContent="switch"
                                switchParams={{ value: !isLight, onPress: () => this.handleChangeTheme(changeTheme) }}
                            />
                            <ListItem
                                title={strings('settings.other.notifications')}
                                iconType="notifications"
                                onPress={this.handleOpenNotifications}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.localCurrency')}
                                subtitle={localCurrency}
                                iconType="localCurrency"
                                onPress={this.handleChangeLocalCurrency}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.lang')}
                                subtitle={strings(`languageList.languages.${this.getLangCode()}`)?.toUpperCase()}
                                iconType="language"
                                onPress={this.handleChangeLang}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.scannerSettings')}
                                subtitle={strings('settings.other.scannerSubtitle')}
                                iconType="scanning"
                                onPress={this.handleChangeScanner}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.blockchainExplorer')}
                                iconType="about"
                                onPress={this.handleCoinSettings}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.loggingSettings')}
                                subtitle={strings('settings.other.loggingSubtitle')}
                                iconType="shareLogs"
                                onPress={this.handleChangeLogging}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.useFirebaseForBSE')}
                                subtitle={strings('settings.other.' + (useFirebaseForBSE ? 'enabledUseFirebaseForBSE' : 'disabledUseFirebaseForBSE'))}
                                iconType="testerMode"
                                onPress={this.handleChangeUseFirebaseForBSE}
                                rightContent="switch"
                                switchParams={{ value: !!useFirebaseForBSE, onPress: this.handleChangeUseFirebaseForBSE }}
                            />
                            <ListItem
                                title={strings('settings.other.faqSettings')}
                                subtitle={strings('settings.other.faqSubtitle')}
                                iconType="faq"
                                onPress={this.handleFAQ}
                                rightContent="arrow"
                            />
                            <ListItem
                                title={strings('settings.other.about')}
                                iconType="about"
                                onPress={() => { NavStore.goNext('AboutScreen') }}
                                onLongPress={this.toggleDevMode}
                                rightContent="arrow"
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
        settingsData: getSettingsScreenData(state),
        walletsNumber: getWalletsNumber(state),
        isWalletConnected : getWalletConnectIsConnected(state)
    }
}

SettingsMainScreen.contextType = ThemeContext

export default connect(mapStateToProps)(SettingsMainScreen)

const styles = StyleSheet.create({
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
