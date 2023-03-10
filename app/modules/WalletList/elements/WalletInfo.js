/**
 * @version 0.50
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    Animated,
    StyleSheet, Linking
} from 'react-native'

import moment from 'moment'

import CustomIcon from '@app/components/elements/CustomIcon'
import NavStore from '@app/components/navigation/NavStore'
import GradientView from '@app/components/elements/GradientView'
import LetterSpacing from '@app/components/elements/LetterSpacing'

import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import currencyBasicActions from '@app/appstores/Stores/CurrencyBasic/CurrencyBasicActions'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings, sublocale } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'

import { HIT_SLOP } from '@app/theme/HitSlop'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { SIZE } from '../helpers'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import { getIsBackedUp, getIsScammed } from '@app/appstores/Stores/Main/selectors'
import InfoNotification from '@app/components/elements/new/InfoNotification'
import { handleBackUpModal } from '@app/modules/Settings/helpers'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'


let CACHE_PREV_CURRENCY = false

class WalletInfo extends React.Component {

    state = {
        opacity: new Animated.Value(1),
        isViolet: false
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        try {
            trusteeAsyncStorage.getIsViolet().then(res => {
                this.setState(({
                    isViolet : res === '1',
                }))
            })

        } catch (e) {
            Log.err('HomeScreen.WalletInfo Unsafe mount error ' + e.message)
        }

    }

    handleChangeLocal = async () => {
        const selectedBasicCurrency = this.props.selectedBasicCurrency
        Log.log('HomeScreen.WalletInfo handleChangeLocal', selectedBasicCurrency)
        if (selectedBasicCurrency.currencyCode !== 'USD') {
            if (CACHE_PREV_CURRENCY !== selectedBasicCurrency.currencyCode) {
                await settingsActions.setSettings('local_currency_homescreen', selectedBasicCurrency.currencyCode)
                CACHE_PREV_CURRENCY = selectedBasicCurrency.currencyCode
            }
            await currencyBasicActions.setSelectedBasicCurrencyCode('USD')
        } else {
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = await settingsActions.getSetting('local_currency_homescreen')
            }
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = 'UAH'
            }
            await currencyBasicActions.setSelectedBasicCurrencyCode(CACHE_PREV_CURRENCY)
        }
        UpdateAccountListDaemon.updateAccountListDaemon({ force: true, source: 'HANDLE_HOMESCREEN' })
    }

    handleScanQr = () => checkQRPermission(this.qrPermissionCallback)

    handleOpenSettings = () => NavStore.goNext('SettingsMainScreen')

    qrPermissionCallback = () => {
        Log.log('WalletInfo handleScanQr started')
        setQRConfig({ flowType: QRCodeScannerFlowTypes.MAIN_SCANNER })
        NavStore.goNext('QRCodeScannerScreen')
    }

    toggleViolet = async () => {
        trusteeAsyncStorage.setIsViolet(this.state.isViolet ? '0' : '1')

        Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: 300
        }).start(() => {
            this.setState({ isViolet: !this.state.isViolet }, () => {
                Animated.timing(this.state.opacity, {
                    toValue: 1,
                    duration: 300
                }).start()
            })
        })
    }

    closeMsg = () => {
        this.setState({ showBackupMsg: !this.state.showBackupMsg })
    }

    handleBackupModal = () => {
        handleBackUpModal(this.props.selectedWalletData)
    }

    handleMoreInfo = () => {
        const sub = sublocale()
        const linkUrl = 'https://blog.trusteeglobal.com/' + sub + '/yak-ne-staty-zhertvoyu-shahrayiv-u-kryptovalyutah/'
        try {
            Linking.openURL(linkUrl)
        } catch (e) {

        }
    }

    render() {
        const {
            changeBalanceVisibility,
            triggerBalanceVisibility,
            isBalanceVisible,
            originalVisibility,
            balanceData,
        } = this.props
        const { isViolet } = this.state
        const { colors, GRID_SIZE } = this.context
        // @misha to optimize
        const date = new Date()
        const todayPrep = `${strings('homeScreen.today')}, ${date.getDate()} ${capitalize(moment(date).format('MMM'))}`

        return (
            <>
                <Animated.View style={{ opacity: this.state.opacity, marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE / 2 }}>
                    <View style={styles.shadow__container}>
                        <View style={styles.shadow__item} />
                    </View>
                    <TouchableDebounce
                        style={styles.container}
                        activeOpacity={1}
                        onLongPress={this.toggleViolet}
                        delayLongPress={5000}
                    >
                        <GradientView
                            style={styles.container__bg}
                            array={isViolet ? colors.homeScreen.listItemVioletGradient : colors.homeScreen.listItemGradient}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.container__top}>
                                <View style={styles.container__top__left}>
                                    <Text style={[
                                        styles.container__title,
                                        { color: isViolet ? colors.homeScreen.text1Violet : colors.common.text1 }
                                    ]}>
                                        {strings('homeScreen.balance')}
                                    </Text>

                                    <LetterSpacing
                                        text={todayPrep}
                                        textStyle={[styles.container__date, { color: isViolet ? colors.homeScreen.dateColorViolet : colors.common.text2 }]}
                                        letterSpacing={1}
                                    />

                                </View>
                                <BorderedButton
                                    text={strings('settings.assets.addAsset')}
                                    icon='plus'
                                    isViolet={isViolet}
                                    containerStyles={styles.button}
                                    onPress={() => NavStore.goNext('AddAssetScreen')}
                                />
                            </View>

                            <View style={styles.walletInfo__content}>
                                <TouchableDebounce
                                    activeOpacity={0.8}
                                    style={styles.walletInfo__content__balance}
                                    onPressIn={() => triggerBalanceVisibility(true)}
                                    onPressOut={() => triggerBalanceVisibility(false)}
                                    disabled={originalVisibility}
                                    hitSlop={{ top: 20, left: 20, right: isBalanceVisible ? 100 : 20, bottom: 20 }}
                                >
                                    {
                                        isBalanceVisible ? (
                                            <React.Fragment>
                                                <TouchableDebounce onPress={this.handleChangeLocal}>
                                                    <Text style={[
                                                        styles.walletInfo__text_small,
                                                        styles.walletInfo__text_small_first,
                                                        { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }
                                                    ]}>
                                                        {balanceData.currencySymbol}
                                                    </Text>
                                                </TouchableDebounce>
                                                <Text style={[styles.walletInfo__text_middle, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }]}>{balanceData.beforeDecimal}</Text>
                                                <Text style={[styles.walletInfo__text_small, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }]}>{balanceData.afterDecimal}</Text>
                                            </React.Fragment>
                                        ) : (
                                            <Text style={[
                                                styles.walletInfo__text_middle,
                                                styles.walletInfo__hiddenBalance,
                                                { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }
                                            ]}>****</Text>
                                        )
                                    }

                                </TouchableDebounce>

                                <TouchableDebounce onPress={changeBalanceVisibility} hitSlop={HIT_SLOP}>
                                    {isBalanceVisible ? (
                                        <CustomIcon name='eye' size={24} color={isViolet ? colors.homeScreen.visibilityIconViolet : colors.common.text1} />
                                    ) : (
                                        <CustomIcon name='eyeClosed' size={24} color={isViolet ? colors.homeScreen.visibilityIconViolet : colors.common.text1} />
                                    )}
                                </TouchableDebounce>
                            </View>
                        </GradientView>
                    </TouchableDebounce>
                </Animated.View>

                {!this.props.walletIsBackedUp ?
                    <View style={{ marginHorizontal: this.props.constructorMode ? 0 : GRID_SIZE }}>
                        <InfoNotification
                            title={strings('settings.walletList.backupNeeded')}
                            subTitle={strings('settings.walletList.backupDescription')}
                            closeCallback={this.closeMsg}
                            onPress={this.handleBackupModal}
                            iconType="warning"
                        />
                    </View> : null
                }

                {this.props.walletIsScammed ?
                    <View style={{ marginHorizontal: this.props.constructorMode ? 0 : GRID_SIZE }}>
                        <InfoNotification
                            title={strings('settings.walletList.scamWallet')}
                            subTitle={strings('settings.walletList.scamWalletDesc')}
                            closeCallback={this.closeMsg}
                            onPress={this.handleMoreInfo}
                            iconType="warning"
                        />
                    </View> : null
                }
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedBasicCurrency: state.mainStore.selectedBasicCurrency,
        cryptoCurrencies: state.currencyStore.cryptoCurrencies,
        accountList: state.accountStore.accountList,
        walletIsBackedUp: getIsBackedUp(state),
        walletIsScammed: getIsScammed(state)
    }
}

WalletInfo.contextType = ThemeContext

export default connect(mapStateToProps)(WalletInfo)


const styles = StyleSheet.create({
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
    shadow__container: {
        position: 'absolute',
        paddingTop: 1,
        paddingBottom: 3,
        paddingRight: 3,
        paddingLeft: 3,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    shadow__item: {
        flex: 1,
        borderRadius: SIZE,
        elevation: 10,

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
        borderRadius: SIZE,
        zIndex: 2
    },
    container__bg: {
        flex: 1,

        paddingHorizontal: SIZE - 1,
        paddingBottom: SIZE - 1,
        borderRadius: SIZE
    },
    container__top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',

        marginBottom: 4
    },
    container__title: {
        marginTop: 14,
        marginLeft: -1,

        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17
    },
    container__date: {
        marginTop: 2,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
    },
    walletInfo__content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    walletInfo__content__balance: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    walletInfo__text_small: {
        fontSize: 20,
        fontFamily: 'Montserrat-Medium',

        opacity: .8
    },
    walletInfo__text_small_first: {
        marginRight: 5
    },
    walletInfo__text_middle: {
        height: 42,
        fontSize: 52,
        fontFamily: 'Montserrat-Light',
        lineHeight: 50
    },
    walletInfo__hiddenBalance: {
        lineHeight: 58
    },
    button: {
        marginVertical: 19,
        marginLeft: 15
    }
})
