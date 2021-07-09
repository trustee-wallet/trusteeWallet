/**
 * @version 0.43
 * @description ksu jumping
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
} from 'react-native'

import LottieView from 'lottie-react-native'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setWalletMnemonic, setMnemonicLength, setWalletName, setFlowType } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'

import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftSecrets from '@crypto/actions/BlocksoftSecrets/BlocksoftSecrets'

import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'

import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import CheckBox from '@app/components/elements/new/CheckBox'
import CustomIcon from '@app/components/elements/CustomIcon'

import ProgressAnimation from '@assets/jsons/animations/pieWithStroke.json'

import { ThemeContext } from '@app/theme/ThemeProvider'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getLockScreenStatus, getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'

const VISIBILITY_TIMEOUT = 4000

class BackupStep0Screen extends PureComponent {

    scrollView;

    headerProps = {}

    constructor(props) {
        super(props)
        this.state = {
            walletMnemonic: '',
            walletMnemonicArray: [],
            isMnemonicVisible: false,
            approvedBackup: false,
            animationProgress: new Animated.Value(0),
            flowSubtype: '', // one of: 'backup', 'createFirst', 'createAnother', 'show'
            visibilityTimer: null,
            visibilityQR : false
        }
    }

    async componentDidMount() {
        await this._init()
    }

    async _init(checkLock = true) {
        try {
            Log.log('WalletBackup.BackupStep0Screen.componentDidMount init')

            const { flowType, mnemonicLength } = this.props.createWalletStore

            const flowSubtype = NavStore.getParamWrapper(this, 'flowSubtype', 'createFirst')

            let walletMnemonic = ''
            let mnemonic = ''
            if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {

                if (checkLock) {
                    if (this.props.lockScreenStatus * 1 > 0) {
                        setLockScreenConfig({ flowType: LockScreenFlowTypes.JUST_CALLBACK, callback : async () => {
                            await this._init(false)
                        }})
                        NavStore.goNext('LockScreen')
                        return false
                    }
                }

                const { walletHash } = this.props.selectedWalletData
                if (walletHash) {
                    try {
                        mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash, 'BackupStep0Screen.mount')
                    } catch {
                        Log.log('WalletBackup.BackupStep0Screen error mnemonic for ' + walletHash)
                    }
                }
                if (flowType === 'BACKUP_WALLET_XMR') {
                    walletMnemonic = await (BlocksoftSecrets.setCurrencyCode('XMR').setMnemonic(mnemonic)).getWords()
                } else {
                    walletMnemonic = mnemonic
                }
                if (!walletMnemonic || walletMnemonic === '') {
                    Log.log('WalletBackup.BackupStep0Screen no mnenonic for selected wallet')
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'WARNING',
                        title: strings('settings.walletList.backupModal.title'),
                        description: 'selected wallet is not generated - please select another from the list or reinstall and restart'
                    })
                }
            } else {
                try {
                    walletMnemonic = (await BlocksoftKeys.newMnemonic(mnemonicLength)).mnemonic
                } catch {
                    Log.log('WalletBackup.BackupStep0Screen error mnemonic generation')
                }

                if (!walletMnemonic || walletMnemonic === '') {
                    Log.log('WalletBackup.BackupStep0Screen no mnenonic for new wallet')
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'WARNING',
                        title: strings('settings.walletList.backupModal.title'),
                        description: 'new wallet is not generated - please reinstall and restart'
                    })
                }
            }


            if (flowType === 'BACKUP_WALLET_XMR') {
                this.headerProps.rightType = 'close'
                this.headerProps.rightAction = this.handleBack
                this.headerProps.title = strings('walletBackup.titleBackup')
            } else if (flowSubtype === 'createFirst') {
                this.headerProps.rightType = 'close'
                this.headerProps.rightAction = this.handleBack
                this.headerProps.title = strings('walletBackup.titleCreate')
            } else {
                this.headerProps.rightType = 'close'
                this.headerProps.rightAction = this.handleClose
                this.headerProps.leftType = 'back'
                this.headerProps.leftAction = this.handleBack
                this.headerProps.title = flowSubtype === 'show'
                    ? strings('walletBackup.titleShow')
                    : flowSubtype === 'backup'
                        ? strings('walletBackup.titleBackup')
                        : strings('walletBackup.titleCreate')
            }

            const walletMnemonicArray = walletMnemonic.split(' ')

            setWalletMnemonic({ walletMnemonic })
            this.setState({
                walletMnemonic,
                walletMnemonicArray,
                flowSubtype
            })

        } catch (e) {
            Log.err('WalletBackup.BackupStep0Screen.componentDidMount error ' + e.message)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const { walletMnemonic } = nextProps.createWalletStore

        if (this.props.createWalletStore.mnemonicLength !== nextProps.createWalletStore.mnemonicLength) {
            this.scrollView.scrollTo?.({ x: 0, y: 0, animated: true })

            const walletMnemonicArray = walletMnemonic.split('')
            this.setState(() => ({
                walletMnemonicArray,
                walletMnemonic
            }))
        }
    }

    // for developing and testing only
    handleCopyModal = () => {
        copyToClipboard(this.state.walletMnemonic)
        Toast.setMessage(strings('toast.copied')).show()
    }

    onNext = () => {
        NavStore.goNext('BackupStep1Screen')
    }

    // onGoogle = () => {
    //     NavStore.goNext('BackupStepGoogle')
    // }

    openWalletSettings = () => {
        NavStore.goNext('BackupSettingsScreen')
    }

    resetWalletStore = () => {
        setWalletName({ walletName: '' })
        setWalletMnemonic({ walletMnemonic: '' })
        setFlowType({ flowType: '' })
        setMnemonicLength({ mnemonicLength: 0 })
    }

    handleBack = () => {
        this.resetWalletStore()
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
        this.resetWalletStore()
    }

    handleQR = (visibility) => {
        this.setState({
            visibilityQR : visibility
        })
    }

    triggerMnemonicVisible = (visibility, checkLock = true) => {
        if (this.state.visibilityTimer) return
        const { source, walletNumber } = this.props.createWalletStore

        if (visibility) {
            this.setState(() => ({ isMnemonicVisible: visibility }), () => {
                MarketingEvent.logEvent('gx_view_mnemonic_screen_tap_mnemonic', { walletNumber, source }, 'GX')
            })
        } else {
            this.setState(() => ({ isMnemonicVisible: visibility }))
        }
    }

    showMnemonic = () => {
        const { source, walletNumber } = this.props.createWalletStore
        setTimeout(() => {
            this.setState(() => ({ isMnemonicVisible: false, visibilityTimer: null }))
        }, VISIBILITY_TIMEOUT)

        this.setState(() => ({ isMnemonicVisible: true, visibilityTimer: true }), () => {
            MarketingEvent.logEvent('gx_view_mnemonic_screen_tap_mnemonic', { walletNumber, source }, 'GX')
            Animated.timing(this.state.animationProgress, {
                toValue: 1,
                duration: VISIBILITY_TIMEOUT
            }).start(() => {
                Animated.timing(this.state.animationProgress, { toValue: 0, duration: 0 }).start()
            })
        })
    }

    renderWord = (word, index) => {
        const { colors, GRID_SIZE } = this.context
        const wordToRender = this.state.isMnemonicVisible ? word : '--------'

        return (
            <View style={[styles.wordContainer, { backgroundColor: colors.createWalletScreen.showMnemonic.wordBg, marginHorizontal: GRID_SIZE * 0.75 }]}>
                <View style={[styles.wordIndexContainer, { backgroundColor: colors.createWalletScreen.showMnemonic.wordIndexBg, }]}>
                    <Text style={[styles.wordIndex, { color: colors.createWalletScreen.showMnemonic.wordIndexText }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.word, { color: colors.common.text1, marginLeft: GRID_SIZE * 0.7 }]}>{wordToRender}</Text>
            </View>
        )
    }

    handleApproveBackup = () => { this.setState(state => ({ approvedBackup: !state.approvedBackup })) }

    render() {
        const { walletMnemonicArray, isMnemonicVisible, approvedBackup, animationProgress, flowSubtype, visibilityTimer,visibilityQR } = this.state
        const { flowType } = this.props.createWalletStore

        const isInited = walletMnemonicArray.length > 0
        const isShowingPhrase = flowSubtype === 'show'
        const isCreate = flowSubtype === 'createFirst' || flowSubtype === 'createAnother'
        const isXMR = flowType === 'BACKUP_WALLET_XMR'

        const { GRID_SIZE, colors } = this.context

        MarketingAnalytics.setCurrentScreen('WalletBackup.BackupStep0Screen')

        const halfArrayNum = Math.ceil(walletMnemonicArray.length / 2);


        let infoText = strings('walletBackup.step0Screen.info')
        if (isXMR) {
            infoText = strings('walletBackup.descriptionXMR')
        }

        return (
            <ScreenWrapper
                {...this.headerProps}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    ref={ref => { this.scrollView = ref }}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    {visibilityQR &&
                    <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
                        <View style={[styles.infoContainer, { marginBottom: GRID_SIZE }]}>

                            <Text style={[styles.infoText, { color: colors.common.text3 }]}>{strings('walletBackup.step0Screen.infoQR')}</Text>

                        </View>

                        <View style={styles.wrapperQR}>
                            <View style={styles.qr}>
                                <QrCodeBox
                                    value={this.state.walletMnemonic}
                                    size={200}
                                    color='#404040'
                                    backgroundColor={'#F5F5F5'}
                                    logo={qrLogo}
                                    logoSize={70}
                                    logoBackgroundColor='transparent'
                                    onError={(e) => {
                                        Log.err('BackupStep0Screen QRCode error ' + e.message)
                                    }}
                                />
                            </View>
                        </View>
                        <View style={{
                            paddingHorizontal: GRID_SIZE,
                            paddingVertical: GRID_SIZE * 1.5
                        }}>
                            <TwoButtons
                                mainButton={{
                                    onPress: () => this.handleQR(false),
                                    title: strings('walletBackup.step0Screen.hideQR')
                                }}
                            />
                        </View>

                    </View>
                    }

                    {!visibilityQR && walletMnemonicArray &&
                        <>
                            <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
                                <View style={[styles.infoContainer, { marginBottom: GRID_SIZE }]}>
                                    {visibilityTimer ? (
                                        <LottieView color={colors.createWalletScreen.keyIcon} source={ProgressAnimation} style={{ width: 24, height: 24 }} progress={animationProgress} />
                                    ) : (
                                        <View style={[styles.keyCircle, { borderColor: colors.createWalletScreen.showMnemonic.showButtonText }]}>
                                            <CustomIcon name={'recoveryPhrase'} size={16} color={colors.createWalletScreen.showMnemonic.showButtonText} />
                                        </View>
                                    )}
                                    <Text style={[styles.infoText, { color: colors.common.text3 }]}>{infoText}</Text>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={1}
                                    onLongPress={this.showMnemonic}
                                    onPressIn={() => this.triggerMnemonicVisible(true)}
                                    onPressOut={() => this.triggerMnemonicVisible(false)}
                                    delayLongPress={2000}
                                    delayPressIn={100}
                                    disabled={isMnemonicVisible}
                                >
                                    <View style={[styles.mnemonicContainer, { marginHorizontal: -(GRID_SIZE * 0.75) }]}>
                                        <View style={styles.mnemonicColumn}>
                                            {walletMnemonicArray.slice(0, halfArrayNum).map(this.renderWord)}
                                        </View>
                                        <View style={styles.mnemonicColumn}>
                                            {walletMnemonicArray.slice(halfArrayNum).map((item, i) => this.renderWord(item, halfArrayNum + i))}
                                        </View>
                                    </View>

                                    <Text
                                        style={[
                                            styles.showMnemonicButton,
                                            {
                                                marginTop: GRID_SIZE * 2,
                                                marginBottom: GRID_SIZE * 2,
                                                color: colors.createWalletScreen.showMnemonic.showButtonText,
                                                opacity: isMnemonicVisible ? 0.5 : 1
                                            }
                                        ]}
                                    >{strings('walletBackup.step0Screen.showButton')}</Text>
                                </TouchableOpacity>

                                {!isShowingPhrase && !isXMR && (
                                    <CheckBox
                                        checked={approvedBackup}
                                        onPress={this.handleApproveBackup}
                                        title={strings('walletBackup.infoScreen.checkbox1')}
                                    />
                                )}
                            </View>

                            {isShowingPhrase && !isXMR && (
                                <View style={{
                                    paddingHorizontal: GRID_SIZE,
                                    paddingVertical: GRID_SIZE * 1.5,
                                }}>
                                    <TwoButtons
                                        mainButton={{
                                            onPress: () => this.handleQR(true),
                                            title: strings('walletBackup.step0Screen.showQR')
                                        }}
                                    />
                                </View>
                            )}

                            {isInited && !isShowingPhrase && !isXMR && (
                                <View style={{
                                    paddingHorizontal: GRID_SIZE,
                                    paddingVertical: GRID_SIZE * 1.5,
                                }}>
                                    <TwoButtons
                                        mainButton={{
                                            disabled: !approvedBackup,
                                            onPress: this.onNext,
                                            title: strings('walletBackup.step0Screen.next')
                                        }}
                                        secondaryButton={isCreate ? {
                                            type: 'settings',
                                            onPress: this.openWalletSettings,
                                            onLongPress: this.handleCopyModal,
                                            delayLongPress: 4000
                                        } : undefined}
                                    />
                                </View>
                            )}
                        </>
                    }
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsData: getSettingsScreenData(state),
        selectedWalletData: getSelectedWalletData(state),
        createWalletStore: state.createWalletStore,
        lockScreenStatus: getLockScreenStatus(state)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

BackupStep0Screen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(BackupStep0Screen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between'
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoText: {
        marginLeft: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        flex: 1
    },
    mnemonicContainer: {
        flexDirection: 'row',
        // flexWrap: 'wrap'
    },
    mnemonicColumn: {
        flex: 1
    },
    wordContainer: {
        flex: 1,
        minWidth: 100,
        minHeight: 36,
        padding: 8,
        marginVertical: 7,
        borderRadius: 8
    },
    wordIndexContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 8,
        top: 8,
        bottom: 8,
        borderRadius: 6
    },
    wordIndex: {
        fontFamily: 'Montserrat-Semibold',
        fontSize: 10,
        lineHeight: 13,
    },
    word: {
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.3
    },
    showMnemonicButton: {
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    keyCircle: {
        width: 24,
        height: 24,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    wrapperQR: {
        alignItems: 'center',
    },
    qr: {
        position: 'relative',
        backgroundColor: '#F5F5F5',
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,

    },
})
