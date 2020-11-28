/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimensions, View } from 'react-native'


import MnemonicFailModal from '../../modules/WalletBackup/elements/MnemomicFail'
import SkipModal from '../../modules/WalletBackup/elements/Skip'
import CongratsModal from '../../modules/WalletCreate/elements/CongratsModal'
import ChooseInfoModal from '../../modules/Trade/elements/InfoChooseModal'

import LicenseTermsModal from './elements/LicenseTermsModal'
import SelectCoinModal from './elements/SelectCoinModal'
import LoginModal from './elements/LoginModal'
import InfoModal from './elements/InfoModal'
import SelectModal from './elements/SelectModal'
import CustomReceiveAmountModal from './elements/CustomReceiveAmountModal'
import ExchangeProviderInfoModal from './elements/ExchangeProviderInfoModal'
import OpenSettingsModal from './elements/OpenSettingsModal'
import YesNoModal from './elements/YesNoModal'
import UpdateModal from './elements/UpdateModal'
import NewInterface from './elements/NewInterface'
import RbfModal from './elements/RbfModal'
import InputModal from './elements/InputModal'
import PaymentSystemInfo from './elements/PaymentSystemInfo'
import WalletSettingsModal from './elements/WallletSettingsModa'

import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'


const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')


class MainModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            viewRef: null,
            blur: false
        }
    }

    renderTemplate = () => {
        const {
            show,
            data,
            callback
        } = this.props.modal

        switch (data.type) {
            case 'YES_NO_MODAL':
                return <YesNoModal show={show} data={data} callback={callback}/>
            case 'CUSTOM_RECEIVE_AMOUNT_MODAL':
                return <CustomReceiveAmountModal show={show} data={data} callback={callback}/>
            case 'MNEMONIC_FAIL_MODAL':
                return <MnemonicFailModal show={show} callback={callback}/>
            case 'LICENSE_TERMS_MODAL':
                return <LicenseTermsModal show={show} callback={callback}/>
            case 'SELECT_COIN_MODAL':
                return <SelectCoinModal show={show} callback={callback} data={data}/>
            case 'BACKUP_SKIP_MODAL':
                return <SkipModal show={show}/>
            case 'WALLET_CREATE_CONGRATS_MODAL':
                return <CongratsModal show={show}/>
            case 'CHOOSE_INFO_MODAL':
                return <ChooseInfoModal show={show} data={data}/>
            case 'LOGIN_MODAL':
                return <LoginModal show={show} data={data} callback={callback}/>
            case 'INFO_MODAL':
                return <InfoModal show={show} data={data} callback={callback}/>
            case 'SELECT_MODAL':
                return <SelectModal show={show} data={data} callback={callback}/>
            case 'PAYMENT_SYSTEM_INFO_MODAL':
                return <PaymentSystemInfo show={show} data={data} callback={callback}/>
            case 'EXCHANGE_PROVIDER_INFO_MODAL':
                return <ExchangeProviderInfoModal show={show} data={data} callback={callback}/>
            case 'OPEN_SETTINGS_MODAL':
                return <OpenSettingsModal show={show} data={data} callback={callback}/>
            case 'INPUT_MODAL':
                return <InputModal show={show} data={data} callback={callback}/>
            case 'WALLET_SETTINGS_MODAL':
                return <WalletSettingsModal show={show} data={data} callback={callback}/>
            case 'WALLET_UPDATE':
            case 'UPDATE_MODAL':
                return <UpdateModal show={show} data={data} callback={callback}/>
            case 'NEW_INTERFACE':
                return <NewInterface show={show} data={data} callback={callback}/>
            case 'RBF_ACTIVE':
                return <RbfModal show={show} data={data} callback={callback}/>
            default:
                return <View></View>
        }
    }

    render = () => {
        const {
            show
        } = this.props.modal

        return (
            <View style={show ? styles.wrapper : styles.wrapper_hidden}>
                <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: '#000', opacity: .5, overflow: 'hidden' }}/>
                {this.renderTemplate()}
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
        right: 0
    }
}

export default connect(mapStateToProps, {})(MainModal)
