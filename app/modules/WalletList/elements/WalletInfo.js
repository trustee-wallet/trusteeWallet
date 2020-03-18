import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    Image,
    Switch,
    Platform
} from 'react-native'

import AsyncStorage from "@react-native-community/async-storage"

import Entypo from "react-native-vector-icons/Entypo"
import Fontisto from "react-native-vector-icons/Fontisto"

import moment from "moment"
import "moment/min/locales.min"

import NavStore from '../../../components/navigation/NavStore'
import ToolTips from '../../../components/elements/ToolTips'

import { setQRConfig, setQRValue } from '../../../appstores/Actions/QRCodeScannerActions'
import i18n, { strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'
import { capitalize } from '../../../services/utils'
import { checkQRPermission } from '../../../services/Qr/QrPermissions'
import GradientView from '../../../components/elements/GradientView'

import QRCodeBtn from "../../../assets/images/qrCodeBtn"

import LetterSpacing from '../../../components/elements/LetterSpacing'

import currencyDS from "../../../appstores/DataSource/Currency/Currency"


class WalletInfo extends Component {

    constructor(props) {
        super(props)
        this.state = {
            totalBalance: '0.0',
            balanceChange: '0',
            minus: 0,
            progress: new Animated.Value(0),
            opacity: new Animated.Value(1),
            isViolet: false,
            iconName: '',
            styles
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        try {
            moment.locale(i18n.locale.split("-")[0])

            AsyncStorage.getItem("isViolet").then(res => {
                let isViolet = res
                isViolet = isViolet !== null ? JSON.parse(isViolet) : false

                this.setState(({
                    isViolet,
                    styles: isViolet ? stylesViolet : styles
                }))
            })

            const { currencies } = this.props.main
            const tmpCurrencies = currencies.filter(item => item.is_hidden == 0 )
            const balanceHistory = await currencyDS.getHistory()

            let walletHash = this.props.main.selectedWallet.wallet_hash
            let totalBalance = 0
            let balanceHistoryTotalBalance = 0
            let totalBalanceString = ''

            for (let i = 0, ic = tmpCurrencies.length; i < ic; i++) {
                const item = tmpCurrencies[i]
                if (item.currencyCode === 'BTC') {
                    walletHash = item.walletHash
                }
                totalBalance += item.currencyBalanceAmount * item.currency_rate_usd
                balanceHistoryTotalBalance += typeof balanceHistory[item.currencyCode] != "undefined" ? item.currencyBalanceAmount * balanceHistory[item.currencyCode] : 0
                totalBalanceString += item.currencyBalanceAmount + ' ' + item.currencyCode + ', '
            }

            totalBalance += ''
            MarketingEvent.setBalance(walletHash, 'TOTAL', totalBalanceString, { totalBalance, totalBalanceString, walletHash })

            let balanceChange = totalBalance - balanceHistoryTotalBalance
            balanceChange = Math.abs((balanceChange * 100) / totalBalance)
            balanceChange = totalBalance > balanceHistoryTotalBalance ? "+ " :  "- " + balanceChange.toFixed(3).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1') + "%"
            balanceChange = balanceHistoryTotalBalance == 0 ? "0" + "%" : balanceChange

            const iconName = balanceHistoryTotalBalance == 0 ? "" : totalBalance > balanceHistoryTotalBalance ? "arrow-up-right" : "arrow-down-left"

            this.setState({
                iconName,
                balanceChange,
                totalBalance,
            })
        } catch (e) {
            console.log(e)
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillReceiveProps(nextProps) {

        try {
            const { currencies } = nextProps.main

            const tmpCurrencies = currencies.filter(item => item.is_hidden == 0 )
            const balanceHistory = await currencyDS.getHistory()

            let walletHash = nextProps.main.selectedWallet.wallet_hash
            let totalBalance = 0
            let balanceHistoryTotalBalance = 0
            let totalBalanceString = ''
            for (let i = 0, ic = tmpCurrencies.length; i < ic; i++) {
                const item = tmpCurrencies[i]
                if (item.currencyCode === 'BTC') {
                    walletHash = item.walletHash
                }
                totalBalance += item.currencyBalanceAmount * item.currency_rate_usd
                balanceHistoryTotalBalance += typeof balanceHistory[item.currencyCode] != "undefined" ? item.currencyBalanceAmount * balanceHistory[item.currencyCode] : 0
                totalBalanceString += item.currencyBalanceAmount + ' ' + item.currencyCode + ', '
            }

            totalBalance += ''
            MarketingEvent.setBalance(walletHash, 'TOTAL', totalBalanceString, { totalBalance, totalBalanceString, walletHash })

            let balanceChange = totalBalance - balanceHistoryTotalBalance
            balanceChange = Math.abs((balanceChange * 100) / totalBalance)
            balanceChange = totalBalance > balanceHistoryTotalBalance ? "+ " : "- " + balanceChange.toFixed(3).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1') + "%"
            balanceChange = balanceHistoryTotalBalance == 0 ? '0' + "%" : balanceChange

            const iconName = balanceHistoryTotalBalance == 0 ? "" : totalBalance > balanceHistoryTotalBalance ? "arrow-up-right" : "arrow-down-left"

            this.setState({
                iconName,
                balanceChange,
                totalBalance
            })

            this.handleStartAnimation(nextProps)
        } catch (e) {
            console.log(e)
        }
    }

    handleStartAnimation = (nextProps) => {

        const { updated: oldUpdate } = this.props.daemonStore.accountBalanceDaemonData

        const { updated: newUpdate } = nextProps.daemonStore.accountBalanceDaemonData

        if(oldUpdate && newUpdate > oldUpdate){
            Animated.loop(
                Animated.sequence([
                    Animated.timing(this.state.progress, {
                        toValue: 1,
                        duration: 5000
                    }),
                    Animated.timing(this.state.progress, {
                        toValue: 0,
                        duration: 5000
                    })
                ]),
                {
                    iterations: 1
                }
            ).start()
        }

    }

    handleScanQr = () => checkQRPermission(this.qrPermissionCallback)

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

    toggleViolet = async () => {

        await AsyncStorage.setItem("isViolet", JSON.stringify(!this.state.isViolet))

        Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: 300
        }).start(() => {
            this.setState({
                isViolet: !this.state.isViolet,
                styles: !this.state.isViolet ? stylesViolet : styles
            }, () => {
                Animated.timing(this.state.opacity, {
                    toValue: 1,
                    duration: 300
                }).start()
            })
        })
    }

    renderTooltip = ({ styles }) => {
        return (
            <View style={styles.addAsset__content}>
                <Entypo style={styles.addAsset__icon} size={13} name="plus" />
                <Text style={styles.addAsset__text}>
                    { strings('settings.assets.addAsset') }
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

    render() {
        const { selectedWallet } = this.props.main
        const { localCurrencySymbol } = this.props.fiatRatesStore
        let { styles, totalBalance } = this.state

        totalBalance = FiatRatesActions.toLocalCurrency(totalBalance)
        totalBalance = totalBalance.toString()

        const date = new Date()

        // const changedLastDay = `${balanceChange} ${strings('homeScreen.changedLastDay')}`

        return (
            <View style={{...styles.wrapper}}>
                <View style={styles.top}>
                    <View style={{ width: 48, height: 25 }}>
                        {
                            Platform.OS === 'android' ?
                                <Switch
                                    thumbColor="#fff"
                                    trackColor={{true: '#864DD9', false: '#dadada'}}
                                    onValueChange = {this.toggleViolet}
                                    value = {this.state.isViolet}/>
                                    :
                                <Switch
                                    trackColor={{true: '#864DD9'}}
                                    style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                    onValueChange = {this.toggleViolet}
                                    value = {this.state.isViolet}/>
                        }
                    </View>
                    <View>
                        <LetterSpacing text={selectedWallet.wallet_name.length > 20 ? selectedWallet.wallet_name.slice(0, 8) + "..." : selectedWallet.wallet_name} textStyle={styles.top__title} letterSpacing={0.5} />
                    </View>
                    <TouchableOpacity style={styles.qr} onPress={this.handleScanQr}>
                        <QRCodeBtn width={18} height={18} />
                    </TouchableOpacity>
                </View>
                <Animated.View style={{ position: 'relative', width: '100%', paddingBottom: 20, opacity: this.state.opacity }}>
                    <View style={styles.container}>
                        <GradientView style={styles.container__bg} array={styles.containerBG.array} start={styles.containerBG.start} end={styles.containerBG.end}>
                            <View style={styles.container__top}>
                                <View style={styles.container__top__left}>
                                    <Text style={styles.container__title}>
                                        { strings('homeScreen.balance') }
                                    </Text>
                                    <Text style={styles.container__date}>
                                        { `${strings('homeScreen.today')}, ${new Date().getDate()} ${capitalize(moment(date).format('MMM'))}`.split('').join('\u200A'.repeat(2)) }
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.addAsset} onPress={() => NavStore.goNext('AddAssetScreen')}>
                                    <ToolTips type={'HOME_SCREEN_ADD_CRYPTO_BTN_TIP'} height={100} MainComponent={this.renderTooltip} mainComponentProps={{ styles }} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.walletInfo__content}>
                                <Text style={{...styles.walletInfo__text_small, ...styles.walletInfo__text_small_first}}>{ localCurrencySymbol } </Text>
                                <Text style={styles.walletInfo__text_middle}>{typeof totalBalance.split('.')[1] != 'undefined' ? totalBalance.split('.')[0] : totalBalance.split('.')[0]}</Text>
                                <Text style={styles.walletInfo__text_small}>{typeof totalBalance.split('.')[1] != 'undefined' ? '.' + totalBalance.split('.')[1].substr(0, 5) : ''}</Text>
                                {/* <Feather name={iconName} style={styles.walletInfo__icon} /> */}
                            </View>
                            <View style={styles.container__text}>
                                {/* <LetterSpacing text={changedLastDay} textStyle={styles.container__text} letterSpacing={1} /> */}
                            </View>
                        </GradientView>
                         {
                            // this.props.isSnow ?
                            //     <TouchableOpacity style={{ position: "absolute", bottom: 0, right: 0, padding: 16 }} onPress={this.props.toggleSnow}>
                            //         <Fontisto style={styles.snowBtn__icon} name="snowflake-8" size={20} />
                            //     </TouchableOpacity> : null
                         }

                    </View>
                    <View style={styles.shadow}>
                        <View style={styles.shadow__item} />
                    </View>
                </Animated.View>

                    {/* <View style={styles.container}> */}
                    {/*    <View style={styles.top}> */}
                    {/*        <Text style={styles.walletInfo__title}> */}
                    {/*            { selectedWallet.wallet_name } */}
                    {/*        </Text> */}
                    {/*    </View> */}

                    {/*    { */}
                    {/*        /**/}
                    {/*            <View style={{...styles.containerRow, marginTop: -20}}> */}
                    {/*                <Text style={styles.bottomText}>- $ { +this.state.minus } ({ ((this.state.minus * 100) / totalBalance).toFixed(3) }%)</Text> */}
                    {/*                <View style={styles.iconArrow}> */}
                    {/*                    <Icon name="ios-arrow-round-down" size={18} color="#fc5088" /> */}
                    {/*                </View> */}
                    {/*            </View> */}
                    {/*        */}
                    {/*    } */}

            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore,
        daemonStore: state.daemonStore,
        account: state.mainStore.selectedAccount,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)


const styles = {
    wrapper: {
        position: 'relative',
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginHorizontal: 16,
        marginTop: Platform.OS === 'android' ? 35 : 0
    },
    top__title: {
        fontFamily: "Montserrat-Bold",
        color: "#404040",
        fontSize: 12
    },
    qr:{
        paddingVertical: 13,
        paddingHorizontal: 15
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 127,

        zIndex: 1
    },
    shadow__item: {

        marginHorizontal: 22,
        marginTop: 18,
        height: 122,

        backgroundColor: "#fff",

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10,
    },
    container: {
        position: 'relative',

        height: 140,
        marginHorizontal: 16,

        // shadowOffset: {
        //     width: 0,
        //     height: 1
        // },
        // shadowOpacity: 0.22,
        // shadowRadius: 2.22,
        //
        // elevation: 3,

        backgroundColor: "#fff",

        borderRadius: 16,

        zIndex: 2
    },
    container__bg: {
        flex: 1,

        paddingLeft: 15,
        paddingBottom: 15,
        borderRadius: 16,
    },
    container__top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",

        marginBottom: 4,
    },
    container__title: {
        marginTop: 14,
        marginLeft: -1,

        fontFamily: "Montserrat-Bold",
        color: "#404040",
        fontSize: 14
    },
    container__text: {
        color: "#939393",
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 8
    },
    container__date: {
        marginTop: 2,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
        color: "#939393"
    },
    containerBG: {
        array: ['#fff', '#f2f2f2'],
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
        marginBottom: 8,

        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    walletInfo__text_small: {
        // height: 22,
        fontSize: 20,
        fontFamily: "Montserrat-Medium",
        color: '#404040',
        // lineHeight: 25,

        opacity: .8
    },
    walletInfo__text_small_first: {
        marginRight: 5,
    },
    walletInfo__text_middle: {
        height: 42,
        fontSize: 52,
        fontFamily: "Montserrat-Light",
        color: '#404040',
        lineHeight: 50
    },
    walletInfo__icon: {
        marginLeft: 3,
        marginBottom: Platform.OS === "ios" ? -4.5 : -2,
        color: "#939393",
        fontSize: 28
    },
    img__paths: {
        left: require('../../../assets/images/addAssetborderShadowLeft.png'),
        right: require('../../../assets/images/addAssetborderShadowRight.png'),
        line: require('../../../assets/images/addAssetborderShadowLines.png')
    },
    img__ver: {
        flex: 1,

        position: "absolute",
        top: -6,
        left: 5,

        width: "103%",
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: "absolute",
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5,
    },
    img__hor_left: {
        left: -5,
    },
    addAsset: {
        paddingVertical: 19,
        paddingHorizontal: 15,
    },
    addAsset__content: {
        position: "relative",

        flexDirection: "row",
        alignItems: "center",

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#864DD9',
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        color: '#864DD9',
        fontFamily: "Montserrat-Bold",
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,

        color: '#864DD9'
    },
    snowBtn__icon: {
        color: "#864DD9"
    }
}

const stylesViolet = {
    wrapper: {
        position: 'relative',
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginHorizontal: 16,
        marginTop: Platform.OS === 'android' ? 35 : 0
    },
    top__title: {
        fontFamily: "Montserrat-Bold",
        color: "#404040",
        fontSize: 12
    },
    qr:{
        paddingVertical: 13,
        paddingHorizontal: 15
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 127,

        zIndex: 1
    },
    shadow__item: {

        marginHorizontal: 22,
        marginTop: 18,
        height: 122,

        backgroundColor: "#fff",

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10,
    },
    container: {
        position: 'relative',

        height: 140,
        marginHorizontal: 16,

        // shadowOffset: {
        //     width: 0,
        //     height: 1
        // },
        // shadowOpacity: 0.22,
        // shadowRadius: 2.22,
        //
        // elevation: 3,

        backgroundColor: "#fff",

        borderRadius: 16,

        zIndex: 2
    },
    container__bg: {
        flex: 1,

        paddingLeft: 15,
        paddingBottom: 15,
        borderRadius: 16,
    },
    container__top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",

        marginBottom: 4,
    },
    container__title: {
        marginTop: 14,
        marginLeft: -1,

        fontFamily: "Montserrat-Bold",
        color: "#fff",
        fontSize: 14
    },
    container__text: {
        color: "#DCBAFB",
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 8
    },
    container__date: {
        marginTop: 2,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
        color: "#DCBAFB"
    },
    containerBG: {
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
        marginBottom: 8,

        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    walletInfo__text_small: {
        // height: 22,
        fontSize: 20,
        fontFamily: "Montserrat-Medium",
        color: '#F3E6FF',
        // lineHeight: 25,

        opacity: .8
    },
    walletInfo__text_small_first: {
        marginRight: 5,
    },
    walletInfo__text_middle: {
        height: 42,
        fontSize: 52,
        fontFamily: "Montserrat-Light",
        color: '#fff',
        lineHeight: 50
    },
    walletInfo__icon: {
        marginLeft: 3,
        marginBottom: Platform.OS === "ios" ? -4.5 : -2,
        color: "#DCBAFB",
        fontSize: 28
    },
    img__paths: {
        left: require('../../../assets/images/addAssetBorderShadowLeftLight.png'),
        right: require('../../../assets/images/addAssetBorderShadowRightLight.png'),
        line: require('../../../assets/images/addAssetBorderShadowLinesLight.png')
    },
    img__ver: {
        flex: 1,

        position: "absolute",
        top: -6,
        left: 4,

        width: "105%",
        height: 38,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: "absolute",
        top: -6,

        width: 10,
        height: 38,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5,
    },
    img__hor_left: {
        left: -5,
    },
    addAsset: {
        paddingVertical: 19,
        paddingHorizontal: 15,
    },
    addAsset__content: {
        position: "relative",

        flexDirection: "row",
        alignItems: "center",

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#F3E6FF',
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        color: '#F3E6FF',
        fontFamily: "Montserrat-Bold",
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,

        color: '#F3E6FF'
    },
    snowBtn__icon: {
        color: "#F3E6FF"
    }
}
