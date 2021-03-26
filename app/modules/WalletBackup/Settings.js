/**
 * @version 0.30
 */
import React, { Component } from 'react'
import { View, Text, StyleSheet,  SafeAreaView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { connect } from 'react-redux'


import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setWalletMnemonic, setMnemonicLength, setWalletName, proceedSaveGeneratedWallet, setCallback } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Log from '@app/services/Log/Log'

import Header from '@app/components/elements/new/Header'
import TextInput from '@app/components/elements/new/TextInput'
import RadioButton from '@app/components/elements/new/RadioButton'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import ListItem from '@app/components/elements/new/list/ListItem/Basic'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import { setLoaderStatus, setSelectedWallet } from '@app/appstores/Stores/Main/MainStoreActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import App from '@app/appstores/Actions/App/App'

/*
import NavStore from '../../../components/navigation/NavStore'

import Log from '../../../services/Log/Log'
import App from '../../../appstores/Actions/App/App'
import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { setCallback, proceedSaveGeneratedWallet } from '../../../appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '../../../appstores/Stores/Wallet/WalletActions'
 */

class BackupSettingsScreen extends Component {
    state = {
        headerHeight: 0,
        mnemonicLength: this.props.createWalletStore.mnemonicLength,
        walletName: this.props.createWalletStore.walletName,
        isCreating: this.props.createWalletStore.flowType === 'CREATE_NEW_WALLET'
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleApply = async () => {
        const { mnemonicLength, walletName, isCreating } = this.state
        const {
            mnemonicLength: oldMnemonicLength,
            walletName: oldWalletName,
        } = this.props.createWalletStore

        if (isCreating && mnemonicLength !== oldMnemonicLength) {
            const walletMnemonic = (await BlocksoftKeys.newMnemonic(mnemonicLength)).mnemonic

            setWalletMnemonic({ walletMnemonic })
            setMnemonicLength({ mnemonicLength })
        }

        if (walletName !== oldWalletName) setWalletName({ walletName })

        this.props.navigation.goBack()
    }

    handleBack = () => { this.props.navigation.goBack() }

    changeWalletName = (walletName) => { this.setState(() => ({ walletName })) }

    changeMnemonicLength = (mnemonicLength) => { this.setState(() => ({ mnemonicLength })) }

    handleSkip = () => {
        Log.log('WalletBackup.BackupStep1Screen handleSkip')
        const { lockScreenStatus } = this.props.settingsStore.keystore
        const { walletName, walletMnemonic, callback, source, walletNumber } = this.props.createWalletStore

        if (+lockScreenStatus) {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.disabledSkipModal.description')
            })
            return
        }

        showModal({ type: 'BACKUP_SKIP_MODAL'}, async () => {

            try {
                setLoaderStatus(true)

                MarketingEvent.logEvent('gx_view_mnemonic_screen_skipped', { walletNumber, source }, 'GX')

                let tmpWalletName = walletName

                try {
                    if (!tmpWalletName) {
                        tmpWalletName = await walletActions.getNewWalletName()
                    }
                } catch (e) {
                    e.message += ' while getNewWalletName'
                    throw e
                }

                let walletHash = false
                try {
                    walletHash = await proceedSaveGeneratedWallet({
                        walletName: tmpWalletName,
                        walletMnemonic
                    })
                } catch (e) {
                    e.message += ' while proceedSaveGeneratedWallet'
                    throw e
                }

                try {
                    await App.refreshWalletsStore({ firstTimeCall: 'skip', walletHash, source: 'WalletBackup.handleSkip' })
                } catch (e) {
                    e.message += ' while refreshWalletsStore'
                    throw e
                }

                setLoaderStatus(false)

                MarketingEvent.logEvent('gx_view_mnemonic_screen_success', { walletNumber, source }, 'GX')

                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.walletBackup.success'),
                    description: strings('modal.walletBackup.walletCreated'),
                    noBackdropPress: true
                }, async () => {
                    if (callback === null) {
                        NavStore.reset('DashboardStack')
                    } else {
                        callback()
                        setCallback({ callback: null })
                    }
                })
            } catch (e) {
                Log.err('WalletBackup.Skip error ' + e.message)
            }

        })
    }

    handleSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'SETTINGS' })
        NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
    }

    render() {
        const {
            headerHeight,
            mnemonicLength,
            walletName,
            isCreating
        } = this.state
        const {
            mnemonicLength: oldMnemonicLength,
            walletName: oldWalletName,
        } = this.props.createWalletStore
        const { GRID_SIZE, colors } = this.context
        const hasChanges = mnemonicLength !== oldMnemonicLength || walletName !== oldWalletName

        MarketingAnalytics.setCurrentScreen('WalletBackup.Settings')

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                    <Header
                        title={strings('walletBackup.settingsScreen.title')}
                        setHeaderHeight={this.setHeaderHeight}
                    />
                    {!!headerHeight && (
                        <SafeAreaView style={[styles.content, {
                            backgroundColor: colors.common.background,
                            marginTop: headerHeight,
                        }]}>
                            <View style={{ paddingHorizontal: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                                {isCreating && (
                                    <View style={[styles.phraseSetting, { marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE * 2 }]}>
                                        <Text style={[styles.phraseSettingLabel, { color: colors.common.text1 }]}>{strings('walletBackup.settingsScreen.phraseLengthLabel')}</Text>
                                        <View style={styles.radioButtons}>
                                            <RadioButton
                                                label={strings('walletBackup.settingsScreen.12wordsLabel')}
                                                value={128}
                                                onChange={this.changeMnemonicLength}
                                                checked={mnemonicLength === 128}
                                            />
                                            <RadioButton
                                                label={strings('walletBackup.settingsScreen.24wordsLabel')}
                                                value={256}
                                                onChange={this.changeMnemonicLength}
                                                checked={mnemonicLength === 256}
                                                containerStyle={styles.secondRadioValue}
                                            />
                                        </View>
                                    </View>
                                )}

                                <TextInput
                                    label={strings('walletBackup.settingsScreen.walletNameLabel')}
                                    placeholder={strings('walletBackup.settingsScreen.walletNamePlaceholder')}
                                    onChangeText={this.changeWalletName}
                                    value={walletName}
                                />

                                <View style={{ marginTop: GRID_SIZE * 1.5 }}>
                                    <ListItem
                                        title={strings('walletBackup.settingsScreen.contactTitle')}
                                        subtitle={strings('walletBackup.settingsScreen.contactSubtitle')}
                                        iconType="support"
                                        onPress={this.handleSupport}
                                        last={!isCreating}
                                    />
                                    {isCreating && (
                                        <ListItem
                                            title={strings('walletBackup.settingsScreen.skipTitle')}
                                            subtitle={strings('walletBackup.settingsScreen.skipSubtitle')}
                                            iconType="skip"
                                            last
                                            onPress={this.handleSkip}
                                        />
                                    )}
                                </View>
                            </View>

                            <View style={{
                                paddingHorizontal: GRID_SIZE,
                                paddingVertical: GRID_SIZE * 1.5,
                            }}>
                                <TwoButtons
                                    mainButton={{
                                        disabled: !hasChanges,
                                        onPress: this.handleApply,
                                        title: strings('walletBackup.settingsScreen.apply')
                                    }}
                                    secondaryButton={{
                                        type: 'back',
                                        onPress: this.handleBack,
                                    }}
                                />
                            </View>
                        </SafeAreaView>
                    )}
                </View>
            </TouchableWithoutFeedback>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        createWalletStore: state.createWalletStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

BackupSettingsScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(BackupSettingsScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
        justifyContent: 'space-between'
    },
    phraseSetting: {},
    phraseSettingLabel: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 21,
        marginBottom: 12
    },
    radioButtons: {
        flexDirection: 'row'
    },
    secondRadioValue: {
        marginLeft: 24
    }
})
