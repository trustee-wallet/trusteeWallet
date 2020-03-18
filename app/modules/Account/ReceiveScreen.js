import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform
} from 'react-native'

import firebase from 'react-native-firebase'
import QRCode from 'react-native-qrcode-svg'
import Share from 'react-native-share'

import Fontisto from 'react-native-vector-icons/Fontisto'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'

import Toast from '../../services/Toast/Toast'
import i18n, { strings } from '../../services/i18n'
import FileSystem from "../../services/FileSystem"
import { copyToClipboard } from '../../services/utils'
import { showModal } from '../../appstores/Actions/ModalActions'
import { setLoaderStatus, setSelectedAccount, setSelectedAccountAsUsed, setSelectedSegwitOrNot } from '../../appstores/Actions/MainStoreActions'
import Netinfo from '../../services/Netinfo/Netinfo'
import Log from '../../services/Log/Log'
import ExchangeActions from '../../appstores/Actions/ExchangeActions'

import Theme from '../../themes/Themes'
import LetterSpacing from '../../components/elements/LetterSpacing'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LightButton from '../../components/elements/LightButton'
import CustomIcon from '../../components/elements/CustomIcon'
import qrLogo from '../../assets/images/logoWithWhiteBG.png'
import settingsActions from '../../appstores/Actions/SettingsActions'
let styles


class ReceiveScreen extends Component {

    constructor(){
        super()
        this.state = {
            isSegWitLegacy: false,
            settingAddressType: ""
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().receiveScreenStyles

        const account = this.props.account
        settingsActions.getSetting('btc_legacy_or_segwit').then(res => this.setState({ settingAddressType: res }))

        this.setState({
            isSegWitLegacy: typeof account.addressType !== "undefined"
        })
    }

    copyToClip = () => {
        const { address } = this.props.account

        copyToClipboard(address)

        Toast.setMessage(strings('toast.copied')).show()
    }

    getAddressForQR = () => {
        const { address, currency_code : currencyCode } = this.props.account

        switch (currencyCode) {
            case 'LTC':
                return 'litecoin:' + address
            case 'BTC':
                return 'bitcoin:' + address
            case 'BCH':
                return 'bitcoincash:' + address
            case 'BTG':
                return 'bitcoingold:' + address
            case 'ETH':
                return 'ethereum:' + address
            default:
                return address
        }

    }

    proceedAction = async (ways, wayType, callback) => {
        const { currencyCode, currencySymbol, network } = this.props.currency

        try {
            if(network === 'testnet' || network === 'ropsten'){
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.infoBuyModal.notAvailable'),
                })
                return
            }

            await Netinfo.isInternetReachable(-120)

            const isExist = ways.find(item => item.outCurrencyCode === currencyCode && item.exchangeWayType === wayType)

            if(typeof isExist !== 'undefined'){
                callback()
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.infoBuyModal.currencyNotAvailable', { currencySymbol }),
                })
            }

            setLoaderStatus(false)

        } catch (e) {
            console.log(e)
            Log.err('ReceiveScreen/handleBut error', e.message)
        }

        setLoaderStatus(false)
    }

    handleBuy = () => {
        const { exchangeStore } = this.props

        this.proceedAction(exchangeStore.tradeApiConfig.exchangeWays, "BUY", () => {

            ExchangeActions.handleSetTradeType({ tradeType: 'BUY' })

            NavStore.goNext('TradeScreenStack', {
                exchangeScreenParam: {
                    selectedCryptocurrency: this.props.currency
                }
            })
        })
    }

    handleExchange = () => {
        setLoaderStatus(true)

        const code = this.props.currency.currencyCode === "ETH_USDT" ? "USDTERC20" : this.props.currency.currencySymbol

        NavStore.goNext("ExchangeScreenStack",
        {
            exchangeMainDataScreenParam: {
                url: `https://changenow.io/${i18n.locale.split("-")[0]}/exchange?amount=1&from=${code}&link_id=35bd08f188a35c&to=eth`,
                type: "CREATE_NEW_ORDER"
            }
        })
    }

    handleCustomReceiveAmount = () => {

        const { currencyCode, currencySymbol } = this.props.currency
        const { address } = this.props.account

        const ifExist = currencyCode === 'ETH' || currencyCode === 'BTC'

        if(ifExist){
            showModal({
                type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
                data: {
                    title: strings('account.receiveScreen.receiveAmount'),
                    address,
                    currencySymbol,
                    currencyCode
                }
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.settings.soon'),
                description: strings('modal.settings.soonDescription')
            })
        }
    }

    shareAddress = () => {
        const { address } = this.props.account

        try {
            this.refSvg.toDataURL( async (data) => {

                if(Platform.OS === "android"){
                    Share.open({ message: address, url: `data:image/png;base64,${data}` })
                } else {

                    const fs = new FileSystem()

                    await (fs.setFileEncoding("base64").setFileName("QR").setFileExtension("jpg")).writeFile(data)

                    Share.open({ message: address, url: await fs.getPathOrBase64() })
                }
            })
        } catch (e) {
            showModal({
                type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
                data: {
                    title: JSON.stringify(e)
                }
            })
        }
    }

    renderAccountDetail = () => {

        const { currencyBalanceAmount, currencySymbol, currencyName, currencyCode } = this.props.currency

        return (
            <View style={styles.accountDetail}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View>
                        <CurrencyIcon currencyCode={currencyCode}
                                      containerStyle={{  }} />
                    </View>
                    <View style={styles.accountDetail__content}>
                        <View style={{ paddingRight: 180 }}>
                            <Text style={styles.accountDetail__title} numberOfLines={1}>
                                { currencyName }
                            </Text>
                            <View style={{ alignItems: "flex-start" }}>
                                <LetterSpacing text={((+currencyBalanceAmount).toFixed(5)).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1').toString().split('').join('\u200A'.repeat(1)) + ' ' + currencySymbol} textStyle={styles.accountDetail__text} letterSpacing={.5} />
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={{ padding: 10, paddingRight: 31, justifyContent: "center", marginLeft: "auto" }} onPress={this.copyToClip}>
                        <LightButton Icon={(props) => <MaterialIcons color="#864DD9" size={10} name={"content-copy"} { ...props } /> } iconStyle={{ marginHorizontal: 3 }} title={strings('account.receiveScreen.copy')} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    changeAddressType = async () => {
        const setting = await setSelectedSegwitOrNot()
        await setSelectedAccount(setting)
    }

    renderSegWitLegacy = (isSegWitLegacy, addressType) => {

        if(isSegWitLegacy){
            return (
                <View style={styles.qr__content__top}>
                    <TouchableOpacity style={styles.qr__content__top__item}
                                      onPress={this.changeAddressType}
                                      disabled={addressType.toLowerCase() === "segwit"}>
                        <Text style={[styles.qr__content__top__item__text, addressType.toLowerCase() === "segwit" ? styles.qr__content__top__item__text_active : null]}>
                            SegWit
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qr__content__top__item}
                                      onPress={this.changeAddressType}
                                      disabled={addressType.toLowerCase() === "legacy"}>
                        <Text style={[styles.qr__content__top__item__text, addressType.toLowerCase() === "legacy" ? styles.qr__content__top__item__text_active : null]}>
                            Legacy
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else {
            return (
                <View />
            )
        }
    }

    changeAddress = async () => {
        const { address } = this.props.account
        const res = await setSelectedAccountAsUsed(address)
        if (res) {
            // @todo show alert and maybe button "use again addresses without txs"
        }
    }

    render(){

        const { mainStore } = this.props
        const { isSegWitLegacy, settingAddressType } = this.state
        const { address, addressType } = this.props.account
        const { currencySymbol, currencyCode } = this.props.currency

        firebase.analytics().setCurrentScreen('Account.ReceiveScreen')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={ strings('account.receiveScreen.title', { receive: strings('repeat.receive') + ' ' + currencySymbol }) }
                    CustomComponent={this.renderAccountDetail}
                />
                <ScrollView>
                    <View style={styles.wrapper__content}>
                        <View style={styles.qr}>
                            <GradientView style={[styles.qr__content, !isSegWitLegacy ? { paddingTop: 20 } : null]}  array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                { this.renderSegWitLegacy(isSegWitLegacy, addressType, settingAddressType) }
                                <TouchableOpacity style={{ position: "relative", paddingHorizontal: 20, alignItems: currencyCode === "BTC" && mainStore.selectedWallet.wallet_is_hd ? "flex-start" : "center" }} onPress={() => this.copyToClip()}>
                                    <QRCode
                                        getRef={ref => this.refSvg = ref}
                                        value={this.getAddressForQR()}
                                        size={230}
                                        color='#404040'
                                        logo={qrLogo}
                                        logoSize={70}
                                        logoBackgroundColor='transparent'/>
                                    <View style={{ width: 200, marginTop: 20 }}>
                                        <LetterSpacing text={address} numberOfLines={2} containerStyle={{ flexWrap: "wrap", justifyContent: currencyCode === "BTC" && mainStore.selectedWallet.wallet_is_hd ? "flex-start" : "center" }} textStyle={{...styles.accountDetail__text, textAlign: "center"}} letterSpacing={1} />
                                    </View>
                                    {
                                        currencyCode === "BTC" && mainStore.selectedWallet.wallet_is_hd ?
                                            <TouchableOpacity onPress={this.changeAddress} style={{ position: "absolute", bottom: -7, right: 10, padding: 10 }}>
                                                <FontAwesome color="#864DD9" size={20} name={"refresh"} />
                                            </TouchableOpacity> : null
                                    }
                                </TouchableOpacity>
                                <View style={styles.line}>
                                    <View style={styles.line__item} />
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <TouchableOpacity style={{ padding: 14, justifyContent: "center" }} onPress={this.handleCustomReceiveAmount}>
                                        <LightButton Icon={(props) => <Feather color="#864DD9" size={10} name={"edit"} { ...props } /> } title={strings('account.receiveScreen.receiveAmount')} iconStyle={{ marginHorizontal: 3 }}  />
                                    </TouchableOpacity>
                                </View>
                            </GradientView>
                            <View style={styles.qr__shadow}>
                                <View style={[styles.qr__shadow__item, isSegWitLegacy ? { height: Platform.OS === "android" ? 405 : 395 } : null]} />
                            </View>
                        </View>
                        <View style={styles.options}>
                            <TouchableOpacity style={styles.options__item} onPress={this.handleBuy}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <View>
                                            <Fontisto style={{ fontSize: 23, color: "#864DD9" }} name={'shopping-basket-add'}/>
                                        </View>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item} />
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('exchange.buy')} textStyle={styles.options__text} letterSpacing={.7} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.options__item} onPress={this.handleExchange}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <CustomIcon name="exchange" style={{ color: '#864DD9', fontSize: 24 }}/>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item} />
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('dashboardStack.exchange')} textStyle={styles.options__text} letterSpacing={.7} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.options__item} onPress={this.shareAddress}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <View style={{ marginRight: 3 }}>
                                            <Fontisto color={"#864DD9"} size={23} name={"share"} />
                                        </View>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item} />
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('account.receiveScreen.share')} textStyle={styles.options__text} letterSpacing={.7} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        currency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReceiveScreen)

const styles_ = {
    array: ["#f5f5f5","#f5f5f5"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
