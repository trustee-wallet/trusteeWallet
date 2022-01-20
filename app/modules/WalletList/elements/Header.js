/**
 * @version 0.44
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Platform,
    Animated,
    Text,
    StatusBar,
    Vibration,
    SafeAreaView,
    StyleSheet
} from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'

import Log from '@app/services/Log/Log'

import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'

import { HIT_SLOP } from '@app/theme/HitSlop'

import { ThemeContext } from '@app/theme/ThemeProvider'
import CustomIcon from '@app/components/elements/CustomIcon'
import WalletName from './WalletName/WalletName'
import { getWalletConnectIsConnected } from '@app/appstores/Stores/WalletConnect/selectors'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'


const headerHeight = 44
const headerHeightSticky = 88

class WalletInfo extends React.PureComponent {
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

    handleWalletConnect = () => NavStore.goNext('WalletConnectScreen')

    handleClearNotifications = async () => {
        Vibration.vibrate(100)
        await AppNewsActions.markAllAsOpened()
    }

    qrPermissionCallback = () => {
        Log.log('WalletInfo handleScanQr started')
        setQRConfig({ flowType: QRCodeScannerFlowTypes.MAIN_SCANNER })
        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {
        const { colors, GRID_SIZE, isLight } = this.context
        const {
            triggerBalanceVisibility,
            isBalanceVisible,
            originalVisibility,
            balanceData,
            walletConnected,
            hasNews
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
                <StatusBar translucent={false} backgroundColor={colors.common.background} barStyle={isLight ? 'dark-content' : 'light-content'} />
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.background }} />

                <Animated.View style={[styles.container, { backgroundColor: colors.common.background, height }]}>
                    <View style={[styles.header, { paddingHorizontal: GRID_SIZE }]}>
                        <View style={styles.header__left}>
                            <TouchableDebounce
                                style={styles.notificationButton}
                                onPress={this.props.handleSortView}
                                hitSlop={HIT_SLOP}
                                onLongPress={this.props.handleSortView}
                                delayLongPress={1000}
                            >
                                <CustomIcon name='constructor' color={colors.common.text1} size={20} />
                            </TouchableDebounce>
                            <TouchableDebounce
                                style={[styles.settingsButton, { marginLeft: -8 }]}
                                onPress={walletConnected ? this.handleWalletConnect : this.handleOpenNotifications}
                                onLongPress={!walletConnected && this.handleClearNotifications}
                                delayLongPress={!walletConnected ? 1000 : 100000000}
                                hitSlop={{ top: 15, right: 15, bottom: 15, left: 0 }}
                            >
                                {walletConnected ?
                                    <CustomIcon name='walletConnect' color={colors.common.text1} size={26} />
                                    :
                                    <>
                                        <CustomIcon name='notifications' color={colors.common.text1} size={20} />
                                        {hasNews && <View style={[styles.notificationIndicator, { backgroundColor: colors.notifications.newNotiesIndicator, borderColor: colors.common.background }]} />}
                                    </>
                                }
                            </TouchableDebounce>
                        </View>

                        <View style={styles.header__center}>
                            <WalletName />
                        </View>

                        <View style={styles.header__right}>
                            <TouchableDebounce style={styles.qrButton} onPress={this.handleScanQr}
                                hitSlop={{ top: 15, right: 8, bottom: 15, left: 15 }}>
                                <CustomIcon name='qr' color={colors.common.text1} size={20} />
                            </TouchableDebounce>

                            <TouchableDebounce style={styles.settingsButton} onPress={this.handleOpenSettings}
                                hitSlop={{ top: 15, right: 15, bottom: 15, left: 0 }}>
                                <CustomIcon name='menu' color={colors.common.text1} size={20} />
                            </TouchableDebounce>
                        </View>
                    </View>

                    <Animated.View style={[styles.extraView, { backgroundColor: colors.common.background, opacity }]}>
                        <TouchableDebounce
                            style={styles.balanceText__container}
                            activeOpacity={1}
                            onPressIn={() => triggerBalanceVisibility(true)}
                            onPressOut={() => triggerBalanceVisibility(false)}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
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
                        </TouchableDebounce>
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
        hasNews: state.appNewsStore.hasNews,
        walletConnected: getWalletConnectIsConnected(state)
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
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
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
    title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 17,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center'
    }
})
