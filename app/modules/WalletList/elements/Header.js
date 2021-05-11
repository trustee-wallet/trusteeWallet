/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    TouchableOpacity,
    Platform,
    Animated,
    Text,
    StatusBar,
    Vibration,
    SafeAreaView,
    StyleSheet
} from 'react-native'

import WalletName from './WalletName/WalletName'

import NavStore from '@app/components/navigation/NavStore'

import { setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'
import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'

import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'

import { HIT_SLOP } from '@app/themes/HitSlop'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import CustomIcon from '@app/components/elements/CustomIcon'


const headerHeight = 44
const headerHeightSticky = 88

class WalletInfo extends React.Component {
    constructor(props) {
        super(props)

        const hasStickyHeader = this.props.hasStickyHeader
        const opacity = hasStickyHeader ? 1 : 0
        const height = hasStickyHeader ? headerHeightSticky : headerHeight
        const shadowOpacity = hasStickyHeader ? 0.5 : 0
        const elevation = hasStickyHeader ? 15 : 0

        this.state = {
            hasStickyHeader,
            opacity: new Animated.Value(opacity),
            height: new Animated.Value(height),
            shadowOpacity: new Animated.Value(shadowOpacity),
            elevation: new Animated.Value(elevation),
        }
    }

    static getDerivedStateFromProps(nextProps, state) {
        const hasStickyHeader = nextProps.hasStickyHeader;
        if (!state.hasStickyHeader && hasStickyHeader) {
            Animated.parallel([
                Animated.spring(state.height, { toValue: headerHeightSticky, bounciness: 0 }),
                Animated.spring(state.opacity, { toValue: 1, bounciness: 0  }),
                Animated.spring(state.elevation, { toValue: 15, bounciness: 0  }),
                Animated.spring(state.shadowOpacity, { toValue: 0.5, bounciness: 0  })
            ], { stopTogether: false }).start()
        }
        if (state.hasStickyHeader && !hasStickyHeader) {
            Animated.parallel([
                Animated.spring(state.height, { toValue: headerHeight, bounciness: 0  }),
                Animated.spring(state.opacity, { toValue: 0, bounciness: 0  }),
                Animated.spring(state.elevation, { toValue: 0, bounciness: 0  }),
                Animated.spring(state.shadowOpacity, { toValue: 0, bounciness: 0  })
            ], { stopTogether: false }).start()
        }
        return {
            ...state,
            hasStickyHeader
        }
    }

    handleScanQr = () => checkQRPermission(this.qrPermissionCallback)

    handleOpenSettings = () => NavStore.goNext('SettingsMainScreen')

    handleOpenNotifications = () => NavStore.goNext('NotificationsScreen')

    handleClearNotifications = async () => {
        Vibration.vibrate(100)
        await AppNewsActions.markAllAsOpened()
    }

    qrPermissionCallback = () => {
        Log.log('WalletInfo handleScanQr started')

        setQRConfig({
            name: strings('components.elements.input.qrName'),
            successMessage: strings('components.elements.input.qrSuccess'),
            type: 'MAIN_SCANNER'
        })

        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {
        const { colors, GRID_SIZE, isLight } = this.context
        const {
            selectedWallet,
            triggerBalanceVisibility,
            isBalanceVisible,
            originalVisibility,
            balanceData,
            hasNews,
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
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.background }} />

                <Animated.View style={[
                    styles.container,
                    { backgroundColor: colors.common.background, height }
                ]}>

                    <View style={[styles.header, { paddingHorizontal: GRID_SIZE }]}>
                        <View style={styles.header__left}>
                            <TouchableOpacity
                                style={styles.notificationButton}
                                onPress={this.handleOpenNotifications}
                                onLongPress={this.handleClearNotifications}
                                delayLongPress={1000}
                                hitSlop={HIT_SLOP}
                            >
                                <CustomIcon name={'notifications'} color={colors.common.text1} size={20} />
                                {hasNews && <View style={[styles.notificationIndicator, { backgroundColor: colors.notifications.newNotiesIndicator, borderColor: colors.common.background }]} />}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.header__center}>
                            <WalletName
                                walletHash={selectedWallet.walletHash || ''}
                                walletNameText={selectedWallet.walletName || ''}
                            />
                        </View>

                        <View style={styles.header__right}>
                            <TouchableOpacity style={styles.qrButton} onPress={this.handleScanQr}
                                hitSlop={{ top: 15, right: 8, bottom: 15, left: 15 }}>
                                <CustomIcon name={'qr'} color={colors.common.text1} size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsButton} onPress={this.handleOpenSettings}
                                hitSlop={{ top: 15, right: 15, bottom: 15, left: 0 }}>
                                <CustomIcon name={'menu'} color={colors.common.text1} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Animated.View style={[styles.extraView, { backgroundColor: colors.common.background, opacity }]}>
                        <TouchableOpacity
                            style={styles.balanceText__container}
                            activeOpacity={1}
                            onPressIn={() => triggerBalanceVisibility(true)}
                            onPressOut={() => triggerBalanceVisibility(false)}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible? 60 : 30, bottom: 10, left: isBalanceVisible? 60 : 30 }}
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

                {hasStickyHeader && (
                    <View style={[styles.shadow__container, { bottom: Platform.OS === 'ios' ? 15 : 5 }]}>
                        <Animated.View style={[styles.shadow__item, { shadowOpacity, elevation }]} />
                    </View>
                )}

            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        hasNews: state.appNewsStore.hasNews
    }
}

WalletInfo.contextType = ThemeContext

export default connect(mapStateToProps)(WalletInfo)


const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    shadow__container: {
        position: 'absolute',
        bottom: 15,
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
        shadowRadius: 15,
    },
    container: {
        zIndex: 20,
        // paddingTop: Platform.OS === 'android' ? 30 : 0,
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
    notificationIndicator: {
        position: 'absolute',
        top: 0,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
    },
    qrButton: {
        paddingHorizontal: 12
    },
    settingsButton: {
        paddingHorizontal: 12
    },
})
