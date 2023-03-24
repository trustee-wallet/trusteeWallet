/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimensions, View } from 'react-native'


import MnemonicFailModal from '@app/modules/WalletBackup/elements/MnemomicFail'
import SkipModal from '@app/modules/WalletBackup/elements/Skip'

import SelectCoinModal from './elements/SelectCoinModal'
import InfoModal from './elements/InfoModal'
import CustomReceiveAmountModal from './elements/CustomReceiveAmountModal'
import OpenSettingsModal from './elements/OpenSettingsModal'
import YesNoModal from './elements/YesNoModal'
import UpdateModal from './elements/UpdateModal'
import NotificationModal from './elements/NotificationModal'
import MarketModal from './elements/MarketModal'
import CreateWalletModal from './elements/CreateWalletModal'


const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

let windowHeight, windowWidth
if (WINDOW_HEIGHT < WINDOW_WIDTH) {
    windowHeight = WINDOW_WIDTH
    windowWidth = WINDOW_HEIGHT
} else {
    windowHeight = WINDOW_HEIGHT
    windowWidth = WINDOW_WIDTH
}


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
                return <YesNoModal show={show} data={data} callback={callback} yesTitle={'walletBackup.skipElement.yes'} noTitle={'walletBackup.skipElement.no'}/>
            case 'CONTINUE_CANCEL_MODAL':
                return <YesNoModal show={show} data={data} callback={callback} yesTitle={'walletBackup.skipElement.continue'} noTitle={'walletBackup.skipElement.cancel'}/>
            case 'CUSTOM_RECEIVE_AMOUNT_MODAL':
                return <CustomReceiveAmountModal show={show} data={data} callback={callback}/>
            case 'MNEMONIC_FAIL_MODAL':
                return <MnemonicFailModal show={show} callback={callback}/>
            case 'SELECT_COIN_MODAL':
                return <SelectCoinModal show={show} callback={callback} data={data}/>
            case 'BACKUP_SKIP_MODAL':
                return <SkipModal show={show} callback={callback}/>
            case 'INFO_MODAL':
                return <InfoModal show={show} data={data} callback={callback}/>
            case 'OPEN_SETTINGS_MODAL':
                return <OpenSettingsModal show={show} data={data} callback={callback}/>
            case 'WALLET_UPDATE':
            case 'UPDATE_MODAL':
                return <UpdateModal show={show} data={data} callback={callback}/>
            case 'NOTIFICATION_MODAL':
                return <NotificationModal show={show} data={data} callback={callback}/>
            case 'MARKET_MODAL':
                return <MarketModal show={show} data={data} callback={callback} />
            case 'WALLET_MODAL':
                return <CreateWalletModal show={show} data={data} callback={callback} />
            default:
                return <View></View>
        }
    }

    render = () => {
        const { show } = this.props.modal

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

        width: windowWidth,
        height: windowHeight
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

export default connect(mapStateToProps)(MainModal)
