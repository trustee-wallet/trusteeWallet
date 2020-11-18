/**
 * @version 0.10
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    Platform,
    Animated,
    Text
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
import { abs } from 'react-native-reanimated'


const headerHeight = Platform.OS === 'android' ? 79 : 44
const headerHeightSticky = Platform.OS === 'android' ? 123 : 88

class WalletInfo extends React.Component {
    constructor(props) {
        super(props)

        const hasStickyHeader = this.props.scrollOffset > 100
        const opacity = hasStickyHeader ? 1 : 0
        const height = hasStickyHeader ? headerHeightSticky : headerHeight
        const shadowOpacity = hasStickyHeader ? 0.1 : 0
        const elevation = hasStickyHeader ? 10 : 0

        this.state = {
            hasStickyHeader,
            opacity: new Animated.Value(opacity),
            height: new Animated.Value(height),
            shadowOpacity: new Animated.Value(shadowOpacity),
            elevation: new Animated.Value(elevation),
        }
    }

    static getDerivedStateFromProps(nextProps, state) {
        const hasStickyHeader = nextProps.scrollOffset > 100;
        if (!state.hasStickyHeader && hasStickyHeader) {
            Animated.timing(state.height, { toValue: headerHeightSticky, duration: 300 }).start();
            Animated.timing(state.opacity, { toValue: 1, duration: 300 }).start();
            Animated.timing(state.shadowOpacity, { toValue: 0.1, duration: 300 }).start();
            Animated.timing(state.elevation, { toValue: 10, duration: 300 }).start();
        }
        if (state.hasStickyHeader && !hasStickyHeader) {
            Animated.timing(state.height, { toValue: headerHeight, duration: 300 }).start();
            Animated.timing(state.opacity, { toValue: 0, duration: 100 }).start();
            Animated.timing(state.shadowOpacity, { toValue: 0, duration: 300 }).start();
            Animated.timing(state.elevation, { toValue: 0, duration: 300 }).start();
        }
        return {
            ...state,
            hasStickyHeader
        }
    }

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
        const { colors } = this.context
        const {
            selectedWallet,
            changeBalanceVisibility,
            isBalanceVisible,
            balanceData
        } = this.props
        const {
            hasStickyHeader,
            elevation,
            height,
            opacity,
            shadowOpacity,
        } = this.state

        return (
            <View style={styles.wrapper}>
                <Animated.View style={[
                    styles.container,
                    { backgroundColor: colors.common.background, height }
                ]}>

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

                    <Animated.View style={[styles.extraView, { backgroundColor: colors.common.background, opacity }]}>
                        <TouchableOpacity
                            style={styles.balanceText__container}
                            activeOpacity={0.6}
                            onPress={changeBalanceVisibility}
                            hitSlop={{ top: 5, right: 10, bottom: 10, left: 10 }}
                        >
                            {isBalanceVisible ? (
                                <React.Fragment>
                                    <Text style={[styles.balanceText__small, styles.balanceText__currencySymbol, { color: colors.common.text1 }]}>{balanceData.currencySymbol}</Text>
                                    <Text style={[styles.balanceText__middle, { color: colors.common.text1 }]}>{balanceData.beforeDecimal}</Text>
                                    <Text style={[styles.balanceText__small, { color: colors.common.text1 }]}>{balanceData.afterDecimal}</Text>
                                </React.Fragment>
                            ) : (
                                    <Text style={[styles.balanceText__middle, styles.balanceText__hidden, { color: colors.common.text1 }]}>****</Text>
                                )}
                        </TouchableOpacity>
                    </Animated.View>

                </Animated.View>

                <View style={styles.shadow__container}>
                    <Animated.View style={[styles.shadow__item, { shadowOpacity, elevation }]} />
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
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    shadow__container: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        height: 20,
        zIndex: 10,
    },
    shadow__item: {
        flex: 1,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
    },
    container: {
        zIndex: 20,
        paddingTop: Platform.OS === 'android' ? 35 : 0,
    },
    extraView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceText__container: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    balanceText__small: {
        fontSize: 16,
        lineHeight: 27,
        fontFamily: 'Montserrat-SemiBold',
    },
    balanceText__middle: {
        fontSize: 26,
        lineHeight: 26,
        fontFamily: 'Montserrat-SemiBold',
    },
    balanceText__hidden: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 40,
        lineHeight: 50,
    },
    balanceText__currencySymbol: {
        marginRight: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZE,
    },
    header__sticky: {
        elevation: 10,
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
