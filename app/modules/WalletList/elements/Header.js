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

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

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
        const { colors } = this.context

        return (
            <View style={styles.header}>
                <View style={styles.header__left}>
                    <TouchableOpacity style={styles.notificationButton} hitSlop={HIT_SLOP}>
                        <NotificationIcon color={colors.common.text1} />
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
                        <QRCodeBtn
                            width={18}
                            height={18}
                            color={colors.common.text1}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsButton} onPress={this.handleOpenSettings} hitSlop={HIT_SLOP}>
                        <MenuIcon color={colors.common.text1} />
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

WalletInfo.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)


const styles = {
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        paddingHorizontal: SIZE,
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        paddingBottom: 5,
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
