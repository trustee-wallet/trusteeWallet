/**
 * @version 0.9
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    Vibration,
    SafeAreaView,
    StyleSheet
} from 'react-native'
import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import AsyncStorage from '@react-native-community/async-storage'

import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'

import config from '../../config/config'

import { strings } from '../../services/i18n'
import Toast from '../../services/UI/Toast/Toast'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Setting'


class SettingsMainScreen extends React.Component {
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

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        const devMode = await AsyncStorage.getItem('devMode')
        const testerMode = await AsyncStorage.getItem('testerMode')

        if (devMode && devMode.toString() === '1') {
            config.devMode = true
        }

        if (typeof config.devMode !== 'undefined') {
            this.setState({
                devMode: true,
                mode: config.exchange.mode,
                testerMode: testerMode
            })
        }
    }

    getLangCode = () => {
        const { languageList } = config.language
        const { language } = this.props.settings.data

        const tmpLanguage = languageList.find((item) => item.code.split('-')[0] === language.split('-')[0])

        return typeof tmpLanguage === 'undefined' ? 'en-US' : tmpLanguage.code
    }

    handleChangeLockScreenStatus = () => {

        const { lock_screen_status } = this.props.settings.data

        if (+lock_screen_status) {

            lockScreenAction.setFlowType({
                flowType: 'DELETE_PINCODE'
            })

            NavStore.goNext('LockScreen')

        } else {

            const isAllWalletBackUp = this.isAllWalletBackUp()

            if (isAllWalletBackUp) {
                lockScreenAction.setFlowType({
                    flowType: 'CREATE_PINCODE'
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

        NavStore.goNext('LockScreen')

    }

    isAllWalletBackUp = () => {
        const walletList = JSON.parse(JSON.stringify(this.props.walletStore.wallets))

        for (const wallet of walletList) {
            if (!wallet.walletIsBackedUp) {
                return false
            }
        }

        return true
    }

    handleChangeTouchIDStatus = () => {
        lockScreenAction.setFlowType({
            flowType: 'CHANGE_TOUCHID_STATUS'
        })
        NavStore.goNext('LockScreen')
    }


    changeAskWhenSending = () => {
        lockScreenAction.setFlowType({
            flowType: 'CHANGE_ASKING_STATUS'
        })
        NavStore.goNext('LockScreen')
    }

    handleChangePassword = () => {
        lockScreenAction.setFlowType({
            flowType: 'CHANGE_PASSWORD_FIRST_STEP'
        })
        NavStore.goNext('LockScreen')
    }

    handleChangeLang = () => { NavStore.goNext('LanguageListScreen') }

    handleChangeScanner = () => { NavStore.goNext('ScannerSettingsScreen') }

    // TODO: implement somewhere ?
    // handleReferral = () => {
    //     MarketingEvent.logEvent('taki_cashback_1_click', {})
    //     NavStore.goNext('CashbackScreen')
    // }

    // handleBackup = () => {
    //     setFlowType({
    //         flowType: 'BACKUP_WALLET'
    //     })
    //     NavStore.goNext('BackupStep0Screen')
    // }

    // handleImport = () => {
    //     setFlowType({
    //         flowType: 'IMPORT_WALLET'
    //     })
    //     setWalletName({ walletName: '' })
    //     NavStore.goNext('EnterMnemonicPhrase')
    // }

    // handleCreate = () => {
    //     setFlowType({
    //         flowType: 'CREATE_NEW_WALLET'
    //     })
    //     setWalletName({ walletName: '' })
    //     setMnemonicLength({ mnemonicLength: 128 })
    //     NavStore.goNext('BackupStep0Screen')
    // }

    handleChangeLocalCurrency = () => { NavStore.goNext('LocalCurrencyScreen') }

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

        CashBackSettings.init()
        ExchangeActions.init()

        Vibration.vibrate(100)
    }

    handleToggleTester = async () => {
        let testerMode = await AsyncStorage.getItem('testerMode')

        if (testerMode === 'TESTER') {
            testerMode = 'USER'
            MarketingEvent.initMarketing(testerMode)
        } else {
            testerMode = 'TESTER'
            MarketingEvent.initMarketing(testerMode)
        }

        await AsyncStorage.setItem('testerMode', testerMode)

        Toast.setMessage(strings('settings.tester', { testerMode })).show()

        this.setState({
            testerMode
        })
        Vibration.vibrate(100)
    }

    toggleDevMode = async () => {
        if (config.devMode) {
            config.devMode = false

            this.setState({
                devMode: false,
                mode: config.exchange.mode
            })

            Toast.setMessage('DEV MODE OFF').show()

            await AsyncStorage.setItem('devMode', '0')
        } else {
            config.devMode = true

            this.setState({
                devMode: true,
                mode: config.exchange.mode
            })

            Toast.setMessage('DEV MODE').show()

            await AsyncStorage.setItem('devMode', '1')
        }

        await AppNotificationListener.updateSubscriptions()

        Vibration.vibrate(100)
    }


    handleOpenNotifications = () => { NavStore.goNext('NotificationsSettingsScreen') }

    handleWalletManagment = () => { NavStore.goNext('WalletListScreen') }

    handleBack = () => { NavStore.goBack() }

    render() {
        firebase.analytics().setCurrentScreen('Settings.SettingsMainScreen')

        let {
            lock_screen_status,
            touchID_status,
            local_currency: localCurrency,
            askPinCodeWhenSending
        } = this.props.settings.data

        const { mainStore } = this.props

        lock_screen_status = +lock_screen_status
        touchID_status = +touchID_status

        const tmpAskPinCodeWhenSending = !(typeof askPinCodeWhenSending === 'undefined' || askPinCodeWhenSending === '0')

        const {
            colors,
            GRID_SIZE,
            changeTheme,
            isLight
        } = this.context
        const {
            headerHeight,
            devMode,
            testerMode,
            mode,
        } = this.state

        // @todo uncomment payment accounts
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
                        <View style={{ paddingHorizontal: GRID_SIZE }}>

                            <View style={{ marginVertical: GRID_SIZE }}>
                                <ListItem
                                    title={strings('settings.wallets.listTitle')}
                                    subtitle={strings('settings.wallets.listSubtitle', { number: this.props.walletStore.wallets.length })}
                                    iconType="wallet"
                                    onPress={this.handleWalletManagment}
                                    rightContent="arrow"
                                    last
                                />
                                { false ? (
                                    <ListItem
                                    title={strings('settings.paymentAccounts.listTitle')}
                                    subtitle={strings('settings.paymentAccounts.listSubtitle', { number: 0 })}
                                    iconType="accounts"
                                    onPress={null}
                                    rightContent="arrow"
                                    last
                                />
                                ) : null }
                            </View>


                            <View style={{ marginVertical: GRID_SIZE }}>
                                <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('settings.security.title')}</Text>
                                <ListItem
                                    title={strings('settings.security.lock')}
                                    iconType="pinCode"
                                    onPress={this.handleChangeLockScreenStatus}
                                    rightContent="switch"
                                    switchParams={{ value: !!lock_screen_status, onPress: this.handleChangeLockScreenStatus }}
                                />
                                <ListItem
                                    title={strings('settings.security.touch')}
                                    iconType="biometricLock"
                                    onPress={this.handleChangeTouchIDStatus}
                                    rightContent="switch"
                                    disabled={!lock_screen_status}
                                    switchParams={{ value: !!lock_screen_status && !!touchID_status, onPress: this.handleChangeTouchIDStatus }}
                                />
                                <ListItem
                                    title={strings('settings.security.askPINCodeToSend')}
                                    subtitle={strings('settings.security.askPINCodeSubtitle')}
                                    iconType="transactionConfirmation"
                                    onPress={this.changeAskWhenSending}
                                    rightContent="switch"
                                    disabled={!lock_screen_status}
                                    switchParams={{ value: !!lock_screen_status && !!tmpAskPinCodeWhenSending, onPress: this.changeAskWhenSending }}
                                />
                                <ListItem
                                    title={strings('settings.security.change')}
                                    iconType="changePinCode"
                                    onPress={this.handleChangePassword}
                                    rightContent="arrow"
                                    disabled={!lock_screen_status}
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
                                    onPress={changeTheme}
                                    rightContent="switch"
                                    switchParams={{ value: !isLight, onPress: changeTheme }}
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
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        walletStore: state.walletStore,
        settings: state.settingsStore,
        appNewsList: state.appNewsStore.appNewsList
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsMainScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(SettingsMainScreen)

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
