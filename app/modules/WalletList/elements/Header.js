/**
 * @version 0.10
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    Platform,
} from 'react-native'

import moment from 'moment'
import 'moment/min/locales.min'

import MenuIcon from '../../../assets/images/menu_icon'
import NotificationIcon from '../../../assets/images/notification_icon'
import QRCodeBtn from '../../../assets/images/qrCodeBtn'

import WalletName from './WalletName/WalletName'

import NavStore from '../../../components/navigation/NavStore'

import { setQRConfig, setQRValue } from '../../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'

import { checkQRPermission } from '../../../services/UI/Qr/QrPermissions'

import { HIT_SLOP } from '../../../themes/Themes';

import { SIZE } from '../helpers';


class WalletInfo extends React.Component {
    handleScanQr = () => checkQRPermission(this.qrPermissionCallback)

    handleOpenSettings = () => NavStore.goNext('SettingsScreenStack')

    qrPermissionCallback = () => {
        Log.log('WalletInfo handleScanQr started')

        setQRConfig({
            name: strings('components.elements.input.qrName'),
            successMessage: strings('components.elements.input.qrSuccess'),
            type: 'MAIN_SCANNER'
        })

        setQRValue('')

        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {
        const { selectedWallet } = this.props

        return (
            <View style={styles.header}>
                <View style={styles.header__left}>
                    <TouchableOpacity style={styles.notificationButton} hitSlop={HIT_SLOP}>
                        <NotificationIcon />
                    </TouchableOpacity>
                </View>

                <View style={styles.header__center}>
                    <WalletName
                        walletHash={selectedWallet.walletHash || ''}
                        walletNameText={selectedWallet.walletName || ''}
                    />
                </View>

                <View style={styles.header__right}>
                    <TouchableOpacity style={styles.qrButton} onPress={this.handleScanQr} hitSlop={HIT_SLOP}>
                        <QRCodeBtn width={18} height={18} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsButton} onPress={this.handleOpenSettings} hitSlop={HIT_SLOP}>
                        <MenuIcon />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)


const styles = {
    header: {
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginHorizontal: SIZE,
        marginTop: Platform.OS === 'android' ? 35 : 0
    },
    header__left: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        height: 44, // equal to "WalletName" component height
    },
    header__center: {
        flex: 2,
        alignItems: 'center',
    },
    header__right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
        height: 44, // equal to "WalletName" component height
    },
    notificationButton: {
        paddingHorizontal: 12
    },
    qrButton: {
        paddingHorizontal: 10
    },
    settingsButton: {
        paddingLeft: 10,
        paddingRight: 12,
    },
}
