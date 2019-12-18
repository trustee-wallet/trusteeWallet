import React, { Component } from 'react'

import { View, Text } from 'react-native'
import { connect } from 'react-redux'

import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import { showModal } from '../../appstores/Actions/ModalActions'
import { strings } from '../../services/i18n'
import AsyncStorage from '@react-native-community/async-storage'
import { setLoaderStatus, setSelectedAccount } from '../../appstores/Actions/MainStoreActions'
import api from '../../services/api'
import { setExchangeData } from '../../appstores/Actions/ExchangeStorage'
import Log from '../../services/Log/Log'
import { setSendData } from '../../appstores/Actions/SendActions'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import { capitalize } from '../../services/utils'
import MarketingEvent from '../../services/Marketing/MarketingEvent'


class ConfirmScreen extends Component {

    constructor(props){
        super(props)
        this.state = {
            visible: false
        }
    }

    componentWillMount() {
        const orderData = this.props.navigation.getParam('orderData')
        this.setState({
            ...orderData,
            visible: true
        })
    }

    handleEdit = () => {
        NavStore.goBack()
    }

    handleExchange = async () => {
        const {
            selectedInCryptocurrency,
            selectedInAccount,
            selectedOutCryptocurrency,
            selectedOutAccount,
            exchangeWay,
            amount,
            deviceToken,
            cashbackToken
        } = this.state

        const {
            settingsStore
        } = this.props

        const { amountEquivalent, useAllFunds } = amount


        const dataToSend = {
            inAmount: +((+amountEquivalent.inAmount).toFixed(5)),
            outAmount: +((+amountEquivalent.outAmount).toFixed(5)),
            locale: settingsStore.data.language.split('-')[0],
            deviceToken: deviceToken,
            outDestination: selectedOutAccount.address,
            exchangeWayId: exchangeWay.id,
            cashbackToken: cashbackToken,
            refundAddress: selectedInAccount.address,
        }

        console.log('datatt')
        console.log(dataToSend)

        try {

            setLoaderStatus(true)

            const res = await api.createOrder(dataToSend)

            console.log(res)

            const dataToScreen = {
                disabled: true,
                address: res.data.address,
                value: res.data.amount.toString(),
                account: selectedInAccount,
                cryptocurrency: selectedInCryptocurrency,
                description: strings('send.descriptionExchange'),
                useAllFunds,
                type: 'TRADE_SEND'
            }

            setSendData(dataToScreen)

            MarketingEvent.startExchange({
                order_id : res.data.orderId + '',
                currency_code: selectedOutCryptocurrency.currencyCode,
                address_to : dataToScreen.address,
                address_amount : dataToSend.outAmount + '',
                in_amount : dataToSend.inAmount + '',
                in_currency_code: selectedInCryptocurrency.currencyCode,
                trade_way :  exchangeWay.id + '',
                trade_provider : exchangeWay.provider + '',
                trade_in_code:  exchangeWay.inPaywayCode + '',
                walletHash : selectedInAccount.wallet_hash,
                cashbackToken: dataToSend.cashbackToken,
            })

            console.log(dataToScreen)

            NavStore.goNext('SendScreen')

            setLoaderStatus(false)

        } catch (e) {
            setLoaderStatus(false)

            const err = (JSON.parse(JSON.stringify(e)))

            console.log(err)

            setTimeout(() => {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('confirmScreen.confirmScreenSell'),
                })
            }, 500)

            Log.err(`MainDataScreen.handleSellSubmit`, err)
        }

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

        const { selectedOutCryptocurrency, exchangeWay } = this.state

        let tmp = ''

        for(let i = 0; i < exchangeWay.providerFee['out'].length; i++){
            i ? tmp = tmp + ' + ' : null

            if(exchangeWay.providerFee['out'][i].type === 'percent')
                tmp = tmp + exchangeWay.providerFee['out'][i].amount + ' %'

            if(exchangeWay.providerFee['out'][i].type === 'fixed'){
                tmp = tmp + exchangeWay.providerFee['out'][i].amount + ' ' + selectedOutCryptocurrency.currencySymbol
            }
        }

        return tmp
    }

    renderInfo = () => {

        const { selectedInCryptocurrency, selectedInAccount, selectedOutCryptocurrency } = this.state
        const { exchangeStore } = this.props

        return (
            <View style={styles.wrapper__bottom}>
                {/*<View style={[styles.wrapper__row, styles.wrapper__row_title]}>*/}
                {/*    /!*<Text style={styles.wrapper__title}>*!/*/}
                {/*    /!*    { strings('confirmScreen.title') }*!/*/}
                {/*    /!*</Text>*!/*/}
                {/*</View>*/}
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

    renderRate = () => {

        const { selectedInCryptocurrency, selectedOutCryptocurrency, exchangeWay } = this.state

        const tmp = exchangeWay.exchangeRate.type === 'OUT' ? selectedInCryptocurrency.currencySymbol : selectedOutCryptocurrency.currencySymbol
        return strings('confirmScreen.rate') + " 1 " + tmp
    }

    renderCurrencyName = (selectedCryptocurrency) => {

        if(selectedCryptocurrency.currencyCode === 'USDT'){
            let extend = BlocksoftDict.getCurrencyAllSettings(selectedCryptocurrency.currencyCode)
            extend = typeof extend.addressCurrencyCode != 'undefined' ? BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName : ''

            return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + extend
        } if(selectedCryptocurrency.currencyCode === 'ETH_USDT') {
            return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + 'ERC20'
        } else {
            return selectedCryptocurrency.currencyName
        }
    }

    renderTrusteeFee = () => {
        const { exchangeWay } = this.state

        const inFee = exchangeWay.trusteeFee.in
        const outFee = exchangeWay.trusteeFee.out

        let array = []
        let tmp

        tmp = inFee.find(item => item.type === 'percent')
        typeof tmp != 'undefined' ? array.push(tmp.amount) : null

        tmp = outFee.find(item => item.type === 'percent')
        typeof tmp != 'undefined' ? array.push(tmp.amount) : null


        return array.reduce((a, b) => a + b, 0) + ' %'
    }

    renderTrusteeFeeAmounts = () => {
        const { selectedInCryptocurrency, selectedOutCryptocurrency, amount } = this.state

        return `${amount.amountEquivalent.trusteeFee.in} ${selectedInCryptocurrency.currencySymbol} | ${amount.amountEquivalent.trusteeFee.out} ${selectedOutCryptocurrency.currencySymbol}`
    }

    render() {

        const { selectedInCryptocurrency, selectedOutCryptocurrency, selectedOutAccount, exchangeWay, amount, visible } = this.state
        // const { exchangeStore } = this.props
        //
        // const fiatField = exchangeStore.tradeType === 'BUY' ? 'inCurrencyCode' : 'outCurrencyCode'

        const networkFee = exchangeWay.providerFee['out'].find(item => item.type === 'fixed')
        const providerFee = exchangeWay.providerFee['out'].find(item => item.type === 'percent')

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('exchangeConfirmScreen.title')}
                />
                {
                    visible ?
                        <View style={styles.wrapper__content}>
                            <View style={styles.wrapper__top}>
                                <View style={[styles.wrapper__row, styles.wrapper__row_title]}>
                                    <Text style={styles.wrapper__title}>
                                        { strings('exchangeConfirmScreen.youWantToExchange') }
                                    </Text>
                                </View>
                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        { strings('tradeScreen.youGive') + ' ' + this.renderCurrencyName(selectedInCryptocurrency)}
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40, styles.buttons__total, { fontSize: 16 }]}>
                                         { 1 * ((amount.amountEquivalent.inAmount).toString()).slice(0, ((amount.amountEquivalent.inAmount.toString()).indexOf("."))+6) } { selectedInCryptocurrency.currencySymbol }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.line} />
                            {/*<View>*/}
                            <View style={[styles.wrapper__row, styles.wrapper__row_title]}>
                                <Text style={styles.wrapper__title}>
                                    { strings('exchangeConfirmScreen.exchangeDetails') }
                                </Text>
                            </View>
                            <View style={styles.wrapper__row}>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                    { this.renderRate() }
                                </Text>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                    { '~ ' + ( exchangeWay.exchangeRate.amount.toFixed(10).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1') + " " + selectedOutCryptocurrency.currencySymbol)  }
                                </Text>
                            </View>
                                {/*{*/}
                                {/*    this.renderProviderFee() ?*/}
                                {/*        <View style={styles.wrapper__row}>*/}
                                {/*            <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>*/}
                                {/*                { strings('confirmScreen.providerFee') } { this.renderProviderFee() }*/}
                                {/*            </Text>*/}
                                {/*            <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>*/}
                                {/*                { (this.handleConvertToPaymentCurrency(tradeWay[fiatField], 1 * (amount.fee.providerFee['in'].toFixed(2)))).toFixed(2) } { selectedFiatCurrency.cc }*/}
                                {/*            </Text>*/}
                                {/*        </View> : null*/}
                                {/*}*/}
                            <View style={styles.wrapper__row}>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                    { strings('confirmScreen.outputFee') }
                                </Text>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                    { networkFee.amount + ' ' + selectedOutCryptocurrency.currencySymbol }
                                </Text>
                            </View>
                            <View style={styles.wrapper__row}>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                    { strings('exchangeScreen.fee') + " " + capitalize(exchangeWay.provider) + ' ' + providerFee.amount + ' %' }
                                </Text>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                    { 1 * amount.amountEquivalent.providerFee.out.toFixed(5) + ' ' + selectedOutCryptocurrency.currencySymbol }
                                </Text>
                            </View>
                            <View>
                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        { strings('confirmScreen.trusteeFee') } { this.renderTrusteeFee() }
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        { this.renderTrusteeFeeAmounts() }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.line} />
                            <View style={styles.wrapper__row}>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                    { strings('confirmScreen.withdrawAddress') }
                                </Text>
                                <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                    { selectedOutAccount.address.slice(0, 6) + '...' + selectedOutAccount.address.slice(selectedOutAccount.address.length - 4, selectedOutAccount.address.length) }
                                </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                            {/*{ this.renderInfo() }*/}
                            <View style={styles.buttons}>
                                <View style={[styles.wrapper__row, styles.wrapper__row_buttons, { flexWrap: 'nowrap' }]}>
                                    <Text style={[styles.buttons__title, { flex: 1 }]} numberOfLines={1}>
                                        { strings('tradeScreen.youGet') } { this.renderCurrencyName(selectedOutCryptocurrency) }
                                    </Text>
                                    <Text style={styles.buttons__total}>
                                        { '~' + 1 * amount.amountEquivalent.outAmount.toFixed(5)  + " " + selectedOutCryptocurrency.currencySymbol }
                                    </Text>
                                </View>
                                <View style={styles.wrapper__row}>
                                    <ButtonLine styles={{ flex: 1 }} press={this.handleEdit}>
                                        { strings('confirmScreen.edit') }
                                    </ButtonLine>
                                    <View style={styles.whiteSpace} />
                                    <Button styles={{ flex: 1 }} press={this.handleExchange}>
                                        { strings('exchangeConfirmScreen.exchangeBtn') + ' ' + selectedInCryptocurrency.currencySymbol }
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
        flexWrap: 'wrap',

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
