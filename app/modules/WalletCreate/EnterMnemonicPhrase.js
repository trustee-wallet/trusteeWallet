/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Keyboard, Dimensions, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import firebase from 'react-native-firebase'

import Button from '../../components/elements/Button'
import Input from '../../components/elements/Input'
import GradientView from '../../components/elements/GradientView'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import App from '../../appstores/Actions/App/App'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setCallback, setWalletMnemonic, proceedSaveGeneratedWallet } from '../../appstores/Stores/CreateWallet/CreateWalletActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import walletDS from '../../appstores/DataSource/Wallet/Wallet'

import { strings } from '../../services/i18n'

import Log from '../../services/Log/Log'
import walletActions from '../../appstores/Stores/Wallet/WalletActions'
import IconAwesome from 'react-native-vector-icons/FontAwesome'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

const data = {
    id: 'mnemonicPhrase',
    type: 'MNEMONIC_PHRASE'
}


class EnterMnemonicPhrase extends Component {

    constructor(props) {
        super(props)
        this.state = {
            focused: false,
            walletExist: false
        }
        this.mnemonicPhrase = React.createRef()
    }


    handleImport = async () => {


        const { walletName, callback } = this.props.walletCreate

        const result = await this.mnemonicPhrase.handleValidate()

        if (result.status !== 'success') {
            return false
        }

        if (result.status === 'success' && await walletDS.walletExist(result.value)) {
            this.setState({
                walletExist: true
            })
            return false
        } else {
            this.setState({
                walletExist: false
            })
        }

        const walletMnemonic = result.value
        setWalletMnemonic(walletMnemonic)

        try {

            Keyboard.dismiss()

            setLoaderStatus(true)

            let tmpWalletName = walletName

            if(!tmpWalletName) {
                tmpWalletName = await walletActions.getNewWalletName()
            }

            await proceedSaveGeneratedWallet({
                walletName: tmpWalletName,
                walletMnemonic,
                walletIsBackedUp: 1
            }, 'IMPORT')

            await App.refreshWalletsStore()

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.walletCreate.success'),
                description: strings('modal.walletCreate.walletImported')
            }, async () => {
                if (callback === null) {
                    NavStore.reset('DashboardStack')
                } else {
                    callback()
                    setCallback({ callback: null })
                }
            })

        } catch (e) {
            Log.err('WalletCreate.EnterMnemonicPhrase error ' + e.message)

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.send.fail'),
                description: e.message
            })

        }

    }

    onFocus = () => {
        this.setState({
            focused: true
        })
    }

    renderWalletExistError = () => {

        const { walletExist } = this.state

        if (walletExist) {
            return (
                <View style={styles.texts}>
                    <View style={styles.texts__icon}>
                        <Icon
                            name="information-outline"
                            size={16}
                            color="#e77ca3"
                        />
                    </View>
                    <View>
                        <Text style={styles.texts__item}>
                            {strings('walletCreate.walletExist')}
                        </Text>
                    </View>
                </View>
            )
        }
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

    render() {
        firebase.analytics().setCurrentScreen('WalletCreate.EnterMnemonicPhraseScreen')
        const { focused } = this.state

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('walletCreate.importTitle')}
                    isBack={false}
                    LeftComponent={this.renderSettingsIcon}
                    closeAction={() => NavStore.goBack()}
                />
                <KeyboardAwareView>
                    <ScrollView
                        keyboardShouldPersistTaps={'always'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                        style={styles.wrapper__scrollView}>
                        <Text style={styles.text}>
                            {strings('walletCreate.enterMnemonic.description')}
                        </Text>
                        <Input
                            ref={component => this.mnemonicPhrase = component}
                            id={data.id}
                            name={strings('walletCreate.enterMnemonic.mnemonic')}
                            type={data.type}
                            autoFocus={true}
                            onFocus={() => this.onFocus()}
                            callback={() => {
                                this.setState({
                                    walletExist: false
                                })
                            }}/>
                        {this.renderWalletExistError()}
                        <View style={styles.qr}>
                            <View></View>
                            <Button styles={styles.btn} press={this.handleImport}>
                                {strings('walletCreate.importTitle')}
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAwareView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        walletCreate: state.createWalletStore
    }
}

export default connect(mapStateToProps, {})(EnterMnemonicPhrase)

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
        flex: 1,
        minHeight: WINDOW_HEIGHT - 100,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    wrapper__content_active: {
        flex: 1,
        minHeight: 200,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    btn: {
        width: '100%'
    },
    title: {
        marginBottom: 10,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    img: {
        width: 150,
        height: 150,
        marginBottom: 50
    },
    text: {
        marginBottom: 10,
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999'
    },
    qr: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e77ca3'
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
