/**
 * @version 0.30
 */
import React from 'react'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity
} from 'react-native'
import { connect } from 'react-redux'
import { SwipeRow } from 'react-native-swipe-list-view'



import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'

import { setFlowType } from '../../appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '../../appstores/Stores/Wallet/WalletActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import TextInput from '../../components/elements/new/TextInput'
import RoundButton from '../../components/elements/new/buttons/RoundButton'
import ListItem from '../../components/elements/new/list/ListItem/Setting'
import CustomIcon from '../../components/elements/CustomIcon'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'


class AdvancedWalletScreen extends React.Component {
    state = {
        headerHeight: 0,
        isEditing: false,
        walletName: this.props.wallet.walletName,
    }

    inputRef = React.createRef()

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    onChangeName = (value) => { this.setState(() => ({ walletName: value })) }

    onBlurInput = async () => {
        const { walletName: oldName, walletHash } = this.props.wallet
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

    handleOpenRecoveryPhrase = (needPassword = true) => {
        setFlowType({ flowType: 'BACKUP_WALLET' })
        setLoaderStatus(false)

        const { lockScreenStatus } = this.props.settingsStore.keystore
        if (needPassword && +lockScreenStatus) {
            lockScreenAction.setFlowType({ flowType: 'CONFIRM_WALLET_PHRASE' })
            lockScreenAction.setActionCallback({ actionCallback: this.handleOpenRecoveryPhrase })
            NavStore.goNext('LockScreen')
            return
        }
        NavStore.goNext('BackupStep0Screen', { flowSubtype: 'show' })
    }

    handleEdit = () => { this.setState(() => ({ isEditing: true }), () => { this.inputRef.focus() }) }

    handleDelete = () => { /* TODO: add handler */ }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagment.Advances')

        const { colors, GRID_SIZE } = this.context
        const { headerHeight, isEditing, walletName } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.walletManagement.advanced.title')}
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
                </SafeAreaView>
            </View>
        )
    }
}

AdvancedWalletScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        wallet: state.mainStore.selectedWallet,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedWalletScreen)

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
