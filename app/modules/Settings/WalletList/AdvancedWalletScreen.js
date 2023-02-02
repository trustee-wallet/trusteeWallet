/**
 * @version 0.77
 */
import React, { PureComponent } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setFlowType } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'

import { ThemeContext } from '@app/theme/ThemeProvider'
import TextInput from '@app/components/elements/new/TextInput'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import CustomIcon from '@app/components/elements/CustomIcon'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSelectedWalletData, getIsBackedUp } from '@app/appstores/Stores/Main/selectors'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { getWalletsGeneralData, getWalletsNumber } from '@app/appstores/Stores/Wallet/selectors'
import { handleBackup } from '../helpers'
import Validator from '@app/services/UI/Validator/Validator'


class AdvancedWalletScreen extends PureComponent {
    state = {
        isEditing: false,
        walletName: this.props.selectedWalletData.walletName,
    }

    inputRef = React.createRef()

    onChangeName = (value) => { this.setState(() => ({ walletName: Validator.safeWords(value, 10) })) }

    onBlurInput = async () => {
        const { walletName: oldName, walletHash } = this.props.selectedWalletData
        const { walletName: newName } = this.state
        this.setState(() => ({ isEditing: false }))

        if (oldName === newName) return

        if (!newName) this.setState(() => ({ walletName: oldName }))

        const success = await walletActions.setNewWalletName(walletHash, newName)
        if (success) {
            this.setState(() => ({ walletName: newName }))
        } else {
            this.setState(() => ({ walletName: oldName }))
        }
    }

    handleOpenRecoveryPhrase = () => {
        const { walletHash, walletNumber } = this.props.selectedWalletData
        setFlowType({ flowType: 'BACKUP_WALLET', walletHash, walletNumber, source: 'AdvancedWalletScreen' })
        NavStore.goNext('BackupStep0Screen', { flowSubtype: 'show' })
    }

    handleEdit = () => { this.setState(() => ({ isEditing: true }), () => { this.inputRef.focus() }) }

    handleDelete = () => {
        if (!this.props.walletIsBackedUp) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.attention'),
                description: strings('settings.walletManagement.advanced.canNotDelete')
            })
            return
        }

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('modal.titles.attention'),
            description: strings('modal.walletDelete.deleteWallet', { walletName: this.state.walletName }),
            reverse: true,
            oneButton: strings('walletBackup.infoScreen.continue'),
            twoButton: strings('walletBackup.skipElement.cancel'),
            noCallback: () => {
                hideModal()
            }
        }, () => {
            this._actualDelete()
        })
    }

    _actualDelete = () => {

        const { walletHash, walletNumber } = this.props.selectedWalletData

        setFlowType({ flowType: 'DELETE_WALLET', walletHash, walletNumber, source: 'AdvancedWalletScreen' })
        NavStore.goNext('BackupStep1Screen')
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagement.Advances')
        const { colors, GRID_SIZE } = this.context
        const { isEditing, walletName } = this.state

        const manyWallets = this.props.walletsLength > 1

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.walletManagement.advanced.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ padding: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                        <View style={{ marginBottom: GRID_SIZE }}>
                            {isEditing ? (
                                <TextInput
                                    label={strings('settings.walletManagement.advanced.walletNameLabel')}
                                    value={walletName}
                                    onBlur={this.onBlurInput}
                                    onChangeText={this.onChangeName}
                                    compRef={(ref) => { this.inputRef = ref }}
                                />
                            ) : (
                                <TouchableOpacity
                                    onPress={this.handleEdit}
                                    style={[styles.visibleLayer, { backgroundColor: colors.walletManagment.advanceWalletNameBg }]}
                                >
                                    <Text style={[styles.walletNameLabel, { color: colors.common.text2 }]}>{strings('settings.walletManagement.advanced.walletNameLabel')} <CustomIcon name='edit' color={colors.common.text2} size={14} /></Text>
                                    <Text style={[styles.walletNameValue, { color: colors.common.text1 }]}>{walletName}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {!this.props.walletIsBackedUp ?
                            <ListItem
                                title={strings('settings.walletManagement.backup')}
                                subtitle={strings('settings.walletManagement.advanced.saveSeed')}
                                iconType='key'
                                onPress={() => handleBackup(this.props.selectedWalletData)}
                                rightContent='arrow'
                                last={!manyWallets}
                            />
                            :
                            <ListItem
                                title={strings('settings.walletManagement.advanced.recoveryPhraseTitle')}
                                subtitle={strings('settings.walletManagement.advanced.recoveryPhraseSubtitle')}
                                iconType='key'
                                onPress={() => this.handleOpenRecoveryPhrase(true)}
                                rightContent='arrow'
                                last={!manyWallets}
                            />}
                        {manyWallets &&
                            <ListItem
                                title={strings('settings.walletManagement.advanced.deleteWallet')}
                                iconType='delete'
                                onPress={this.handleDelete}
                                rightContent='arrow'
                                last={manyWallets}
                            />
                        }
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

AdvancedWalletScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        walletsGeneralData: getWalletsGeneralData(state),
        settingsData: getSettingsScreenData(state),
        walletsLength: getWalletsNumber(state),
        walletIsBackedUp: getIsBackedUp(state)
    }
}

export default connect(mapStateToProps)(AdvancedWalletScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    hiddenLayer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    visibleLayer: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 13
    },
    walletNameLabel: {
        fontFamily: 'Montserrat-Semibold',
        fontSize: 14,
        lineHeight: 16,
    },
    walletNameValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        marginTop: 5
    },
})
