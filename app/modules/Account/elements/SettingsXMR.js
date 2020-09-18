/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, Switch, Text, TouchableOpacity, Keyboard } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { strings } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../../appstores/Stores/Main/MainStoreActions'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import accountScanningDS from '../../../appstores/DataSource/Account/AccountScanning'
import accountHdDS from '../../../appstores/DataSource/Account/AccountHd'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'
import Log from '../../../services/Log/Log'
import UpdateAccountBalanceAndTransactions from '../../../daemons/back/UpdateAccountBalanceAndTransactions'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import Input from '../../../components/elements/Input'
import { setQRConfig, setQRValue } from '../../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import NavStore from '../../../components/navigation/NavStore'
import Button from '../../../components/elements/Button'
import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import Toast from '../../../services/UI/Toast/Toast'
import { setFlowType } from '../../../appstores/Stores/CreateWallet/CreateWalletActions'

let CACHE_INITED = false

class SettingsXMR extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentServer: '',
            currentServerSend: '',
            size: 0
        }
        this.serverInput = React.createRef()
        this.serverSendInput = React.createRef()
        CACHE_INITED = false
    }


    init = async () => {

        if (CACHE_INITED) {
            return true
        }

        let url = await settingsActions.getSetting('xmrServer')
        if (!url || url === 'false') url = ''

        let urlSend = await settingsActions.getSetting('xmrServerSend')
        if (!urlSend || urlSend === 'false') urlSend = ''

        this.serverInput.handleInput(url)
        this.serverSendInput.handleInput(urlSend)

        this.setState({
            currentServer: url,
            currentServerSend: urlSend
        })
        CACHE_INITED = true
    }

    handleSave = async () => {
        let serverInputValidate = { status: false }
        let serverSendInputValidate = { status: false }
        try {
            serverInputValidate = await this.serverInput.handleValidate()
            serverSendInputValidate = await this.serverSendInput.handleValidate()
        } catch (e) {
            Log.log('SettingsXmr.handleSave error validation ' + e.message)
        }
        if (serverInputValidate.status !== 'success' || serverSendInputValidate.status !== 'success') return

        let serverNewValue = serverInputValidate.value
        if (!serverNewValue) {
            serverNewValue = ''
        }
        await settingsActions.setSettings('xmrServer', serverNewValue)
        this.serverInput.handleInput(serverNewValue)


        let serverSendNewValue = serverSendInputValidate.value
        if (!serverSendNewValue) {
            serverSendNewValue = ''
        }
        await settingsActions.setSettings('xmrServerSend', serverSendNewValue)
        this.serverSendInput.handleInput(serverSendNewValue)

        this.setState({
            currentServer: serverNewValue,
            currentServerSend: serverSendNewValue
        })
        Keyboard.dismiss()
        Toast.setMessage(strings('toast.saved')).show()
    }

    handleSecrets = async () => {
        setFlowType({
            flowType: 'BACKUP_WALLET_XMR'
        })
        NavStore.goNext('BackupStep0Screen')
    }

    render() {
        const { containerStyle } = this.props
        this.init()

        return (
            <View style={[styles.settings, containerStyle]}>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <Text style={styles.text}>
                                    {strings('settings.walletList.serverInputXMR')}
                                </Text>
                                <Input
                                    ref={ref => this.serverInput = ref}
                                    id={'server'}
                                    name={strings('settings.walletList.serverInputTitleXMR')}
                                />
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <Text style={styles.text}>
                                    {strings('settings.walletList.serverSendInputXMR')}
                                </Text>
                                <Input
                                    ref={ref => this.serverSendInput = ref}
                                    id={'serverSend'}
                                    name={strings('settings.walletList.serverSendInputTitleXMR')}
                                />
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleSave}>
                                    <LetterSpacing text={strings('settings.walletList.saveSettings')}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={2}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleSecrets}>
                                    <LetterSpacing text={strings('settings.walletList.getMnemonicXMR')}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={2}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsXMR)

const styles = {
    settings: {
        position: 'relative',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        marginBottom: 100,

        borderRadius: 16,

        zIndex: 2
    },
    settings__main__title: {
        marginLeft: 15,
        marginBottom: 10,
        marginTop: -8,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold'
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040'
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#404040',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    },
    btn: {
        alignItems: 'center',

        padding: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    btn__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    }
}
