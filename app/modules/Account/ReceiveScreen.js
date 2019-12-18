import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform
} from 'react-native'

import QRCode from 'react-native-qrcode-svg'
import Share from 'react-native-share'

import Fontisto from 'react-native-vector-icons/Fontisto'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Feather from 'react-native-vector-icons/Feather'

import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'
import ButtonLine from '../../components/elements/ButtonLine'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'

import Toast from '../../services/Toast/Toast'
import { strings } from '../../services/i18n'
import { copyToClipboard } from '../../services/utils'
import { showModal } from '../../appstores/Actions/ModalActions'
import api from '../../services/api'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import Netinfo from '../../services/Netinfo/Netinfo'
import Log from '../../services/Log/Log'
import ExchangeActions from '../../appstores/Actions/ExchangeActions'
import firebase from 'react-native-firebase'

import Theme from '../../themes/Themes'
import LetterSpacing from '../../components/elements/LetterSpacing'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LightButton from '../../components/elements/LightButton'
import CustomIcon from '../../components/elements/CustomIcon'
let styles


class ReceiveScreen extends Component {

    constructor(){
        super()
        this.state = {}
    }

    componentWillMount() {
        styles = Theme.getStyles().receiveScreenStyles
    }

    copyToClip = () => {
        const { address } = this.props.account

        copyToClipboard(address)

        Toast.setMessage(strings('toast.copied')).show()
    }

    getAddressForQR = () => {
        const { address, currency_code } = this.props.account

        switch (currency_code) {
            case 'LTC':
                return 'litecoin:' + address
            case 'BTC':
                return 'bitcoin:' + address
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

            if(typeof isExist != 'undefined'){
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
        const { exchangeStore } = this.props

        this.proceedAction(exchangeStore.exchangeApiConfig, "EXCHANGE", () => {

            NavStore.goNext('ExchangeScreenStack', {
                exchangeScreenParam: {
                    selectedCryptocurrency: this.props.currency
                }
            })
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

        Share.open({ url: address })
            .then((res) => { console.log(res) })
            .catch((err) => { err && console.log(err) })
    }

    renderAccountDetail = () => {

        const { currencyBalanceAmount, currencySymbol, currencyName, currencyCode } = this.props.currency
        const { address } = this.props.account

        return (
            <View style={styles.accountDetail}>
                <View style={{ flexDirection: "row" }}>
                    <View style={{ marginTop: 15 }}>
                        <CurrencyIcon currencyCode={currencyCode}
                                      containerStyle={{  }} />
                    </View>
                    <View style={styles.accountDetail__content}>
                        <View>
                            <Text style={styles.accountDetail__title}>
                                { currencyName }
                            </Text>
                            <View style={{ alignItems: "flex-start" }}>
                                <LetterSpacing text={currencyBalanceAmount + ' ' + currencySymbol} textStyle={styles.accountDetail__text} letterSpacing={.5} />
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={{ paddingTop: 16, paddingRight: 31, paddingLeft: 10, paddingBottom: 20, justifyContent: "center", marginLeft: "auto" }} onPress={this.copyToClip}>
                        <LightButton Icon={(props) => <MaterialIcons color="#864DD9" size={10} name={"content-copy"} { ...props } /> } iconStyle={{ marginHorizontal: 3 }} title={strings('account.receiveScreen.copy')} />
                    </TouchableOpacity>
                </View>
                <View style={{flex: 1, paddingLeft: 66, paddingRight: 30}}>
                    <LetterSpacing text={address} containerStyle={{ flexWrap: "wrap", justifyContent: "flex-start", flex: 1 }} textStyle={{...styles.accountDetail__text, marginTop: Platform.OS === "android" ? -3 : 0, marginBottom: 0}} letterSpacing={1} />
                </View>
            </View>
        )
    }

    render(){

        const { address } = this.props.account
        const { currencyName, currencySymbol } = this.props.currency

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
                            <GradientView style={styles.qr__content}  array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                <TouchableOpacity style={{ alignItems: "center" }} onPress={() => this.copyToClip()}>
                                    <QRCode
                                        value={this.getAddressForQR()}
                                        size={230}
                                        color='#404040'
                                        logoBackgroundColor='transparent'/>
                                    {/*<Text style={{*/}
                                    {/*    marginTop: 10,*/}
                                    {/*    color: '#999999',*/}
                                    {/*    fontSize: 14,*/}
                                    {/*    fontFamily: 'SFUIDisplay-Regular',*/}
                                    {/*    textAlign: 'center'*/}
                                    {/*}}>{ strings('account.receiveScreen.clickToCopy') }</Text>*/}
                                </TouchableOpacity>
                                <View style={styles.line}>
                                    <View style={styles.line__item} />
                                </View>
                                <TouchableOpacity style={{ padding: 24, justifyContent: "center" }} onPress={this.handleCustomReceiveAmount}>
                                    <LightButton Icon={(props) => <Feather color="#864DD9" size={10} name={"edit"} { ...props } /> } title={strings('account.receiveScreen.receiveAmount')} iconStyle={{ marginHorizontal: 3 }}  />
                                </TouchableOpacity>
                            </GradientView>
                            <View style={styles.qr__shadow}>
                                <View style={styles.qr__shadow__item} />
                            </View>
                        </View>
                        {/*<Text style={styles.title}>*/}
                        {/*    { strings('account.receiveScreen.description', { currency: currencyName }) }*/}
                        {/*</Text>*/}

                        <View style={styles.options}>
                            <TouchableOpacity style={styles.options__item} onPress={this.handleBuy}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array} start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <View style={{ marginRight: 3 }}>
                                            <CustomIcon name="buy" style={{ color: '#864DD9', fontSize: 24 }}/>
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
                                            <Fontisto color={"#864DD9"} size={24} name={"share"} />
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

const lineStyles_ = {
    array: ["#7127ac","#864dd9"],
    arrayError: ['#e77ca3','#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles_ = {
    array: ["#f5f5f5","#f5f5f5"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
