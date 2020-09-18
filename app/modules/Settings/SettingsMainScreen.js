/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'
import { View, Text, ScrollView, TouchableOpacity, Linking, Switch, Vibration, Dimensions, PixelRatio } from 'react-native'

import firebase from 'react-native-firebase'


import NavStore from '../../components/navigation/NavStore'
import Icon from '../../components/elements/CustomIcon.js'

import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import Ionicons from 'react-native-vector-icons/Ionicons'

import AsyncStorage from '@react-native-community/async-storage'

import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setFlowType, setMnemonicLength, setWalletName } from '../../appstores/Stores/CreateWallet/CreateWalletActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'

import { strings } from '../../services/i18n'
import Navigation from '../../components/navigation/Navigation'
import Toast from '../../services/UI/Toast/Toast'

import Log from '../../services/Log/Log'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'

import config from '../../config/config'

import MarketingEvent from '../../services/Marketing/MarketingEvent'
import SendLog from '../../services/Log/SendLog'
import prettyShare from '../../services/UI/PrettyShare/PrettyShare'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class SettingsMainScreen extends Component {

    constructor() {
        super()
        this.state = {
            devMode: false,
            mode: '',
            testerMode: ''
        }
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


    getScannerCode = () => {
        let { scannerCode } = this.props.settings.data
        if (!scannerCode) scannerCode = '1min'
        return scannerCode
    }

    handleBackup = () => {
        setFlowType({
            flowType: 'BACKUP_WALLET'
        })
        NavStore.goNext('BackupStep0Screen')
    }

    handleImport = () => {
        setFlowType({
            flowType: 'IMPORT_WALLET'
        })
        setWalletName({ walletName: '' })
        NavStore.goNext('EnterMnemonicPhrase')
    }

    handleCreate = () => {
        setFlowType({
            flowType: 'CREATE_NEW_WALLET'
        })
        setWalletName({ walletName: '' })
        setMnemonicLength({ mnemonicLength: 128 })
        NavStore.goNext('BackupStep0Screen')
    }

    handleSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'SETTINGS' })
        Linking.openURL(link)
    }

    handleLogs = async () => {

        let deviceToken = ''
        try {
            deviceToken = await AsyncStorage.getItem('pushToken')
        } catch (e) {
            // do nothing
        }

        setLoaderStatus(true)

        SendLog.getAll().then(async (shareOptions) => {
            await prettyShare(shareOptions)
            setLoaderStatus(false)
        }).catch(function(e) {
            setLoaderStatus(false)

            let text = e.message || JSON.stringify(e.error).substr(0, 100)
            let log = e.message
            if (typeof (e.error) !== 'undefined') {
                if (e.error.toString().indexOf('No Activity') !== -1) {
                    text = strings('modal.walletLog.noMailApp')
                } else if (!text) {
                    text = JSON.stringify(e.error).substr(0, 100)
                }
                log += ' ' + JSON.stringify(e.error)
            }

            if (typeof (e.error) !== 'undefined' && e.error.toString().indexOf('No Activity') !== -1) {
                text = strings('modal.walletLog.noMailApp')

            }
            if (text.indexOf('User did not share') !== -1) {
                text = strings('modal.walletLog.notComplited')
            }
            Log.err('SettingsMain.handleLogs error ' + log)
            BlocksoftCryptoLog.err('SettingsMain.handleLogs error ' + log)
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title:  strings('modal.walletLog.sorry'),
                description: text
            })
        })
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

            if(isAllWalletBackUp) {
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

        for(const wallet of walletList) {
            if(!wallet.walletIsBackedUp) {
                return false
            }
        }

        return true
    }

    handleChangeTouchIDStatus = () => {

        const { touchID_status } = this.props.settings.data

        settingsActions.setSettings('touchID_status', touchID_status === '0' ? '1' : '0')
    }

    handleChangePassword = () => {

        lockScreenAction.setFlowType({
            flowType: 'CHANGE_PASSWORD_FIRST_STEP'
        })

        NavStore.goNext('LockScreen')
    }

    handleChangeLang = () => {

        NavStore.goNext('LanguageListScreen')
    }

    handleChangeScanner = () => {

        NavStore.goNext('ScannerSettingsScreen')
    }

    handleReferral = () => {
        MarketingEvent.logEvent('taki_cashback_1_click', {})
        NavStore.goNext('CashbackScreen')
    }

    handleAddAsset = () => {

        NavStore.goNext('AddAssetScreen')
    }

    handleChangeLocalCurrency = () => {

        NavStore.goNext('LocalCurrencyScreen')
    }

    toggleTipsState = () => {
        const toolTipsState = this.props.settings.data.tool_tips_state
        const state = typeof toolTipsState === 'undefined' ? 0 : toolTipsState === '1' ? 0 : 1

        settingsActions.setSettings('tool_tips_state', state)
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

    onLongPressButton = async () => {
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

        Vibration.vibrate(100)
    }

    changeAskWhenSending = () => {
        const { askPinCodeWhenSending } = this.props.settings.data

        settingsActions.setSettings('askPinCodeWhenSending', askPinCodeWhenSending === '0' || typeof askPinCodeWhenSending === 'undefined' ? '1' : '0')
    }

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

        return (
            <View style={styles.wrapper}>
                <Navigation title={strings('settings.title')} navigation={this.props.navigation}/>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.wrapper__content}>
                        <View style={{ ...styles.block, marginTop: 35 }}>
                            <Text style={styles.block__title}>{strings('settings.walletManagement.title')}</Text>
                            <View style={styles.block__content}>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleBackup()}>
                                    <Icon name="export" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.walletManagement.backup')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleImport()}>
                                    <Icon name="import" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.walletManagement.import')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleCreate()}>
                                    <Icon name="wallet" size={20} style={{ ...styles.icon, marginRight: 14 }}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.walletManagement.create')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => NavStore.goNext('WalletListScreen')}>
                                    <Icon name="selectWallet" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.walletManagement.select')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ ...styles.block }}>
                            <Text style={styles.block__title}>{strings('settings.assets.title')}</Text>
                            <View style={styles.block__content}>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleAddAsset()}>
                                    <FontAwesome5 name="coins" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.assets.addAsset')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={styles.block}>
                            <Text style={styles.block__title}>{strings('settings.security.title')}</Text>
                            <View style={styles.block__content}>
                                <View style={{ ...styles.block__item }}>
                                    <MaterialIcon name="lock" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.security.lock')}</Text>
                                    </View>
                                    <Switch
                                        style={styles.block__switch}
                                        onValueChange={this.handleChangeLockScreenStatus}
                                        value={!!lock_screen_status}/>
                                </View>
                                {
                                    lock_screen_status ?
                                        <View>
                                            <View style={styles.divider}></View>
                                            <View style={{ ...styles.block__item }}>
                                                <MaterialIcon name="face" size={20} style={styles.icon}/>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings('settings.security.touch')}</Text>
                                                </View>
                                                <Switch
                                                    style={styles.block__switch}
                                                    onValueChange={this.handleChangeTouchIDStatus}
                                                    value={!!touchID_status}
                                                    disabled={!!!lock_screen_status}/>
                                            </View>
                                            <View style={styles.divider}></View>
                                            <TouchableOpacity onPress={() => this.handleChangePassword()} style={{ ...styles.block__item }}>
                                                <MaterialIcon name="lock-reset" size={20} style={styles.icon}/>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings('settings.security.change')}</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.divider}></View>
                                            <View style={{ ...styles.block__item }}>
                                                <MaterialIcon name="lock-question" size={20} style={styles.icon}/>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings('settings.security.askPINCodeToSend')}</Text>
                                                    <Text style={styles.block__subtext}>{strings('settings.security.askPINCodeSubtitle')}</Text>
                                                </View>
                                                <Switch
                                                    style={styles.block__switch}
                                                    onValueChange={this.changeAskWhenSending}
                                                    value={tmpAskPinCodeWhenSending} />
                                            </View>
                                        </View>
                                        : null
                                }

                            </View>
                        </View>

                        <View style={styles.block}>
                            <Text style={styles.block__title}>{strings('settings.other.title')}</Text>
                            <View style={styles.block__content}>
                                {
                                    this.state.devMode ?
                                        <View>
                                            <TouchableOpacity style={{ ...styles.block__item }} onLongPress={this.handleToggleConfig} delayLongPress={1000}>
                                                <View style={{ marginTop: 5 }}>
                                                    <MaterialIcon name="card-bulleted-settings-outline" size={20} style={styles.icon}/>
                                                </View>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings('settings.other.configMode')}</Text>
                                                </View>
                                                <Text style={styles.block__text__right}>
                                                    {this.state.mode}
                                                </Text>
                                            </TouchableOpacity>
                                            <View style={styles.divider}/>
                                        </View> : null
                                }
                                {
                                    this.state.devMode || this.state.testerMode === 'TESTER' ?
                                        <View>
                                            <TouchableOpacity style={{ ...styles.block__item }} onLongPress={this.handleToggleTester} delayLongPress={1000}>
                                                <View style={{ marginTop: 5 }}>
                                                    <MaterialIcon name="card-bulleted-settings-outline" size={20} style={styles.icon}/>
                                                </View>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings('settings.other.testerMode')}</Text>
                                                </View>
                                                <Text style={styles.block__text__right}>
                                                    {this.state.testerMode}
                                                </Text>
                                            </TouchableOpacity>
                                            <View style={styles.divider}/>
                                        </View>
                                        : null
                                }
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleReferral()}>
                                    <Ionicons name="ios-people" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.cashback.title')}</Text>
                                        <Text style={styles.block__subtext}>{strings(SCREEN_WIDTH > 320 ? 'settings.other.cashback.description' : 'settings.other.cashback.descriptionSmall')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => NavStore.goNext('AppNewsScreen')}>
                                    <Icon name="info" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings(SCREEN_WIDTH > 320 ? 'settings.other.appnews' : 'settings.other.appnewsSmall')}</Text>
                                    </View>
                                    <Text style={styles.block__text__right}>
                                        [{this.props.appNewsList.length > 0 ? this.props.appNewsList.length : 0}]
                                    </Text>
                                    <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleChangeLocalCurrency()}>
                                    <FontAwesome name="dollar" size={20} style={{ ...styles.icon, marginLeft: 3, marginRight: 17 }}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.localCurrency')}</Text>
                                    </View>
                                    <Text style={styles.block__text__right}>
                                        {localCurrency}
                                    </Text>
                                    <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleChangeLang()}>
                                    <FontAwesome name="language" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.lang')}</Text>
                                    </View>
                                    <Text style={styles.block__text__right}>
                                        {strings(`languageList.languages.${this.getLangCode()}`)}
                                    </Text>
                                    <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleChangeScanner()}>
                                    <FontAwesome name="cogs" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.scannerSettings')}</Text>
                                        <Text style={styles.block__subtext}>{strings(SCREEN_WIDTH > 320 ? 'settings.other.scannerSubtitle' : 'settings.other.scannerSubtitleSmall')}</Text>
                                    </View>
                                    <Text style={styles.block__text__right}>
                                        {strings(`scannerSettings.codes.${this.getScannerCode()}`)}
                                    </Text>
                                    <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleSupport()}>
                                    <MaterialIcon name="telegram" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.support')}</Text>
                                        <Text style={styles.block__subtext}>{strings('settings.other.supportSubtitle')}</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.handleLogs()}>
                                    <FontAwesome name="bug" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.copyLogs')}</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.divider}/>
                                <TouchableOpacity style={{ ...styles.block__item }} onPress={() => NavStore.goNext('AboutScreen')} delayLongPress={5000} onLongPress={this.onLongPressButton}>
                                    <Icon name="info" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('settings.other.about')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsMainScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    wrapper__top: {
        height: 145
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 80
    },
    title: {
        position: 'absolute',
        top: 75,
        width: '100%',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#f4f4f4',
        textAlign: 'center'
    },
    block__content: {
        paddingLeft: 7,
        paddingRight: 7,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
        backgroundColor: '#f9f9f9',
        borderRadius: 16
    },
    block__title: {
        paddingLeft: 15,
        marginBottom: 10,
        fontSize: 14,
        fontFamily: 'Montserrat-Bold',
        color: '#404040'
    },
    block__item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8
    },
    block__item__content: {
        paddingTop: 10,
        paddingBottom: 10
    },
    block__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    block__subtext: {
        marginTop: -2,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 11,
        color: '#999999'
    },
    block__text__right: {
        marginLeft: 'auto',
        marginTop: 3,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#999999'
    },
    block__switch: {
        marginLeft: 'auto'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },
    icon: {
        marginRight: 15,
        marginBottom: 1,
        color: '#999999'
    },
    block__item__arrow: {
        marginLeft: 'auto'
    },
    block__arrow: {
        marginLeft: 15,
        color: '#999999'
    }
}
