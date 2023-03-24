/**
 * @version 0.77
 */
import React, { PureComponent } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { connect } from 'react-redux'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setWalletMnemonic, setMnemonicLength, setWalletName, proceedSaveGeneratedWallet, setCallback} from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'

import Log from '@app/services/Log/Log'

import TextInput from '@app/components/elements/new/TextInput'
import RadioButton from '@app/components/elements/new/RadioButton'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import ListItem from '@app/components/elements/new/list/ListItem/Basic'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import App from '@app/appstores/Actions/App/App'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import Validator from '@app/services/UI/Validator/Validator'

class BackupSettingsScreen extends PureComponent {
    state = {
        mnemonicLength: this.props.createWalletStore.mnemonicLength,
        walletName: this.props.createWalletStore.walletName,
        isCreating: this.props.createWalletStore.flowType === 'CREATE_NEW_WALLET'
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

        NavStore.goBack()
    }

    handleBack = () => { NavStore.goBack() }

    changeWalletName = (walletName) => { this.setState(() => ({ walletName: Validator.safeWords(walletName, 10) })) }

    changeMnemonicLength = (mnemonicLength) => { this.setState(() => ({ mnemonicLength })) }

    handleSkip = () => {

        Log.log('WalletBackup.BackupStep1Screen handleSkip')
        const { lockScreenStatus } = this.props.settingsData
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

        showModal({ type: 'BACKUP_SKIP_MODAL' }, async () => {

            try {
                setLoaderStatus(true)

                MarketingEvent.logEvent('gx_view_mnemonic_screen_skipped', { walletNumber, source }, 'GX')

                let walletHash = false
                try {
                    walletHash = await proceedSaveGeneratedWallet({
                        walletName,
                        walletMnemonic,
                        walletNumber
                    })
                } catch (e) {
                    e.message += ' while proceedSaveGeneratedWallet'
                    throw e
                }

                try {
                    if (walletNumber * 1 > 1) {
                        App.refreshWalletsStore({ firstTimeCall: false, walletHash, source: 'WalletBackup.handleSkip' })
                    } else {
                        App.init({ source: 'WalletBackup.handleSkip', onMount: false })
                    }
                } catch (e) {
                    e.message += ' while WalletBackup.handleSkip.refreshWalletsStore'
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
                    if (callback === null || !callback) {
                        NavStore.goBack()
                        NavStore.goBack()
                        NavStore.goBack()
                    } else if (callback === 'InitScreen') {
                        setCallback({ callback: null })
                        NavStore.reset('InitScreen')
                    } else {
                        callback()
                        setCallback({ callback: null })
                    }
                })
            } catch (e) {
                Log.err('WalletBackup.Skip error ' + e.message)
                setLoaderStatus(false)
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.send.fail'),
                    description: e.message
                })
            }

        })
    }

    handleSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'SETTINGS' })
        NavStore.goNext('BotSupportScreen', { url: link, title: strings('settings.about.contactSupportTitle'), backOnClose: true })
    }

    render() {
        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()

        const {
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
            <ScreenWrapper
                title={strings('walletBackup.settingsScreen.title')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    ref={ref => { this.scrollView = ref }}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
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
                            paste={true}
                            callback={this.changeWalletName}
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
                        />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsData: getSettingsScreenData(state),
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
    scrollViewContent: {
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
