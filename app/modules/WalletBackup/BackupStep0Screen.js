/**
 * @version 0.30
 * @todo clear commented code
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Animated,
} from 'react-native'
import firebase from 'react-native-firebase'
import LottieView from 'lottie-react-native'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../../app/services/i18n'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import {
    setWalletMnemonic,
    setMnemonicLength,
    setWalletName,
    setFlowType,
} from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import BlocksoftKeys from '../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import Log from '../../services/Log/Log'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import BlocksoftSecrets from '../../../crypto/actions/BlocksoftSecrets/BlocksoftSecrets'
import Toast from '../../services/UI/Toast/Toast'

import Header from '../../components/elements/new/Header'
import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import CheckBox from '../../components/elements/new/CheckBox'

import ProgressAnimation from '../../assets/jsons/animations/pieWithStroke.json'
import KeyIcon from '../../assets/images/key'

import { ThemeContext } from '../../modules/theme/ThemeProvider'


const VISIBILITY_TIMEOUT = 4000;

class BackupStep0Screen extends Component {
    visibilityTimer;

    scrollView;

    headerProps = {}

    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            walletMnemonic: '',
            walletMnemonicArray: [],
            needPasswordConfirm: false,
            isMnemonicVisible: false,
            approvedBackup: false,
            animationProgress: new Animated.Value(0),
            flowSubtype: '', // one of: 'backup', 'createFirst', 'createAnother', 'show'
        }
    }

    async componentDidMount() {
        try {
            Log.log('WalletBackup.BackupStep0Screen.componentDidMount init')

            const { flowType, mnemonicLength } = this.props.createWalletStore

            const flowSubtype = this.props.navigation.getParam('flowSubtype', 'createFirst')
            let walletMnemonic = ''
            let mnemonic = ''
            let needPasswordConfirm = false
            if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {
                const { settingsStore } = this.props
                const selectedWallet = this.props.selectedWallet
                if (selectedWallet && selectedWallet.walletHash) {
                    try {
                        mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(selectedWallet.walletHash, 'BackupStep0Screen.mount')
                    } catch {
                        Log.log('WalletBackup.BackupStep0Screen error mnemonic for ' + selectedWallet.walletHash)
                    }
                }
                if (flowType === 'BACKUP_WALLET_XMR') {
                    walletMnemonic = await (BlocksoftSecrets.setCurrencyCode('XMR').setMnemonic(mnemonic)).getWords()
                } else {
                    walletMnemonic = mnemonic
                }
                if (+settingsStore.lock_screen_status) {
                    needPasswordConfirm = true
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
                this.headerProps.rightAction = () => this.handleClose('DashboardStack')
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
                needPasswordConfirm,
                flowSubtype
            })

        } catch (e) {
            Log.err('WalletBackup.BackupStep0Screen.componentDidMount error ' + e.message)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const { walletMnemonic, mnemonicLength } = nextProps.createWalletStore

        if (this.props.createWalletStore.mnemonicLength !== nextProps.createWalletStore.mnemonicLength) {
            this.scrollView.scrollTo?.({ x: 0, y: 0, animated: true })

            const walletMnemonicArray = walletMnemonic.split(' ')
            this.setState(() => ({
                walletMnemonicArray,
                walletMnemonic
            }))
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
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

    // handleAfterPin = () => {
    //     setLoaderStatus(false)
    //     this.setState({
    //         needPasswordConfirm: false
    //     })
    // }

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

    handleClose = (route) => {
        this.resetWalletStore()
        NavStore.reset(route)
    }

    triggerMnemonicVisible = (visibility) => {
        if (this.visibilityTimer) return;
        this.setState(() => ({ isMnemonicVisible: visibility }))
    }

    // handleAfterPin = () => {
    //     setLoaderStatus(false)
    //     this.setState({
    //         needPasswordConfirm: false
    //     })
    // }

    showMnemonic = () => {
        this.visibilityTimer = setTimeout(() => {
            this.visibilityTimer = null
            this.setState(() => ({ isMnemonicVisible: false }))
        }, VISIBILITY_TIMEOUT)

        this.setState(() => ({ isMnemonicVisible: true }), () => {
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
        const {
            headerHeight,
            walletMnemonicArray,
            isMnemonicVisible,
            approvedBackup,
            animationProgress,
            flowSubtype
        } = this.state
        const { flowType, mnemonicLength } = this.props.createWalletStore

        const isShowingPhrase = flowSubtype === 'show'
        const isBackUp = flowSubtype === 'backup'
        const isCreate = flowSubtype === 'createFirst' || flowSubtype === 'createAnother'
        const isXMR = flowType === 'BACKUP_WALLET_XMR'
        const { GRID_SIZE, colors } = this.context

        firebase.analytics().setCurrentScreen('WalletBackup.BackupStep0Screen')

        const halfArrayNum = Math.ceil(walletMnemonicArray.length / 2);


        let infoText = strings('walletBackup.step0Screen.info')
        if ( isXMR ) {
            infoText = strings('walletBackup.descriptionXMR')
        }

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    {...this.headerProps}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        ref={ref => { this.scrollView = ref }}
                        contentContainerStyle={styles.scrollViewContent}
                    >
                        <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
                            <View style={[styles.infoContainer, { marginBottom: GRID_SIZE }]}>
                                {this.visibilityTimer ? (
                                    <LottieView source={ProgressAnimation} style={{ width: 24, height: 24 }} progress={animationProgress} />
                                ) : (
                                    <KeyIcon color={colors.createWalletScreen.showMnemonic.showButtonText} />
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

                        {!isShowingPhrase && !isXMR && (
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
                    </ScrollView>
                </SafeAreaView>
            </View>
        )

        // if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {
        //     const {
        //         needPasswordConfirm
        //     } = this.state

        //     if (needPasswordConfirm) {
        //         lockScreenAction.setFlowType({ flowType: 'CONFIRM_BACKUP_WALLET' })
        //         lockScreenAction.setActionCallback({ actionCallback: this.handleAfterPin })
        //         NavStore.goNext('LockScreen')
        //         return (
        //             <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
        //                 <Navigation
        //                     title={strings('walletBackup.title')}
        //                     isClose={false}
        //                 />
        //                 <ScrollView
        //                     showsVerticalScrollIndicator={false}
        //                     style={styles.wrapper__scrollView}>
        //                     <View style={styles.wrapper__content}>
        //                         <TextView style={{ height: 90 }}>
        //                             {strings('walletBackup.description', {
        //                                 mnemonicLength: mnemonicLength === 256 ? 24 : 12,
        //                                 words: mnemonicLength === 256 ? strings('walletCreate.words24') : strings('walletCreate.words12')
        //                             })}
        //                         </TextView>
        //                         <Image
        //                             style={styles.img}
        //                             resizeMode='stretch'
        //                             source={require('../../assets/images/importSave.png')}
        //                         />
        //                         <View style={styles.seed}>
        //                             <Text>
        //                                 {strings('walletBackup.pinProtected')}
        //                             </Text>
        //                         </View>
        //                     </View>
        //                 </ScrollView>
        //             </GradientView>
        //         )
        //     }
        // }

        // return (
        //     <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
        //         {
        //             flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR' ?
        //                 <Navigation
        //                     title={strings('walletBackup.title')}
        //                     isClose={false}
        //                 /> :
        //                 <Navigation
        //                     title={SIZE === 8 ? strings('walletBackup.titleNewWalletSmall') : strings('walletBackup.titleNewWallet')}
        //                     nextTitle={strings('walletBackup.skip')}
        //                     isBack={false}
        //                     LeftComponent={this.renderSettingsIcon}
        //                     closeAction={() => NavStore.goBack()}
        //                 />
        //         }
        //         <ScrollView
        //             showsVerticalScrollIndicator={false}
        //             style={styles.wrapper__scrollView}>
        //             <View style={styles.wrapper__content}>
        //                 <TextView style={{ height: 90 }}>
        //                     {

        //                         flowType === 'BACKUP_WALLET' ? strings('walletBackup.description', {
        //                             mnemonicLength: totalWords,
        //                             words: totalWords === 24 ? strings('walletCreate.words24') : strings('walletCreate.words12')
        //                         }) : strings('walletBackup.descriptionXMR')

        //                     }
        //                 </TextView>
        //                 <Image
        //                     style={styles.img}
        //                     resizeMode='stretch'
        //                     source={require('../../assets/images/importSave.png')}
        //                 />
        //                 <View style={styles.seed}>
        //                     {
        //                         this.state.walletMnemonicArray.map((item, index) => {
        //                             return (
        //                                 <View style={styles.seed__item} key={index}>
        //                                     <View style={styles.seed__index}>
        //                                         <Text style={styles.seed__index__text}>{index + 1}</Text>
        //                                     </View>
        //                                     <Text style={styles.seed__text}>{' ' + item}</Text>
        //                                 </View>
        //                             )
        //                         })
        //                     }
        //                 </View>
        //                 <TouchableOpacity onPress={() => this.handleCopyModal()} style={styles.copyBtn}>
        //                     <Text style={styles.copyBtn__text}>
        //                         {strings('account.copy')}
        //                     </Text>
        //                     <Copy name="content-copy" size={18} color="#946288" />
        //                 </TouchableOpacity>

        //                 {flowType !== 'BACKUP_WALLET_XMR' ?
        //                     <View style={styles.warning}>
        //                         <Icon style={styles.warning__icon} name="warning" size={20} color="#946288" />
        //                         <Text style={styles.warning__text}>{strings('walletBackup.attention')}</Text>
        //                     </View> : null}

        //                 {flowType !== 'BACKUP_WALLET_XMR' ?
        //                     <Button press={this.onPress} styles={{ marginBottom: 50 }}>
        //                         {strings('walletBackup.written')}
        //                     </Button> : null}

        //                 {flowType !== 'BACKUP_WALLET_XMR' && false ?
        //                     <Button press={this.onGoogle} styles={{ marginBottom: 50 }}>
        //                         {strings('walletCreate.importGoogle')}
        //                     </Button> : null}

        //             </View>
        //         </ScrollView>
        //     </GradientView>
        // )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore.data,
        selectedWallet: state.mainStore.selectedWallet,
        createWalletStore: state.createWalletStore
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
    container: {
        flex: 1
    },
    content: {
        flex: 1,
        justifyContent: 'space-between'
    },
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
    }
})
