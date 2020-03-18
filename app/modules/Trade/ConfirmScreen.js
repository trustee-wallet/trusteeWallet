import React, { Component } from 'react'

import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import AsyncStorage from '@react-native-community/async-storage'

import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import { setExchangeData } from '../../appstores/Actions/ExchangeStorage'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import { showModal } from '../../appstores/Actions/ModalActions'
import { setSendData } from '../../appstores/Actions/SendActions'

import MarketingEvent from '../../services/Marketing/MarketingEvent'
import updateExchangeOrdersDaemon from '../../services/Daemon/classes/UpdateExchangeOrders'
import Log from '../../services/Log/Log'
import { strings } from '../../services/i18n'
import api from '../../services/api'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'


class ConfirmScreen extends Component {

    constructor(props){
        super(props)
        this.state = {
            visible: false
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const orderData = this.props.navigation.getParam('orderData')

        console.log('orderData')
        console.log(orderData)

        this.setState({
            ...orderData,
            visible: true
        })
    }

    handleEdit = () => {
        NavStore.goBack()
    }

    handleSubmitTrade = () => {
        const {
            exchangeStore
        } = this.props

        if(exchangeStore.tradeType === 'BUY'){
            this.handleBuySubmit()
        } else {
            this.handleSellSubmit()
        }
    }

    handleConvertToPaymentCurrency = (fromCurrency, amount) => {

        const { selectedFiatCurrency } = this.state
        const fiatRates = JSON.parse(JSON.stringify(this.props.fiatRatesStore.fiatRates))

        let fromCurrencyRate = fiatRates.filter(item => item.cc === fromCurrency)
        fromCurrencyRate = fromCurrencyRate[0]
        let toCurrencyRate = fiatRates.filter(item => item.cc === selectedFiatCurrency.cc)
        toCurrencyRate = toCurrencyRate[0]

        return (amount * fromCurrencyRate.rate) / toCurrencyRate.rate
    }

    handleBuySubmit = async () => {

        AsyncStorage.setItem("TRADE_BUY_DATA", JSON.stringify({ lastBuyCache: this.state }))

        const {
            selectedCard,
            selectedCryptocurrency,
            selectedAccount,
            tradeWay,
            amount,
            deviceToken,
            cashbackToken,
            uniqueParams
        } = this.state

        const {
            settingsStore
        } = this.props

        const { amountEquivalentInCryptoToApi, amountEquivalentInFiatToApi } = amount


        const dataToSend = {
            outAmount: +((+amountEquivalentInCryptoToApi).toFixed(5)),
            inAmount: +((+amountEquivalentInFiatToApi).toFixed(2)),
            locale: settingsStore.data.language.split('-')[0],
            deviceToken: deviceToken,
            outDestination: selectedAccount.address,
            exchangeWayId: tradeWay.id,
            cashbackToken: cashbackToken,
            uniqueParams
        }

        try {

            setLoaderStatus(true)

            const res = await api.createOrder(dataToSend)

            setLoaderStatus(false)

            setExchangeData({})

            setExchangeData({
                id: res.data.orderId,
                link: res.data.url,
                cardNumber: selectedCard.number,
                expirationDate: selectedCard.expiration_date,
                deviceToken: deviceToken,
                selectedCryptocurrency,
                uniqueParams
            })

            if(selectedCryptocurrency.currencyCode !== "BTC"){
                delete dataToSend.uniqueParams.segwitOutDestination
            }

            MarketingEvent.startBuy({
                order_id : res.data.orderId + '',
                currency_code: selectedCryptocurrency.currencyCode,
                address_to : dataToSend.outDestination,
                address_to_short : dataToSend.outDestination ? dataToSend.outDestination.slice(0,10) : 'none',
                address_amount : dataToSend.outAmount + '',
                in_amount : dataToSend.inAmount + '',
                in_currency_code: tradeWay.inCurrencyCode + '',
                trade_way : tradeWay.id + '',
                trade_provider : tradeWay.provider + '',
                trade_in_code: tradeWay.inPaywayCode + '',
                walletHash : selectedAccount.wallet_hash,
                cashbackToken: dataToSend.cashbackToken,
            })

            NavStore.goNext('SMSCodeScreen')

            console.log(res)

        } catch (e) {
            setLoaderStatus(false)



            setTimeout(() => {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('confirmScreen.confirmScreenBuy'),
                })
            }, 500)

            console.log(e.message)
            Log.err('MainDataScreen.handleBuySubmit error ' + e.message)
        }

        updateExchangeOrdersDaemon.forceDaemonUpdate()
    }

    handleSellSubmit = async () => {

        AsyncStorage.setItem("TRADE_SELL_DATA", JSON.stringify({ lastSellCache: this.state }))

        const {
            selectedCryptocurrency,
            selectedCard,
            selectedAccount,
            tradeWay,
            amount,
            deviceToken,
            cashbackToken
        } = this.state

        const {
            settingsStore
        } = this.props

        const { amountEquivalentInCryptoToApi, amountEquivalentInFiatToApi, useAllFunds } = amount


        const dataToSend = {
            inAmount: +((+amountEquivalentInCryptoToApi).toFixed(5)),
            outAmount: +((+amountEquivalentInFiatToApi).toFixed(2)),
            locale: settingsStore.data.language.split('-')[0],
            deviceToken: deviceToken,
            outDestination: selectedCard.number,
            exchangeWayId: tradeWay.id,
            cashbackToken: cashbackToken,
            refundAddress: selectedAccount.address,
        }

        console.log(dataToSend)

        let res = false
        try {

            setLoaderStatus(true)

            res = await api.createOrder(dataToSend)

            console.log(res)

            const dataToScreen = {
                disabled: true,
                address: res.data.address,
                value: res.data.amount.toString(),
                account: selectedAccount,
                cryptocurrency: selectedCryptocurrency,
                description: strings('send.descriptionExchange'),
                useAllFunds,
                type: 'TRADE_SEND'
            }

            if(typeof res.data.memo !== "undefined"){
                dataToScreen.destinationTag = res.data.memo
            }

            MarketingEvent.startSell({
                order_id : res.data.orderId + '',
                currency_code: dataToScreen.cryptocurrency.currencyCode,
                address_from : dataToScreen.account.address,
                address_from_short : dataToScreen.account.address ? dataToScreen.account.address.slice(0, 10) : 'none',
                address_to : dataToScreen.address,
                address_amount : dataToScreen.value,
                walletHash : dataToScreen.account.wallet_hash
            })

            setSendData(dataToScreen)

            NavStore.goNext('SendScreen')

            setLoaderStatus(false)

        } catch (e) {
            setLoaderStatus(false)

            setTimeout(() => {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('confirmScreen.confirmScreenSell'),
                })
            }, 500)

            Log.log(`MainDataScreen.handleSellSubmit res `, res)
            Log.err(`MainDataScreen.handleSellSubmit error ` + e.message)
        }

        updateExchangeOrdersDaemon.forceDaemonUpdate()
    }

    renderProviderFee = () => {

        const { selectedFiatCurrency, tradeWay } = this.state

        let tmp = ''

        for(let i = 0; i < tradeWay.providerFee['in'].length; i++){
            i ? tmp = tmp + ' + ' : null

            if(tradeWay.providerFee['in'][i].type === 'percent')
                tmp = tmp + tradeWay.providerFee['in'][i].amount + ' %'

            if(tradeWay.providerFee['in'][i].type === 'fixed'){
                tmp = tmp + ( 1 * (tradeWay.providerFee['in'][i].amount / selectedFiatCurrency.rate).toFixed(2) ) + ' ' + selectedFiatCurrency.cc
            }
        }

        return tmp
    }

    renderOutputFee = () => {

        const { selectedFiatCurrency, selectedCryptocurrency, tradeWay } = this.state
        const { exchangeStore } = this.props

        let tmp = ''

        for(let i = 0; i < tradeWay.providerFee['out'].length; i++){
            i ? tmp = tmp + ' + ' : null

            if(tradeWay.providerFee['out'][i].type === 'percent')
                tmp = tmp + tradeWay.providerFee['out'][i].amount + ' %'

            if(tradeWay.providerFee['out'][i].type === 'fixed' && exchangeStore.tradeType === 'SELL' ){
                tmp = tmp + ( 1 * ( this.handleConvertToPaymentCurrency(tradeWay.outCurrencyCode, tradeWay.providerFee['out'][i].amount).toFixed(2) ) + ' ' + selectedFiatCurrency.cc)
            }

            if(tradeWay.providerFee['out'][i].type === 'fixed' && exchangeStore.tradeType === 'BUY' ){
                tmp = tmp + tradeWay.providerFee['out'][i].amount + ' ' + selectedCryptocurrency.currencySymbol
            }
        }

        return tmp
    }

    renderInfo = () => {

        const { selectedAccount, selectedCard } = this.state
        const { exchangeStore } = this.props

        return (
            <View style={styles.wrapper__bottom}>
                {/* <View style={[styles.wrapper__row, styles.wrapper__row_title]}> */}
                {/*    /!*<Text style={styles.wrapper__title}>*!/ */}
                {/*    /!*    { strings('confirmScreen.title') }*!/ */}
                {/*    /!*</Text>*!/ */}
                {/* </View> */}
                {
                    exchangeStore.tradeType === 'BUY' ?
                        <View style={styles.wrapper__row}>
                            <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                { strings('confirmScreen.withdrawAddress') }
                            </Text>
                            <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                { selectedAccount.address.slice(0, 6) + '...' + selectedAccount.address.slice(selectedAccount.address.length - 4, selectedAccount.address.length) }
                            </Text>
                        </View>
                        :
                        <View style={styles.wrapper__row}>
                            <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                { strings('confirmScreen.withdrawCardNumber') }
                            </Text>
                            <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                { selectedCard.number.replace(/^.{12}/g, '**** **** **** ') }
                            </Text>
                        </View>
                }
            </View>
        )
    }

    renderRate = (amount) => {
        return amount
    }

    renderCurrencyName = (selectedCryptocurrency) => {

        if(selectedCryptocurrency.currencyCode === 'USDT'){
            let extend = BlocksoftDict.getCurrencyAllSettings(selectedCryptocurrency.currencyCode)
            extend = typeof extend.addressCurrencyCode != 'undefined' ? BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName : ''

            return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + extend
        } else if(selectedCryptocurrency.currencyCode === 'ETH_USDT'){
            return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + 'ERC20'
        } else {
            return selectedCryptocurrency.currencyName
        }
    }

    render() {

        const { selectedCryptocurrency, selectedFiatCurrency, tradeWay, amount, visible } = this.state
        const { exchangeStore } = this.props

        const submitBtnFix = exchangeStore.tradeType === 'BUY' ? strings('confirmScreen.submitBtnBuy') + ' ' + selectedCryptocurrency.currencySymbol : strings('confirmScreen.submitBtnSell') + ' ' + selectedCryptocurrency.currencySymbol
        const fiatField = exchangeStore.tradeType === 'BUY' ? 'inCurrencyCode' : 'outCurrencyCode'

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('confirmScreen.title')}
                />
                {
                    visible ?
                        <View style={styles.wrapper__content}>
                            <View style={styles.wrapper__top}>
                                <View style={styles.wrapper__row}>
                                    <Text style={styles.wrapper__title}>
                                        { exchangeStore.tradeType === 'BUY' ? strings('tradeScreen.youGet') : strings('tradeScreen.youGive') } { this.renderCurrencyName(selectedCryptocurrency) }
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40, styles.buttons__total, { fontSize: 16 }]}>
                                        { exchangeStore.tradeType === 'BUY' ? '~' : '' } { 1 * (amount.amountEquivalentInCryptoToApi).slice(0, (amount.amountEquivalentInCryptoToApi.indexOf("."))+6) } { selectedCryptocurrency.currencySymbol }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.line} />
                            {/* <View style={styles.wrapper__middle}> */}
                            {/*    <View style={[styles.wrapper__row, styles.wrapper__row_title]}> */}
                            {/*        <Text style={styles.wrapper__title}> */}
                            {/*            Payment */}
                            {/*        </Text> */}
                            {/*    </View> */}
                            {/*    <View style={styles.wrapper__middle__content}> */}

                            {/*    </View> */}
                            {/* </View> */}
                            {/* <View style={styles.line} /> */}
                            <View>
                                <View style={[styles.wrapper__row, styles.wrapper__row_title]}>
                                    <Text style={styles.wrapper__title}>
                                        { strings('confirmScreen.fees') }
                                    </Text>
                                </View>
                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        { strings('confirmScreen.rate') + " 1" + ' ' + selectedCryptocurrency.currencySymbol }
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        { this.renderRate((this.handleConvertToPaymentCurrency(tradeWay[fiatField], tradeWay.exchangeRate.amount)).toFixed(2)) + ' ' + selectedFiatCurrency.cc }
                                    </Text>
                                </View>
                                {
                                    this.renderProviderFee() && exchangeStore.tradeType === 'BUY' ?
                                        <View style={styles.wrapper__row}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                                                <Text style={[styles.wrapper__text, styles.wrapper__text_99, { marginRight: 4 }]}>
                                                    { strings('confirmScreen.providerFee') }
                                                </Text>
                                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                                    { this.renderProviderFee() }
                                                </Text>
                                            </View>
                                            <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                                { (this.handleConvertToPaymentCurrency(tradeWay[fiatField], 1 * (amount.fee.providerFee['in'].toFixed(2)))).toFixed(2) } { selectedFiatCurrency.cc }
                                            </Text>
                                        </View> : null
                                }
                                <View style={styles.wrapper__row}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_99, { marginRight: 4 }]}>
                                            { exchangeStore.tradeType === 'BUY' ? strings('confirmScreen.outputFee') : strings('confirmScreen.providerFee') }
                                        </Text>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                            { this.renderOutputFee() }
                                        </Text>
                                    </View>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        { (this.handleConvertToPaymentCurrency(tradeWay[fiatField], 1 * (amount.fee.providerFee['out'].toFixed(2)))).toFixed(2)} { selectedFiatCurrency.cc }
                                    </Text>
                                </View>
                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        { strings('confirmScreen.trusteeFee') } { tradeWay.trusteeFee[exchangeStore.tradeType === 'BUY' ? 'in' : 'out'][0].amount } %
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        { (this.handleConvertToPaymentCurrency(tradeWay[fiatField], 1 * (amount.fee.trusteeFee[exchangeStore.tradeType === 'BUY' ? 'in' : 'out'].toFixed(2)))).toFixed(2)  } { selectedFiatCurrency.cc }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.line} />
                            { this.renderInfo() }
                            <View style={styles.buttons}>
                                <View style={[styles.wrapper__row, styles.wrapper__row_buttons]}>
                                    <Text style={styles.buttons__title}>
                                        { exchangeStore.tradeType === 'SELL' ? strings('tradeScreen.youGet') : strings('tradeScreen.youGive') } { selectedFiatCurrency.cc  }
                                    </Text>
                                    <Text style={styles.buttons__total}>
                                        { exchangeStore.tradeType === 'SELL' ? '~' : '' } { 1 * (+amount.amountEquivalentInFiat).toFixed(2) }
                                    </Text>
                                </View>
                                <View style={styles.wrapper__row}>
                                    <ButtonLine styles={{ flex: 1 }} press={this.handleEdit}>
                                        { strings('confirmScreen.edit') }
                                    </ButtonLine>
                                    <View style={styles.whiteSpace} />
                                    <Button styles={{ flex: 1 }} press={this.handleSubmitTrade}>
                                        { submitBtnFix }
                                    </Button>
                                </View>
                            </View>
                        </View> : null
                }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        mainStore: state.mainStore,
        wallet: state.mainStore.selectedWallet,
        selectedAccount: state.mainStore.selectedAccount,
        exchangeStore: state.exchangeStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#fff'
    },
    wrapper__content: {
        flex: 1,
        marginTop: 90
    },
    wrapper__bottom: {
        flex: 1
    },
    wrapper__row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',

        paddingHorizontal: 30,
        marginTop: 8,
    },
    wrapper__row_title: {
        marginTop: 16,
        marginBottom: 8
    },
    wrapper__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    wrapper__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
    },
    wrapper__text_99: {
        color: '#999999'
    },
    wrapper__text_40: {
        color: '#404040'
    },
    line: {
        height: 1,
        marginHorizontal: 15,
        marginTop: 19,

        backgroundColor: '#F3E6FF'
    },
    buttons: {
        marginBottom: 30
    },
    wrapper__row_buttons: {
        marginBottom: 50,
    },
    buttons__title: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    buttons__total: {
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127AC'
    },
    whiteSpace: {
        width: 15
    }
}
