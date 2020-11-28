/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Dimensions, PixelRatio } from 'react-native'
import Icon from 'react-native-vector-icons/AntDesign'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'

import Button from '../../components/elements/Button'
import GradientView from '../../components/elements/GradientView'
import TextView from '../../components/elements/Text'

import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../../app/services/i18n'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setWalletMnemonic } from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import BlocksoftKeys from '../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import Log from '../../services/Log/Log'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import firebase from 'react-native-firebase'
import IconAwesome from 'react-native-vector-icons/FontAwesome'
import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import BlocksoftSecrets from '../../../crypto/actions/BlocksoftSecrets/BlocksoftSecrets'
import Toast from '../../services/UI/Toast/Toast'

const { height: WINDOW_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8
}

class BackupStep0Screen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            walletMnemonic: '',
            walletMnemonicArray: [],
            needPasswordConfirm: false
        }
        this.skipModal = React.createRef()
    }

    async componentDidMount() {
        try {
            Log.log('WalletBackup.BackupStep0Screen.componentDidMount init')

            const { flowType, mnemonicLength } = this.props.createWalletStore

            let walletMnemonic = ''
            let mnemonic = ''
            let needPasswordConfirm = false
            if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {
                const { settingsStore } = this.props
                const selectedWallet = this.props.selectedWallet
                if (selectedWallet && selectedWallet.walletHash) {
                    try {
                        mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(selectedWallet.walletHash)
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


            const walletMnemonicArray = walletMnemonic.split(' ')

            setWalletMnemonic({ walletMnemonic })
            this.setState({
                walletMnemonic,
                walletMnemonicArray,
                needPasswordConfirm
            })

        } catch (e) {
            Log.err('WalletBackup.BackupStep0Screen.componentDidMount error ' + e.message)
        }
    }

    selectSettingsCallback = async () => {

        const { mnemonicLength } = this.props.createWalletStore

        const walletMnemonic = (await BlocksoftKeys.newMnemonic(mnemonicLength)).mnemonic

        setWalletMnemonic({ walletMnemonic })
        const walletMnemonicArray = walletMnemonic.split(' ')

        this.setState({
            walletMnemonic,
            walletMnemonicArray
        })
    }

    handleCopyModal = () => {
        const { walletMnemonic } = this.state

        copyToClipboard(walletMnemonic)
        Toast.setMessage(strings('toast.copied')).show()
    }

    onPress = () => {
        NavStore.goNext('BackupStep1Screen')
    }

    onGoogle = () => {
        NavStore.goNext('BackupStepGoogle')
    }

    renderSettingsIcon = () => {
        return (
            <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }} onPress={this.openWalletSettings}>
                <View style={{ paddingVertical: 12 }}>
                    <IconAwesome size={20} name="gear" color={`#404040`}/>
                </View>
            </TouchableOpacity>
        )
    }

    openWalletSettings = () => {
        showModal({
                type: 'WALLET_SETTINGS_MODAL',
                title: strings('modal.walletCreateSettingsModal.title'),
                description: ''
            }, this.selectSettingsCallback
        )
    }

    handleAfterPin = () => {
        setLoaderStatus(false)
        this.setState({
            needPasswordConfirm: false
        })
    }

    render() {

        firebase.analytics().setCurrentScreen('WalletBackup.BackupStep0Screen')

        const { flowType, mnemonicLength } = this.props.createWalletStore

        if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {
            const {
                needPasswordConfirm
            } = this.state

            if (needPasswordConfirm) {
                lockScreenAction.setFlowType({ flowType: 'CONFIRM_BACKUP_WALLET' })
                lockScreenAction.setActionCallback({ actionCallback: this.handleAfterPin })
                NavStore.goNext('LockScreen')
                return (
                    <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Navigation
                            title={strings('walletBackup.title')}
                            isClose={false}
                        />
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={styles.wrapper__scrollView}>
                            <View style={styles.wrapper__content}>
                                <TextView style={{ height: 90 }}>
                                    {strings('walletBackup.description', {
                                        mnemonicLength: mnemonicLength === 256 ? 24 : 12,
                                        words: mnemonicLength === 256 ? strings('walletCreate.words24') : strings('walletCreate.words12')
                                    })}
                                </TextView>
                                <Image
                                    style={styles.img}
                                    resizeMode='stretch'
                                    source={require('../../assets/images/importSave.png')}
                                />
                                <View style={styles.seed}>
                                    <Text>
                                        {strings('walletBackup.pinProtected')}
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    </GradientView>
                )
            }
        }

        let totalWords = 12
        if (mnemonicLength === 256 || (typeof this.state.walletMnemonicArray !== 'undefined' && this.state.walletMnemonicArray.length > 12)) {
            totalWords = 24
        }

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                {
                    flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR' ?
                        <Navigation
                            title={strings('walletBackup.title')}
                            isClose={false}
                        /> :
                        <Navigation
                            title={SIZE === 8 ? strings('walletBackup.titleNewWalletSmall') : strings('walletBackup.titleNewWallet')}
                            nextTitle={strings('walletBackup.skip')}
                            isBack={false}
                            LeftComponent={this.renderSettingsIcon}
                            closeAction={() => NavStore.goBack()}
                        />
                }
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__content}>
                        <TextView style={{ height: 90 }}>
                            {

                                flowType === 'BACKUP_WALLET_XMR'
                                    ? strings('walletBackup.descriptionXMR')
                                    : strings('walletBackup.description', {
                                    mnemonicLength: totalWords,
                                    words: totalWords === 24 ? strings('walletCreate.words24') : strings('walletCreate.words12')
                                })

                            }
                        </TextView>
                        <Image
                            style={styles.img}
                            resizeMode='stretch'
                            source={require('../../assets/images/importSave.png')}
                        />
                        <View style={styles.seed}>
                            {
                                this.state.walletMnemonicArray.map((item, index) => {
                                    return (
                                        <View style={styles.seed__item} key={index}>
                                            <View style={styles.seed__index}>
                                                <Text style={styles.seed__index__text}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.seed__text}>{' ' + item}</Text>
                                        </View>
                                    )
                                })
                            }
                        </View>
                        <TouchableOpacity onPress={() => this.handleCopyModal()} style={styles.copyBtn}>
                            <Text style={styles.copyBtn__text}>
                                {strings('account.copy')}
                            </Text>
                            <Copy name="content-copy" size={18} color="#946288"/>
                        </TouchableOpacity>

                        {flowType !== 'BACKUP_WALLET_XMR' ?
                            <View style={styles.warning}>
                                <Icon style={styles.warning__icon} name="warning" size={20} color="#946288"/>
                                <Text style={styles.warning__text}>{strings('walletBackup.attention')}</Text>
                            </View> : null}

                        {flowType !== 'BACKUP_WALLET_XMR' ?
                            <Button press={this.onPress} styles={{ marginBottom: 50 }}>
                                {strings('walletBackup.written')}
                            </Button> : null}

                        {flowType !== 'BACKUP_WALLET_XMR' && false ?
                            <Button press={this.onGoogle} styles={{ marginBottom: 50 }}>
                                {strings('walletCreate.importGoogle')}
                            </Button> : null}

                    </View>
                </ScrollView>
            </GradientView>
        )
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

export default connect(mapStateToProps, mapDispatchToProps)(BackupStep0Screen)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__content: {
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30
    },
    title: {
        marginBottom: 10,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    text: {
        textAlign: 'justify',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999'
    },
    img: {
        alignSelf: 'center',
        width: 140,
        height: 200,
        marginBottom: 20
    },
    seed: {
        marginBottom: 10,
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    seed__item: {
        position: 'relative',

        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        marginBottom: 10,
        marginRight: 15,
        marginTop: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        backgroundColor: '#946288',
        color: '#fff',
        borderRadius: 8
    },
    seed__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center'
    },
    seed__index: {
        position: 'absolute',
        top: -10,
        right: -10,

        padding: Platform.OS === 'android' ? 2 : 4,
        width: 20,

        textAlign: 'center',

        backgroundColor: '#fff',

        borderRadius: 20,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    seed__index__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 10,
        textAlign: 'center',
        color: '#404040'
    },
    warning: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 15
    },

    warning__icon: {
        marginRight: 5
    },
    warning__text: {
        marginTop: 2,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#404040'
    },
    btn: {
        marginBottom: 50
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: 35
    },
    copyBtn__text: {
        marginTop: 2,
        marginRight: 17,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 10,
        color: '#946288'
    },
    button__line: {
        width: '100%',
        marginBottom: 50,
        backgroundColor: '#f6f6f6'
    }
})
