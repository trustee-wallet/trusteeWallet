/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    Image,
    Platform,
    Dimensions,
    PixelRatio
} from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'
import Entypo from 'react-native-vector-icons/Entypo'
import moment from 'moment'
import 'moment/min/locales.min'

import IconVisible from '../../../assets/images/icon_visible'
import IconHidden from '../../../assets/images/icon_hidden'
import MenuIcon from '../../../assets/images/menu_icon'
import NotificationIcon from '../../../assets/images/notification_icon'
import QRCodeBtn from '../../../assets/images/qrCodeBtn'
import NavStore from '../../../components/navigation/NavStore'
import ToolTips from '../../../components/elements/ToolTips'
import GradientView from '../../../components/elements/GradientView'
import LetterSpacing from '../../../components/elements/LetterSpacing'

import { setQRConfig, setQRValue } from '../../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { sublocale, strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'

import { capitalize } from '../../../services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '../../../services/UI/Qr/QrPermissions'
import { saveSelectedBasicCurrencyCode } from '../../../appstores/Stores/Main/MainStoreActions'
import WalletName from './WalletName/WalletName'
import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import BlocksoftBN from '../../../../crypto/common/BlocksoftBN'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import { acc } from 'react-native-reanimated'
import BlocksoftCryptoLog from '../../../../crypto/common/BlocksoftCryptoLog'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import DaemonCache from '../../../daemons/DaemonCache'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8 // iphone 5s
}

let CACHE_PREV_CURRENCY = false

class WalletInfo extends Component {

    constructor(props) {
        super(props)
        this.state = {
            opacity: new Animated.Value(1),
            isViolet: false,
        }
    }

    _oneFunction(cryptoCurrencies, selectedBasicCurrency, accountList) {
        //MarketingEvent.setBalance(walletHash, 'TOTAL', totalBalanceString, { totalBalance, totalBalanceString, basicCurrencyCode: selectedBasicCurrency.currencyCode, walletHash })
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        try {
            moment.locale(sublocale())

            AsyncStorage.getItem('isViolet').then(res => {
                let isViolet = res
                isViolet = isViolet !== null ? JSON.parse(isViolet) : false

                this.setState(({
                    isViolet,
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
            await saveSelectedBasicCurrencyCode('USD')
        } else {
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = await settingsActions.getSetting('local_currency_homescreen')
            }
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = 'UAH'
            }
            await saveSelectedBasicCurrencyCode(CACHE_PREV_CURRENCY)
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

    // TODO: gives to the user an oportunity to change block color (long press on block?)
    // toggleViolet = async () => {
    //     await AsyncStorage.setItem('isViolet', JSON.stringify(!this.state.isViolet))

    //     Animated.timing(this.state.opacity, {
    //         toValue: 0,
    //         duration: 300
    //     }).start(() => {
    //         this.setState({ isViolet: !this.state.isViolet }, () => {
    //             Animated.timing(this.state.opacity, {
    //                 toValue: 1,
    //                 duration: 300
    //             }).start()
    //         })
    //     })
    // }

    renderTooltip = () => {
        const { isViolet } = this.state;
        return (
            <View style={[styles.addAsset__content, isViolet && styles.addAsset__content__VIOLET]}>
                <Entypo style={[styles.addAsset__icon, isViolet && styles.addAsset__icon__VIOLET]} size={13} name="plus" />
                <Text style={[styles.addAsset__text, isViolet && styles.addAsset__text__VIOLET]}>
                    {strings('settings.assets.addAsset').toUpperCase()}
                </Text>
                <Image
                    style={[styles.img__hor, styles.img__hor_right]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.right}
                />
                <Image
                    style={[styles.img__hor, styles.img__hor_left]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.left}
                />
                <Image
                    style={[styles.img__ver]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.line}
                />
            </View>
        )
    }

    handlerRBF = async () => {
        showModal({
            type: 'RBF_ACTIVE',
            icon: null,
            title: strings('modal.rbfModal.title'),
            description: strings('modal.rbfModal.description'),
        }, async () => {
            const isActiveRBF = await AsyncStorage.getItem('RBF')
            if (isActiveRBF === null || isActiveRBF.toString() === '0') {
                await AsyncStorage.setItem('RBF', '1')
            } else {
                await AsyncStorage.setItem('RBF', '0')
            }
        })
    }

    render() {
        const {
            changeBalanceVisibility,
            isBalanceVisible,
            selectedBasicCurrency,
            selectedWallet,
        } = this.props
        const { isViolet } = this.state;

        let localCurrencySymbol = selectedBasicCurrency.symbol
        if (!localCurrencySymbol) {
            localCurrencySymbol = selectedBasicCurrency.currencyCode
        }

        const CACHE_SUM = DaemonCache.getCache(selectedWallet.walletHash)

        let totalBalance = 0
        if (CACHE_SUM) {
            totalBalance = CACHE_SUM.balance
            if (localCurrencySymbol !== CACHE_SUM.basicCurrencySymbol) {
                localCurrencySymbol = CACHE_SUM.basicCurrencySymbol
            }
        }

        let tmp = totalBalance.toString().split('.')
        let totalBalancePrep1 = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
        let totalBalancePrep2 = ''
        if (typeof tmp[1] !== 'undefined') {
            totalBalancePrep2 = '.' + tmp[1].substr(0, 2)
        }

        // @misha to optimize
        const date = new Date()
        const todayPrep = `${strings('homeScreen.today')}, ${date.getDate()} ${capitalize(moment(date).format('MMM'))}`

        return (
            <View>
                {/* TODO: moves header from this component */}
                <View style={styles.header}>
                    <View style={styles.header__left}>
                        <TouchableOpacity>
                            <NotificationIcon />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.header__center}>
                        <WalletName
                            walletHash={selectedWallet.walletHash || ''}
                            walletNameText={selectedWallet.walletName || ''} />
                    </View>

                    <View style={styles.header__right}>
                        <TouchableOpacity style={styles.qrButton} onPress={this.handleScanQr}>
                            <QRCodeBtn width={18} height={18} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingsButton} onPress={this.handleOpenSettings}>
                            <MenuIcon />
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.View style={{ opacity: this.state.opacity }}>
                    <View style={styles.container}>
                        <GradientView
                            style={styles.container__bg}
                            array={isViolet ? styles.containerBG__VIOLET.array : styles.containerBG.array}
                            start={isViolet ? styles.containerBG__VIOLET.start : styles.containerBG.start}
                            end={isViolet ? styles.containerBG__VIOLET.end : styles.containerBG.end}
                        >
                            <View style={styles.container__top}>
                                <View style={styles.container__top__left}>
                                    <Text style={[styles.container__title, isViolet && styles.container__title__VIOLET]}>
                                        {strings('homeScreen.balance')}
                                    </Text>
                                    <LetterSpacing
                                        text={todayPrep}
                                        textStyle={Object.assign({}, styles.container__date, isViolet && styles.container__date__VIOLET)}
                                        letterSpacing={1}
                                    />
                                </View>
                                <TouchableOpacity style={styles.addAsset} onPress={() => NavStore.goNext('AddAssetScreen')} onLongPress={() => this.handlerRBF()} delayLongPress={5000}>
                                    <ToolTips type={'HOME_SCREEN_ADD_CRYPTO_BTN_TIP'} height={100} MainComponent={() => this.renderTooltip()} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.walletInfo__content}>
                                <View style={styles.walletInfo__content__balance}>
                                    {
                                        isBalanceVisible ? (
                                            <React.Fragment>
                                                <TouchableOpacity onPress={this.handleChangeLocal}>
                                                    <Text style={[styles.walletInfo__text_small, styles.walletInfo__text_small_first, isViolet && styles.walletInfo__text_small__VIOLET]}>
                                                        {localCurrencySymbol}
                                                    </Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.walletInfo__text_middle, isViolet && styles.walletInfo__text_middle__VIOLET]}>{totalBalancePrep1}</Text>
                                                <Text style={[styles.walletInfo__text_small, isViolet && styles.walletInfo__text_small__VIOLET]}>{totalBalancePrep2}</Text>
                                            </React.Fragment>
                                        ) : (
                                                <Text style={[styles.walletInfo__text_middle, isViolet && styles.walletInfo__text_middle__VIOLET]}>****</Text>
                                            )
                                    }

                                </View>

                                <TouchableOpacity onPress={changeBalanceVisibility}>
                                    {isBalanceVisible ? (
                                        <IconVisible color={isViolet ? '#DADADA' : '#404040'} />
                                    ) : (
                                        <IconHidden color={isViolet ? '#DADADA' : '#404040'} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </GradientView>
                    </View>
                </Animated.View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        selectedBasicCurrency: state.mainStore.selectedBasicCurrency,
        cryptoCurrencies: state.currencyStore.cryptoCurrencies,
        accountList: state.accountStore.accountList
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginHorizontal: SIZE,
        marginTop: Platform.OS === 'android' ? 25 : 0
    },
    header__left: {
        paddingLeft: 12,
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    header__center: {
        flex: 2
    },
    header__right: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
    },
    qrButton: {
        paddingHorizontal: 10
    },
    settingsButton: {
        paddingLeft: 10,
        paddingRight: 12,
    },
    container: {
        marginHorizontal: SIZE,
        marginBottom: 8,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        elevation: 12,

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

        fontFamily: 'Montserrat-Bold',
        color: '#404040',
        fontSize: 14
    },
    container__title__VIOLET: {
        color: '#EEEEEE',
    },
    container__date: {
        marginTop: 2,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#939393'
    },
    container__date__VIOLET: {
        color: '#DCBAFB',
    },
    containerBG: {
        array: ['#fff', '#f2f2f2'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    containerBG__VIOLET: {
        array: ['#9D4AA2', '#43156D'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    walletInfo__title: {
        marginTop: 7,
        color: '#f4f4f4',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold'
    },
    containerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
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
        color: '#404040',

        opacity: .8
    },
    walletInfo__text_small__VIOLET: {
        color: '#F3E6FF',
    },
    walletInfo__text_small_first: {
        marginRight: 5
    },
    walletInfo__text_middle: {
        height: 42,
        fontSize: 52,
        fontFamily: 'Montserrat-Light',
        color: '#404040',
        lineHeight: 50
    },
    walletInfo__text_middle__VIOLET: {
        color: '#F3E6FF',
    },
    img__paths: {
        left: require('../../../assets/images/addAssetborderShadowLeft.png'),
        right: require('../../../assets/images/addAssetborderShadowRight.png'),
        line: require('../../../assets/images/addAssetborderShadowLines.png')
    },
    img__ver: {
        flex: 1,

        position: 'absolute',
        top: -6,
        left: 5,

        width: '103%',
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: 'absolute',
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5
    },
    img__hor_left: {
        left: -5
    },
    addAsset: {
        paddingVertical: 19,
        paddingLeft: 15
    },
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#5C5C5C',
        borderWidth: 1.5
    },
    addAsset__content__VIOLET: {
        borderColor: '#F3E6FF',
    },
    addAsset__text: {
        fontSize: 10,
        color: '#5C5C5C',
        fontFamily: 'Montserrat-Bold'
    },
    addAsset__text__VIOLET: {
        color: '#F3E6FF',
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,

        color: '#5C5C5C'
    },
    addAsset__icon__VIOLET: {
        color: '#F3E6FF',
    },
}
