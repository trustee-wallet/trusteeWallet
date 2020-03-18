import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    Platform,
    Switch,
    Text
} from 'react-native'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import LetterSpacing from '../../../components/elements/LetterSpacing'
import NavStore from '../../../components/navigation/NavStore'

import { strings } from '../../../services/i18n'
import { setFlowType } from '../../../appstores/Actions/CreateWalletActions'
import { showModal } from '../../../appstores/Actions/ModalActions'
import walletActions from '../../../appstores/Actions/WalletActions'


class Wallet extends Component {

    constructor(props){
        super(props)
    }

    handleBackup = () => {
        setFlowType({
            flowType: 'BACKUP_WALLET'
        })
        NavStore.goNext('BackupStep0Screen')
    }

    handleEnableHD = () => {

        const { wallet_hash: walletHash } = this.props.wallet

        showModal({
            type: 'YES_NO_MODAL',
            title: strings("settings.walletList.hdEnableModal.title"),
            icon: "WARNING",
            description: strings("settings.walletList.hdEnableModal.description")
        }, () => {
            walletActions.turnOnHD(walletHash)
        })
    }

    handleUseUnconfirmed = () => {
        const { wallet_hash: walletHash, wallet_use_unconfirmed: walletUseUnconfirmed } = this.props.wallet
        walletActions.setUseUnconfirmed(walletHash, walletUseUnconfirmed > 0 ? 0 : 1)
    }

    render() {

        const { toggleShowSettings, wallet } = this.props

        return (
            <View style={styles.settings}>
                <View style={{ width: "100%" }}>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settings__title}>{ strings("settings.walletList.useUnconfirmed") }</Text>
                            </View>
                            <View>
                                {
                                    Platform.OS === 'android' ?
                                        <Switch
                                            thumbColor="#fff"
                                            trackColor={{true: '#864DD9', false: '#dadada'}}
                                            onValueChange={this.handleUseUnconfirmed}
                                            value={!!wallet.wallet_use_unconfirmed}
                                            disabled={false} />
                                        :
                                        <Switch
                                            trackColor={{true: '#864DD9'}}
                                            style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                            onValueChange = {this.handleUseUnconfirmed}
                                            value={!!wallet.wallet_use_unconfirmed}
                                            disabled={false} />
                                }
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1 }}>
                                <LetterSpacing text={"HD"} textStyle={{...styles.settings__title}} letterSpacing={0.5} />
                            </View>
                            <View>
                            {
                                Platform.OS === 'android' ?
                                    <Switch
                                        thumbColor="#fff"
                                        trackColor={{true: '#864DD9', false: '#dadada'}}
                                        onValueChange={this.handleEnableHD}
                                        value={!!wallet.wallet_is_hd}
                                        disabled={!!wallet.wallet_is_hd} />
                                    :
                                    <Switch
                                        trackColor={{true: '#864DD9'}}
                                        style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                        onValueChange = {this.handleEnableHD}
                                        value={!!wallet.wallet_is_hd}
                                        disabled={!!wallet.wallet_is_hd} />
                            }
                            </View>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.settings__close} onPress={toggleShowSettings}>
                    <MaterialCommunityIcons style={styles.settings__close__icon} name="window-close" />
                </TouchableOpacity>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        state
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Wallet)

const styles = {
    settings: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        position: "absolute",
        right: 0,

        height: "100%",

        backgroundColor: "#f2f2f2",

        zIndex: 4
    },
    settings__title: {
        fontFamily: "SFUIDisplay-Semibold",
        fontSize: 12,
        color: "#404040"
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 5,
        marginRight: 50
    },
    settings__close: {
        position: "absolute",
        top: 24,
        right: 0,

        padding: 15,
    },
    settings__close__icon: {
        fontSize: 24,
        color: "#864DD9"
    },
    settings__line: {
        height: 1,
    },
    settings__line__item: {
        height: "100%",
        backgroundColor: "#000"
    }
}
