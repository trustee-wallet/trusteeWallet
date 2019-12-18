import React, { Component } from 'react'
import { connect } from 'react-redux'

import AsyncStorage from '@react-native-community/async-storage'

import Limits from './elements/Limits'
import AmountInput from './elements/AmountInput'
import FiatTemplate from './elements/FiatTemplate'
import PaymentSystem from './elements/PaymentSystem'
import InCryptocurrencies from './elements/InCryptocurrencies'
import OutCryptocurrencies from './elements/OutCryptocurrencies'

import { Text, View, ScrollView, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'

import firebase from 'react-native-firebase'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

const { width: WIDTH } = Dimensions.get('window')

import NavStore from '../../components/navigation/NavStore'
import { showModal } from '../../appstores/Actions/ModalActions'
import { strings } from '../../services/i18n'
import Log from '../../services/Log/Log'


class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            selectedInCryptocurrency: {},
            selectedInAccount: {},
            selectedOutCryptocurrency: {},
            selectedOutAccount: {},



            selectedPaymentSystem: {},
            selectedFiatCurrency: {},
            selectedFiatTemplate: '',
            selectedCard: {},

            selectedTradeWay: {},
            fieldForFiatCurrency: '',
            fieldForPaywayCode: '',

            extendsFields: {
                inCryptocurrency: 'inCurrencyCode',
                outCryptocurrency: 'outCurrencyCode',
                fieldForPaywayCode: 'inPaywayCode',
            },

            deviceToken: null,
            show: true
        }

    }

    handleConvertToPaymentCurrency = (selectedInCryptocurrency, selectedOutCryptocurrency) => {

        const exchangeWay = this.handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)



        // const { selectedFiatCurrency } = this.state
        // const fiatRates = JSON.parse(JSON.stringify(this.props.fiatRatesStore.fiatRates))
        //
        // let fromCurrencyRate = fiatRates.filter(item => item.cc === fromCurrency)
        // fromCurrencyRate = fromCurrencyRate[0]
        // let toCurrencyRate = fiatRates.filter(item => item.cc === selectedFiatCurrency.cc)
        // toCurrencyRate = toCurrencyRate[0]

        return 0
    }

    handleSetState = (field, state) => this.setState({ [field]: state })

    handleGetExchangeWay = (selectedInCryptocurrency, selectedOutCryptocurrency) => {
        try {
            const {
                extendsFields
            } = this.state

            let exchangeWays = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))

            exchangeWays = exchangeWays.filter(item => item[extendsFields.inCryptocurrency] === selectedInCryptocurrency.currencyCode && item[extendsFields.outCryptocurrency] === selectedOutCryptocurrency.currencyCode)

            return exchangeWays[0]
        } catch (e) {
            Log.err('MainDataScreen.handleGetExchangeWay error ' + e)
        }
    }

    handleValidateSubmit = () => {
        const {
            selectedInCryptocurrency,
            selectedOutCryptocurrency,
            selectedFiatTemplate,
            selectedPaymentSystem
        } = this.state

        if(typeof selectedInCryptocurrency.currencyCode == 'undefined') throw new Error(strings('tradeScreen.modalError.selectCryptocurrency'))

        if(typeof selectedOutCryptocurrency.currencyCode == 'undefined') throw new Error(strings('tradeScreen.modalError.selectCryptocurrency'))

        if(typeof selectedPaymentSystem.paymentSystem == 'undefined') throw new Error(strings('tradeScreen.modalError.selectPaymentSystem'))

        if(!this.refLimits.handleValidateLimits()) throw new Error(strings('tradeScreen.modalError.limit'))
    }

    handleSubmitTrade = async () => {

        const {
            selectedInCryptocurrency,
            selectedInAccount,
            selectedOutCryptocurrency,
            selectedOutAccount,
            selectedPaymentSystem,
        } = this.state

        const deviceToken = await AsyncStorage.getItem('fcmToken')
        const cashbackToken = await AsyncStorage.getItem('cashbackToken')
        const exchangeWay = this.handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)
        const amount = this.refAmount.handleGetAmountEquivalent()

        try {
            this.handleValidateSubmit()
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
            return
        }

        NavStore.goNext('ConfirmScreen', {
            orderData: {
                selectedInCryptocurrency,
                selectedInAccount,
                selectedOutCryptocurrency,
                selectedOutAccount,
                selectedPaymentSystem,
                exchangeWay,
                amount,
                deviceToken,
                cashbackToken
            }
        })
    }

    amountInputOnFocus = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ x: 0, y: 370, animated: true })
            } catch (e) {}
        }, 400)
    }

    render() {

        const {
            extendsFields,
            selectedInCryptocurrency,
            selectedInAccount,
            selectedOutCryptocurrency,
            selectedPaymentSystem,
            selectedTradeWay,
            selectedFiatTemplate,
            isLimitValid,
            show
        } = this.state

        const { exchangeStore, navigation } = this.props
        const submitBtnFix = strings('exchangeScreen.exchangeBtn')

        firebase.analytics().setCurrentScreen('Exchange.MainScreen.' + exchangeStore.tradeType)

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('exchangeScreen.title')}
                    navigation={this.props.navigation}
                />
                <KeyboardAwareView>
                        {
                            show ?
                                <ScrollView
                                    ref={(ref) => this.scrollView = ref}
                                    keyboardShouldPersistTaps={'always'}
                                    showsVerticalScrollIndicator={false}
                                    onScroll={this.onScrollView}
                                    style={styles.wrapper__scrollView}>
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <View style={styles.top}>
                                            <View style={styles.top__item}>
                                                <Text style={[styles.titleText, typeof selectedInCryptocurrency.currencyCode == 'undefined' ? styles.titleText_disabled : null]}>
                                                    { strings('tradeScreen.youGive') }
                                                </Text>
                                                <InCryptocurrencies
                                                    ref={ref => this.refInCryptocurrencies = ref}
                                                    refOutCryptocurrencies={this.refOutCryptocurrencies}
                                                    selectedInCryptocurrency={selectedInCryptocurrency}
                                                    selectedOutCryptocurrency={selectedOutCryptocurrency}
                                                    handleSetState={this.handleSetState}
                                                    extendsFields={extendsFields}
                                                    navigation={navigation} />
                                            </View>
                                            <View style={styles.top__item_space} />
                                            <View style={styles.top__item}>
                                                <Text style={styles.titleText}>
                                                    { strings('tradeScreen.youGet') }
                                                </Text>
                                                <OutCryptocurrencies
                                                    ref={ref => this.refOutCryptocurrencies = ref}
                                                    refInCryptocurrencies={this.refInCryptocurrencies}
                                                    selectedInCryptocurrency={selectedInCryptocurrency}
                                                    selectedOutCryptocurrency={selectedOutCryptocurrency}
                                                    handleSetState={this.handleSetState}
                                                    extendsFields={extendsFields}
                                                    navigation={navigation} />
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                    <View style={styles.middle}>
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                            <View>
                                                <Text style={[styles.titleText, { marginLeft: 30 }]}>{ strings('exchangeScreen.pickProvider') }</Text>
                                                <View styles={styles.line} />
                                            </View>
                                        </TouchableWithoutFeedback>
                                        <PaymentSystem
                                            ref={ref => this.refPaymentSystem = ref}
                                            handleSetState={this.handleSetState}
                                            extendsFields={extendsFields}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedTradeWay={selectedTradeWay}
                                            selectedInCryptocurrency={selectedInCryptocurrency}
                                            selectedOutCryptocurrency={selectedOutCryptocurrency}/>
                                    </View>
                                    <View style={styles.box}>
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                            <Text style={[styles.titleText, { textAlign: 'center' }]}>{ strings('tradeScreen.selectSum') }</Text>
                                        </TouchableWithoutFeedback>
                                        <FiatTemplate
                                            refLimits={this.refLimits}
                                            refAmount={this.refAmount}
                                            selectedInCryptocurrency={selectedInCryptocurrency}
                                            selectedOutCryptocurrency={selectedOutCryptocurrency}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedFiatTemplate={selectedFiatTemplate}
                                            handleSetState={this.handleSetState}
                                            handleGetExchangeWay={this.handleGetExchangeWay}
                                            handleConvertToPaymentCurrency={this.handleConvertToPaymentCurrency}/>
                                        <AmountInput
                                            ref={ref => this.refAmount = ref}
                                            selectedInCryptocurrency={selectedInCryptocurrency}
                                            selectedOutCryptocurrency={selectedOutCryptocurrency}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedInAccount={selectedInAccount}
                                            selectedFiatTemplate={selectedFiatTemplate}
                                            extendsFields={extendsFields}
                                            handleSetState={this.handleSetState}
                                            handleGetExchangeWay={this.handleGetExchangeWay}
                                            onFocus={this.amountInputOnFocus} />
                                        <Limits ref={ref => this.refLimits = ref}
                                                refAmount={this.refAmount}
                                                selectedInCryptocurrency={selectedInCryptocurrency}
                                                selectedOutCryptocurrency={selectedOutCryptocurrency}
                                                extendsFields={extendsFields}
                                                selectedPaymentSystem={selectedPaymentSystem}
                                                isLimitValid={isLimitValid}
                                                handleGetExchangeWay={this.handleGetExchangeWay}
                                                handleSetState={this.handleSetState} />
                                    </View>
                                    <View style={styles.btn}>
                                        <Button press={this.handleSubmitTrade}>
                                            { submitBtnFix }
                                        </Button>
                                    </View>
                                </ScrollView> : null
                        }
                </KeyboardAwareView>
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

export default connect(mapStateToProps, mapDispatchToProps)(MainDataScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#fff'
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        width: '100%',
        paddingHorizontal: 15
    },
    top__item: {
        flex: 1,
    },
    top__item_space: {
        minWidth: 7
    },
    titleText: {
        paddingTop: 24,
        marginLeft: 15,
        paddingBottom: 8,

        fontSize: 16,
        color: '#999999'
    },
    titleText_disabled: {
        color: '#DADADA'
    },
    btn: {
        flex: 1,
        marginTop: 10,
        marginHorizontal: 30,
        marginBottom: 40
    }
}
