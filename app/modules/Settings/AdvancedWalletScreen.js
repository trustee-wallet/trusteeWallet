/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
} from 'react-native'
import { connect } from 'react-redux'
import { SwipeRow } from 'react-native-swipe-list-view'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setFlowType } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import TextInput from '@app/components/elements/new/TextInput'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import CustomIcon from '@app/components/elements/CustomIcon'

import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { getWalletsGeneralData } from '@app/appstores/Stores/Wallet/selectors'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import Log from '@app/services/Log/Log'


class AdvancedWalletScreen extends PureComponent {
    state = {
        isEditing: false,
        walletName: this.props.selectedWalletData.walletName,
    }

    inputRef = React.createRef()

    onChangeName = (value) => { this.setState(() => ({ walletName: value })) }

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
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('modal.titles.attention'),
            description: strings('modal.walletDelete.deleteWallet'),
        },  () => {
            this._actualDelete(true)
        })
    }

    _actualDelete = async (needPassword = true) => {

        const { walletHash, walletNumber, walletIsBackedUp } = this.props.selectedWalletData
        const { totalBalance } = this.props.walletsGeneralData
        const { lockScreenStatus } = this.props.settingsData
        if (needPassword && +lockScreenStatus) {
            setLockScreenConfig({flowType : LockScreenFlowTypes.JUST_CALLBACK, callback : this._actualDelete })
            NavStore.goNext('LockScreen')
            return
        }

        if (!walletIsBackedUp && totalBalance * 1 > 0) {
            setFlowType({ flowType: 'DELETE_WALLET', walletHash, walletNumber, source: 'AdvancedWalletScreen' })
            NavStore.goNext('BackupStep1Screen')
        } else {
            setLoaderStatus(true)
            try {
                await walletActions.removeWallet(walletHash)
                await UpdateAccountListDaemon.updateAccountListDaemon({force : true, source : 'AdvancedWalletScreen'})
                NavStore.goBack()
                setLoaderStatus(false)
            } catch (e) {
                Log.log('WalletManagement.Advances deleteWallet error ' + e.message)
                setLoaderStatus(false)
            }
        }

    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagement.Advances')
        const { colors, GRID_SIZE } = this.context
        const { isEditing, walletName } = this.state

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('settings.walletManagement.advanced.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
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
                                <SwipeRow
                                    leftOpenValue={50 + GRID_SIZE}
                                    rightOpenValue={-(50 + GRID_SIZE)}
                                    stopLeftSwipe={GRID_SIZE + 100}
                                    stopRightSwipe={-(GRID_SIZE + 100)}
                                    swipeToOpenPercent={30}
                                    onRowPress={this.handleEdit}
                                >
                                    <View style={[styles.hiddenLayer, { paddingHorizontal: GRID_SIZE / 2 }]}>
                                        <RoundButton
                                            type="delete"
                                            noTitle
                                            onPress={this.handleDelete}
                                            size={42}
                                        />
                                        <RoundButton
                                            type="edit"
                                            noTitle
                                            onPress={this.handleEdit}
                                            size={42}
                                        />
                                    </View>
                                    <View style={[styles.visibleLayer, { backgroundColor: colors.walletManagment.advanceWalletNameBg }]}>
                                        <Text style={[styles.walletNameLabel, { color: colors.common.text2 }]}>{strings('settings.walletManagement.advanced.walletNameLabel')} <CustomIcon name="edit" color={colors.common.text2} size={14} /></Text>
                                        <Text style={[styles.walletNameValue, { color: colors.common.text1 }]}>{walletName}</Text>
                                    </View>
                                </SwipeRow>
                            )}
                        </View>
                        <ListItem
                            title={strings('settings.walletManagement.advanced.recoveryPhraseTitle')}
                            subtitle={strings('settings.walletManagement.advanced.recoveryPhraseSubtitle')}
                            iconType="key"
                            onPress={() => this.handleOpenRecoveryPhrase(true)}
                            rightContent="arrow"
                            last
                        />
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
