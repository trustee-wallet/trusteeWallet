/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, Dimensions, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'

import Modal from 'react-native-modal'

import Button from '../../../components/elements/Button'
import ButtonLine from '../../../components/elements/ButtonLine'
import GradientView from '../../../components/elements/GradientView'

import NavStore from '../../navigation/NavStore'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'
import Netinfo from '../../../services/Netinfo/Netinfo'
import cryptoWalletActions from '../../../appstores/Actions/CryptoWalletActions'
import UpdateCashBackDataDaemon from '../../../daemons/back/UpdateCashBackDataDaemon'
import CashBackActions from '../../../appstores/Stores/CashBack/CashBackActions'


const { width: WINDOW_WIDTH } = Dimensions.get('window')


export class LoginModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedWallet: {}
        }
    }

    UNSAFE_componentWillMount() {
        this.setState({
            selectedWallet: this.props.mainStore.selectedWallet
        })
    }


    handleSelect = (selectedWallet) => this.setState({ selectedWallet })

    declineCallback = () => {
        hideModal()
    }

    acceptCallback = async () => {
        try {
            await Netinfo.isInternetReachable()

            hideModal()
            setLoaderStatus(true)

            await cryptoWalletActions.setSelectedWallet(this.state.selectedWallet.walletHash, 'LoginModal')

            await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

            setLoaderStatus(false)
        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('LoginModal.Login error ' + e.message)
            } else {
                Log.err('LoginModal.Login error ' + e.message)
            }
        }
    }

    render() {
        const { selectedWallet } = this.state

        const { show } = this.props
        const { wallets } = this.props.walletStore

        const title = strings('modal.login.title')
        const description = strings('modal.login.description')

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Text style={styles.title}>
                            {title}
                        </Text>
                        <Text style={styles.text}>
                            {description}
                        </Text>
                        <View style={{ ...styles.checkbox }}>
                            {
                                wallets.map((item, index) => {
                                    return (
                                        <View style={styles.checkbox__wrap} key={index}>
                                            <TouchableOpacity
                                                onPress={() => this.handleSelect(item)}
                                                disabled={selectedWallet.walletHash === item.walletHash ? true : false}
                                                style={styles.checkbox__item}>
                                                <GradientView
                                                    style={styles.checkbox__circle}
                                                    array={selectedWallet.walletHash === item.walletHash ? styles_active.array : styles_.array}
                                                    start={styles_.start}
                                                    end={styles_.end}>
                                                </GradientView>
                                                <Text style={{
                                                    ...styles.checkbox__item__title,
                                                    flex: 1,
                                                    color: selectedWallet.walletHash === item.walletHash ? '#efa1ae' : '#f4f4f4' }}
                                                      numberOfLines={2}>
                                                    {item.walletName}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })
                            }
                            <View/>
                            <View/>
                            <View/>
                            <View/>
                        </View>
                    </GradientView>

                    <View style={styles.bottom}>
                        <Button press={() => this.declineCallback()} styles={styles.btn}>
                            {strings('modal.login.btn.back')}
                        </Button>
                        <ButtonLine press={() => this.acceptCallback()} styles={styles.btn}>
                            {strings('modal.login.btn.login')}
                        </ButtonLine>
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles_active = {
    array: ['#b95f94', '#eba0ae'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        walletStore : state.walletStore
    }
}

export default connect(mapStateToProps, {})(LoginModal)


const styles = {
    modal: {
        padding: 15,
        justifyContent: 'center'
    },
    content: {
        borderRadius: 14,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    bg: {
        alignItems: 'center',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    },
    cross: {
        position: 'absolute',
        top: 10,
        right: 10
    },
    icon: {
        width: 230,
        height: 220,
        marginTop: 10,
        marginBottom: 10
    },
    title: {
        marginTop: 12,
        marginBottom: 5,
        width: WINDOW_WIDTH < 410 ? 180 : '80%',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 18,
        textAlign: 'center',
        color: '#f4f4f4'
    },
    text: {
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#f4f4f4'
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 24,
        paddingBottom: 24
    },
    btn: {
        width: WINDOW_WIDTH > 320 ? 122 : 100
    },
    checkbox: {
        width: '100%',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    checkbox__wrap: {
        width: '50%'
    },
    checkbox__item: {
        flexDirection: 'row',
        alignItems: 'center',

        height: 50,
        marginBottom: 1,
        paddingLeft: 10,
        paddingRight: 10,

        borderRadius: 9
    },
    checkbox__circle: {
        width: 16,
        height: 16,
        marginLeft: 15,
        marginRight: 15,
        borderRadius: 8
    }
}
