import React, { Component } from 'react'
import { connect } from 'react-redux'

import AsyncStorage from '@react-native-community/async-storage'

import Cards from './elements/Cards'
import Limits from './elements/Limits'
import AmountInput from './elements/AmountInput'
import FiatTemplate from './elements/FiatTemplate'
import OptionalData from './elements/OptionalData'
import PaymentSystem from './elements/PaymentSystem'
import FiatCurrencies from './elements/FiatCurrencies'
import Cryptocurrencies from './elements/Cryptocurrencies'

import NavigationTitleComponent from './elements/NavigationTitleComponent'

import { TextInput, Image, Text, TouchableOpacity, View, ScrollView, Dimensions, Platform, Keyboard, Clipboard, TouchableWithoutFeedback } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'

import firebase from 'react-native-firebase'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

const { width: WIDTH } = Dimensions.get('window')

import NavStore from '../../components/navigation/NavStore'
import { showModal } from '../../appstores/Actions/ModalActions'
import { strings } from '../../services/i18n'


class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            selectedCryptocurrency: {},
            selectedAccount: {},
            selectedPaymentSystem: '',
            selectedFiatCurrency: {},
            selectedFiatTemplate: '',
            selectedCard: {},
            uniqueParams: {},

            selectedTradeWay: {},
            fieldForFiatCurrency: '',
            fieldForPaywayCode: '',

            deviceToken: null,
            show: true
        }

    }

    componentWillMount() {
        const { tradeType } = this.props.exchangeStore

        this.handleSetTradeWay(tradeType)
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

    handleSetTradeWay = (tradeType) => {

        if(tradeType === 'BUY'){
            this.setState({
                selectedCryptocurrency: {},
                selectedAccount: {},
                selectedPaymentSystem: '',
                selectedFiatCurrency: {},
                selectedFiatTemplate: '',
                selectedCard: {},

                selectedTradeWay: {},
                fieldForFiatCurrency: '',
                fieldForPaywayCode: '',

                deviceToken: null,
                extendsFields: {
                    fieldForCryptocurrency: 'outCurrencyCode',
                    fieldForFiatCurrency: 'inCurrencyCode',
                    fieldForPaywayCode: 'inPaywayCode',
                    fieldForWayId: 'IN',
                    fieldForWayId2: 'OUT',
                }
            }, () => {
                this.setState({
                    show: true
                })
            })
        } else {
            this.setState({
                selectedCryptocurrency: {},
                selectedAccount: {},
                selectedPaymentSystem: '',
                selectedFiatCurrency: {},
                selectedFiatTemplate: '',
                selectedCard: {},

                selectedTradeWay: {},
                fieldForFiatCurrency: '',
                fieldForPaywayCode: '',

                deviceToken: null,
                extendsFields: {
                    fieldForCryptocurrency: 'inCurrencyCode',
                    fieldForFiatCurrency: 'outCurrencyCode',
                    fieldForPaywayCode: 'outPaywayCode',
                    fieldForWayId: 'OUT',
                    fieldForWayId2: 'IN',
                }
            }, () => {
                this.setState({
                    show: true
                })
            })

        }
    }

    handleSetState = (field, state) => this.setState({ [field]: state })

    handleGetTradeWay = (selectedCryptocurrency, selectedPaymentSystem) => {
        const {
            extendsFields
        } = this.state

        let tradeWays = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig.exchangeWays))

        tradeWays = tradeWays.filter(item => item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode && item[extendsFields.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem && item[extendsFields.fieldForFiatCurrency] === selectedPaymentSystem.currencyCode)

        return tradeWays[0]
    }

    handleValidateSubmit = async () => {
        const {
            selectedCryptocurrency,
            selectedFiatTemplate,
            selectedPaymentSystem,
            selectedFiatCurrency,
            selectedCard
        } = this.state

        const { exchangeStore } = this.props

        if(typeof selectedCryptocurrency.currencyCode == 'undefined') throw new Error(strings('tradeScreen.modalError.selectCryptocurrency'))

        if(typeof selectedFiatCurrency.cc == 'undefined') throw new Error(exchangeStore.tradeType === 'BUY' ? strings('tradeScreen.modalError.selectWhatYouGive') : strings('tradeScreen.modalError.selectWhatYouGet'))

        if(typeof selectedPaymentSystem.paymentSystem == 'undefined') throw new Error(strings('tradeScreen.modalError.selectPaymentSystem'))

        if(!selectedFiatTemplate) throw new Error(strings('tradeScreen.modalError.selectFiatTemplate'))

        if(!this.refLimits.handleValidateLimits()) {
            Keyboard.dismiss()
            throw new Error(strings('tradeScreen.modalError.limit'))
        }

        if(this.refOptionalData.getState().enabled)
            await this.refOptionalData.validateData()

        if(this.refCards.getState().enabled){
            this.refCards.validate()
        }
    }

    handleSubmitTrade = async () => {

        const {
            selectedCryptocurrency,
            selectedFiatCurrency,
            selectedPaymentSystem,
            selectedCard,
            selectedAccount,
        } = this.state


        const deviceToken = await AsyncStorage.getItem('fcmToken')
        const cashbackToken = await AsyncStorage.getItem('cashbackToken')
        const tradeWay = this.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)
        const amount = this.refAmount.handleGetAmountEquivalent()

        console.log('log amount')
        console.log(amount)

        try {
            await this.handleValidateSubmit()

            console.log('state')
            console.log(this.state)
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
                selectedCryptocurrency,
                selectedFiatCurrency,
                selectedPaymentSystem,
                selectedCard,
                selectedAccount,
                tradeWay,
                amount,
                deviceToken,
                cashbackToken,
                uniqueParams: this.state.uniqueParams
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
            selectedCryptocurrency,
            selectedAccount,
            selectedPaymentSystem,
            selectedTradeWay,
            selectedFiatTemplate,
            selectedFiatCurrency,
            selectedCard,
            isLimitValid,
            show
        } = this.state

        const { exchangeStore, navigation } = this.props
        const submitBtnFix = exchangeStore.tradeType === 'BUY' ? strings('confirmScreen.submitBtnBuy') : strings('confirmScreen.submitBtnSell')

        firebase.analytics().setCurrentScreen('Exchange.MainScreen.' + exchangeStore.tradeType)

        return (
            <View style={styles.wrapper}>
                <Navigation
                    navigation={this.props.navigation}
                    titleComponent={<NavigationTitleComponent handleSetTradeWay={this.handleSetTradeWay} handleSetState={this.handleSetState} exchangeStore={exchangeStore}/>}
                />
                <KeyboardAwareView>
                        {
                            show ?
                                <ScrollView
                                    ref={(ref) => this.scrollView = ref}
                                    keyboardShouldPersistTaps={'always'}
                                    showsVerticalScrollIndicator={false}
                                    style={styles.wrapper__scrollView}>
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        {
                                            exchangeStore.tradeType === 'BUY' ?
                                                <View style={styles.top}>
                                                    <View style={styles.top__item}>
                                                        <Text style={[styles.titleText, typeof selectedCryptocurrency.currencyCode == 'undefined' ? styles.titleText_disabled : null]}>
                                                            { strings('tradeScreen.youGive') }
                                                        </Text>
                                                        <FiatCurrencies
                                                            ref={ref => this.refFiatCurrencies = ref}
                                                            selectedFiatCurrency={selectedFiatCurrency}
                                                            extendsFields={extendsFields}
                                                            selectedCryptocurrency={selectedCryptocurrency}
                                                            selectedPaymentSystem={selectedPaymentSystem}
                                                            navigation={navigation}
                                                            handleSetState={this.handleSetState}/>
                                                    </View>
                                                    <View style={styles.top__item_space} />
                                                    <View style={styles.top__item}>
                                                        <Text style={styles.titleText}>
                                                            { strings('tradeScreen.youGet') }
                                                        </Text>
                                                        <Cryptocurrencies
                                                            ref={ref => this.refCryptocurrencies = ref}
                                                            refFiatCurrencies={this.refFiatCurrencies}
                                                            selectedCryptocurrency={selectedCryptocurrency}
                                                            handleSetState={this.handleSetState}
                                                            extendsFields={extendsFields}
                                                            navigation={navigation} />
                                                    </View>
                                                </View>
                                                :
                                                <View style={styles.top}>
                                                    <View style={styles.top__item}>
                                                        <Text style={[styles.titleText, typeof selectedCryptocurrency.currencyCode == 'undefined' ? styles.titleText_disabled : null]}>
                                                            { strings('tradeScreen.youGive') }
                                                        </Text>
                                                        <Cryptocurrencies
                                                            ref={ref => this.refCryptocurrencies = ref}
                                                            refFiatCurrencies={this.refFiatCurrencies}
                                                            selectedCryptocurrency={selectedCryptocurrency}
                                                            handleSetState={this.handleSetState}
                                                            extendsFields={extendsFields}
                                                            navigation={navigation} />
                                                    </View>
                                                    <View style={styles.top__item_space} />
                                                    <View style={styles.top__item}>
                                                        <Text style={styles.titleText}>
                                                            { strings('tradeScreen.youGet') }
                                                        </Text>
                                                        <FiatCurrencies
                                                            ref={ref => this.refFiatCurrencies = ref}
                                                            selectedFiatCurrency={selectedFiatCurrency}
                                                            extendsFields={extendsFields}
                                                            selectedCryptocurrency={selectedCryptocurrency}
                                                            selectedPaymentSystem={selectedPaymentSystem}
                                                            navigation={navigation}
                                                            handleSetState={this.handleSetState}/>
                                                    </View>
                                                </View>
                                        }

                                    </TouchableWithoutFeedback>
                                    <View style={styles.middle}>
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                            <View>
                                                <Text style={[styles.titleText, { marginLeft: 30 }]}>{ strings('tradeScreen.pickPaySys') }</Text>
                                                <View styles={styles.line} />
                                            </View>
                                        </TouchableWithoutFeedback>
                                        <PaymentSystem
                                            ref={ref => this.refPaymentSystem = ref}
                                            refOptionalData={this.refOptionalData}
                                            refCards={this.refCards}
                                            handleSetState={this.handleSetState}
                                            extendsFields={extendsFields}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedTradeWay={selectedTradeWay}
                                            selectedCryptocurrency={selectedCryptocurrency}
                                            selectedFiatCurrency={selectedFiatCurrency}
                                            selectedFiatTemplate={selectedFiatTemplate} />
                                    </View>
                                    <View style={styles.box}>
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                            <Text style={[styles.titleText, { textAlign: 'center' }]}>{ strings('tradeScreen.selectSum') }</Text>
                                        </TouchableWithoutFeedback>
                                        <FiatTemplate
                                            refLimits={this.refLimits}
                                            refAmount={this.refAmount}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedCryptocurrency={selectedCryptocurrency}
                                            selectedFiatCurrency={selectedFiatCurrency}
                                            selectedFiatTemplate={selectedFiatTemplate}
                                            handleSetState={this.handleSetState}
                                            handleGetTradeWay={this.handleGetTradeWay}
                                            handleConvertToPaymentCurrency={this.handleConvertToPaymentCurrency}/>
                                        <AmountInput
                                            ref={ref => this.refAmount = ref}
                                            selectedFiatTemplate={selectedFiatTemplate}
                                            extendsFields={extendsFields}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedFiatCurrency={selectedFiatCurrency}
                                            selectedCryptocurrency={selectedCryptocurrency}
                                            selectedAccount={selectedAccount}
                                            onFocus={this.amountInputOnFocus}
                                            submitTrade={this.handleSubmitTrade} />
                                        <Limits ref={ref => this.refLimits = ref}
                                                refAmount={this.refAmount}
                                                selectedFiatTemplate={selectedFiatTemplate}
                                                extendsFields={extendsFields}
                                                selectedPaymentSystem={selectedPaymentSystem}
                                                selectedFiatCurrency={selectedFiatCurrency}
                                                selectedCryptocurrency={selectedCryptocurrency}
                                                selectedAccount={selectedAccount}
                                                isLimitValid={isLimitValid}
                                                handleGetTradeWay={this.handleGetTradeWay}
                                                handleSetState={this.handleSetState} />
                                        <OptionalData
                                            ref={ref => this.refOptionalData = ref}
                                            self={this}
                                            inputOnFocus={this.amountInputOnFocus}
                                            handleSetState={this.handleSetState}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedCard={selectedCard} />
                                    </View>
                                    <View style={styles.box}>
                                        <Cards
                                            self={this}
                                            ref={ref => this.refCards = ref}
                                            selectedCard={selectedCard}
                                            extendsFields={extendsFields}
                                            selectedCryptocurrency={selectedCryptocurrency}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            handleSetState={this.handleSetState}/>
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
        marginTop: 10,
        marginHorizontal: 30,
        marginBottom: 40
    }
}
