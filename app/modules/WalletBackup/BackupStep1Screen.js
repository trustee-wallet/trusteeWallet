/**
 * @version 0.30
 */
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { connect } from 'react-redux'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import App from '@app/appstores/Actions/App/App'
import Log from '@app/services/Log/Log'

import { setCallback, proceedSaveGeneratedWallet } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'

import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import MnemonicWord from './elements/MnemonicWord'
import SelectedMnemonic from './elements/SelectedMnemonic'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import cryptoWallets from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { deleteWallet } from '../Settings/helpers'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'


const VISIBILITY_TIMEOUT = 4000

class BackupStep1Screen extends React.PureComponent {
    visibilityTimer;

    constructor(props) {
        super(props)
        this.state = {
            isMnemonicVisible: false,
            walletMnemonicDefault: [],
            walletMnemonicSorted: [],
            walletMnemonicSelected: [],
        }
    }

    componentDidMount() {
        this.init()
    }

    init = async () => {
        Log.log('WalletBackup.BackupStep1Screen init')

        if (typeof this.props.createWalletStore.walletMnemonic === 'undefined' && this.props.createWalletStore.flowType !== 'DELETE_WALLET') {
            throw new Error('WalletBackup.BackupStep1Screen init error')
        }

        const { flowType } = this.props.createWalletStore

        let walletMnemonicDefault
        try {
            if (flowType === 'DELETE_WALLET') {
                const selectedWallet = await settingsActions.getSelectedWallet('WalletBackup.BackupStep1Screen')
                walletMnemonicDefault = await cryptoWallets.getWallet(selectedWallet, 'WalletBackup.BackupStep1Screen')
                walletMnemonicDefault = walletMnemonicDefault.split(' ')
            } else {
                walletMnemonicDefault = this.props.createWalletStore.walletMnemonic.split(' ')
            }
        } catch (e) {
            throw new Error('WalletBackup.BackupStep1Screen init split error ' + e.message)
        }

        let walletMnemonicSorted = JSON.parse(JSON.stringify(walletMnemonicDefault))
        try {
            walletMnemonicSorted = walletMnemonicSorted.sort(() => {
                return .5 - Math.random()
            })
        } catch (e) {
            throw new Error('WalletBackup.BackupStep1Screen init sort error ' + e.message)
        }

        this.setState({
            walletMnemonicDefault: walletMnemonicDefault,
            walletMnemonicSorted: walletMnemonicSorted,
            walletMnemonicSelected: []
        })
    }

    handleSelectWord = (item, index) => {
        Log.log('WalletBackup.BackupStep1Screen handleSelectWord')
        const walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        const walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
        walletMnemonicSelected.push(item)

        walletMnemonicSorted.splice(index, 1)

        this.setState({
            walletMnemonicSelected,
            walletMnemonicSorted
        }, () => {
            this.validateMnemonic()
        })
    }

    handleRemoveWord = (item, index) => {
        Log.log('WalletBackup.BackupStep1Screen handleRemoveWord')
        const walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
        const walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        walletMnemonicSorted.push(item)

        walletMnemonicSelected.splice(index, 1)

        this.setState({
            walletMnemonicSelected,
            walletMnemonicSorted
        })
    }

    handleBack = () => { NavStore.goBack() }

    confirmDeleteWallet = async () => {
        const { walletHash, source } = this.props.createWalletStore
        await deleteWallet(walletHash, source, source === 'AdvancedWalletScreen')
    }

    validateMnemonic = async () => {
        Log.log('WalletBackup.BackupStep1Screen validateMnemonic')

        const { flowType, walletHash, walletNumber, source } = this.props.createWalletStore

        if (this.state.walletMnemonicSorted.length) return true

        if (JSON.stringify(this.state.walletMnemonicSelected) !== JSON.stringify(this.state.walletMnemonicDefault)) {
            showModal({ type: 'MNEMONIC_FAIL_MODAL' }, this.init)
        } else if (flowType === 'DELETE_WALLET') {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'WARNING',
                title: strings('modal.titles.attention'),
                description: strings('modal.walletDelete.delete'),
                noCallback: this.init
            }, (needPassword=true) => {
                const { lockScreenStatus } = this.props.settingsData
                if (needPassword && +lockScreenStatus) {
                    setLockScreenConfig({flowType : LockScreenFlowTypes.JUST_CALLBACK, callback: this.confirmDeleteWallet})
                    NavStore.goNext('LockScreen')
                    return
                } else (
                    this.confirmDeleteWallet()
                )
            })

        } else if (flowType === 'BACKUP_WALLET') {
            MarketingEvent.logEvent('gx_view_mnemonic_screen_cnf', { walletNumber, walletHash, source }, 'GX')

            walletActions.setWalletBackedUpStatus(walletHash)

            MarketingEvent.logEvent('gx_view_mnemonic_screen_success', { walletNumber, walletHash, source }, 'GX')
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.walletBackup.success'),
                description: strings('modal.walletBackup.seedConfirm'),
                noBackdropPress: true
            }, () => {
                NavStore.goBack()
                NavStore.goBack()
                NavStore.goBack()
            })
        } else {
            const { walletName, walletMnemonic, callback, source, walletNumber } = this.props.createWalletStore

            try {
                setLoaderStatus(true)

                MarketingEvent.logEvent('gx_view_mnemonic_screen_cnf', { walletNumber, source }, 'GX')

                const walletHash = await proceedSaveGeneratedWallet({
                    walletName,
                    walletMnemonic,
                    walletNumber
                })

                walletActions.setWalletBackedUpStatus(walletHash)

                try {
                    if (walletNumber * 1 > 1) {
                        await App.refreshWalletsStore({ firstTimeCall: false, walletHash, source: 'WalletBackup.handleSkip' })
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
                Log.err('WalletBackup.BackupStep1Screen.validateMnemonic error ' + e.message)
                setLoaderStatus(false)
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.send.fail'),
                    description: e.message
                })
            }

        }

    }

    triggerMnemonicVisible = (visible) => {
        if (this.visibilityTimer) return;
        this.setState(state => ({ isMnemonicVisible: !state.isMnemonicVisible }))
    }

    showMnemonic = () => {
        this.setState(() => ({ isMnemonicVisible: true }))

        this.visibilityTimer = setTimeout(() => {
            this.visibilityTimer = null
            this.setState(() => ({ isMnemonicVisible: false }))
        }, VISIBILITY_TIMEOUT)
    }

    render() {
        Log.log('WalletBackup.BackupStep1Screen render')
        MarketingAnalytics.setCurrentScreen('WalletBackup.BackupStep1Screen')

        UpdateOneByOneDaemon.pause()
        UpdateAccountListDaemon.pause()

        const {
            isMnemonicVisible,
            walletMnemonicSorted,
            walletMnemonicSelected
        } = this.state
        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                title={strings('walletBackup.step1Screen.title')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    ref={ref => { this.scrollView = ref }}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 2 }}>
                        <SelectedMnemonic
                            placeholder={strings('walletBackup.step1Screen.placeholder')}
                            showButtonTitle={strings('walletBackup.step1Screen.showButton')}
                            triggerMnemonicVisible={this.triggerMnemonicVisible}
                            showMnemonic={this.showMnemonic}
                            removeWord={this.handleRemoveWord}
                            isMnemonicVisible={isMnemonicVisible}
                            data={walletMnemonicSelected}
                        />
                        <View style={[styles.wordsContainer]}>
                            {walletMnemonicSorted.map((word, i) => (
                                <MnemonicWord
                                    value={word}
                                    key={`${word}${i}`}
                                    onPress={() => this.handleSelectWord(word, i)}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={{
                        paddingHorizontal: GRID_SIZE,
                        paddingVertical: GRID_SIZE * 1.5,
                    }}>
                        <TwoButtons
                            mainButton={{
                                disabled: !!walletMnemonicSorted.length,
                                onPress: this.onNext,
                                title: strings('walletBackup.step1Screen.next')
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
        createWalletStore: state.createWalletStore,
        settingsData: getSettingsScreenData(state),
    }
}

BackupStep1Screen.contextType = ThemeContext

export default connect(mapStateToProps, {})(BackupStep1Screen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between'
    },
    wordsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
})
