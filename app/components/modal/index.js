import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimensions, View, Platform } from 'react-native'

import { BlurView } from '@react-native-community/blur'
import BlurOverlay from 'react-native-blur-overlay'

import MnemonicFailModal from '../../modules/WalletBackup/elements/MnemomicFail'
import SkipModal from '../../modules/WalletBackup/elements/Skip'
import CongratsModal from '../../modules/WalletCreate/elements/CongratsModal'
import ConfirmTransactionModal from '../../modules/Send/elements/ConfirmModal'
import ChooseInfoModal from '../../modules/Exchange/elements/InfoChooseModal'

import LicenseTermsModal from './elements/LicenseTermsModal'
import LoginModal from './elements/LoginModal'
import InfoModal from './elements/InfoModal'
import CustomReceiveAmountModal from './elements/CustomReceiveAmountModal'

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");


class SettingsMain extends Component {

    constructor(props){
        super(props)
        this.state = {
            viewRef: null,
            blur: false
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if(this.props.modal.show != nextProps.modal.show){
            if(nextProps.modal.show){
                setTimeout(() => {
                    this.setState({
                        blur: true
                    })
                }, 0)
            } else {
                setTimeout(() => {
                    this.setState({
                        blur: false
                    })
                }, 0)
            }
        }
    }

    renderTemplate = () => {
        const {
            show,
            data,
            callback
        } = this.props.modal

        switch(data.type){
            case 'CUSTOM_RECEIVE_AMOUNT_MODAL':
                return <CustomReceiveAmountModal show={show} data={data} callback={callback} />
            case 'MNEMONIC_FAIL_MODAL':
                return <MnemonicFailModal show={show} callback={callback} />
            case 'LICENSE_TERMS_MODAL':
                return <LicenseTermsModal show={show} callback={callback} />
            case 'BACKUP_SKIP_MODAL':
                return <SkipModal show={show} />
            case 'WALLET_CREATE_CONGRATS_MODAL':
                return <CongratsModal show={show} />
            case 'CONFIRM_TRANSACTION_MODAL':
                return <ConfirmTransactionModal show={show} data={data} callback={callback} />
            case 'CHOOSE_INFO_MODAL':
                return <ChooseInfoModal show={show} data={data} />
            case 'LOGIN_MODAL':
                return <LoginModal show={show} data={data} callback={callback} />
            case 'INFO_MODAL':
                return <InfoModal show={show} data={data} callback={callback} />
            default:
                return <View></View>
        }
    }

    render = () => {
        const {
            show,
        } = this.props.modal

        return (
            <View style={show ? styles.wrapper : styles.wrapper_hidden}>
                {
                    this.state.blur ?  <BlurView style={styles.absolute}
                                                 blurType="light"
                                                 blurAmount={10} /> : null
                }

                {
                    Platform.OS === 'android' ?
                        <BlurOverlay
                            radius={20}
                            downsampling={2}
                            brightness={2}
                            customStyles={{alignItems: 'center', justifyContent: 'center'}}
                            blurStyle="light"
                        /> : null
                }
                { this.renderTemplate() }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        modal: state.modalStore
    }
}

const styles = {
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT
    },
    wrapper_hidden: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: 0,
        height: 0,

        overflow: 'hidden'
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        opacity: .1,
        backgroundColor: '#000'
    },
    absolute: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    },
}

export default connect(mapStateToProps, {})(SettingsMain)
