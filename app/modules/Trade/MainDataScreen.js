/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    Text,
    View,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback, RefreshControl
} from 'react-native'

import Cards from './elements/Cards'
import Limits from './elements/Limits'
import AmountInput from './elements/AmountInput'
import FiatTemplate from './elements/FiatTemplate'
import OptionalData from './elements/OptionalData'
import PaymentSystem from './elements/PaymentSystem'
import FiatCurrencies from './elements/FiatCurrencies'
import Cryptocurrencies from './elements/Cryptocurrencies'

import NavigationTitleComponent from './elements/NavigationTitleComponent'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'

import firebase from 'react-native-firebase'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'


import NavStore from '../../components/navigation/NavStore'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../services/i18n'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import exchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'
import AsyncStorage from '@react-native-community/async-storage'
import Log from '../../services/Log/Log'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

let COUNT_MODAL_SELL = 0
let COUNT_MODAL_BUY = 0

class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            refreshing: false,
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
            show: false,
            sendAllModalOk: null
        }

    }

    async componentDidMount() {

        const { tradeType, isNewInterfaceSell, isNewInterfaceBuy } = this.props.exchangeStore

        if (tradeType === 'SELL') {
            if (!isNewInterfaceSell) {
                if (COUNT_MODAL_SELL === 0 || COUNT_MODAL_SELL === 5) {
                    showModal({
                        type: 'NEW_INTERFACE',
                        icon: null,
                        title: strings('modal.infoNewInterface.title'),
                        description: strings('modal.infoNewInterface.description'),
                        noCallback: async () => {
                            AsyncStorage.setItem('countModalSell', '1')
                            COUNT_MODAL_SELL = 1
                        }
                    }, () => {
                        AsyncStorage.setItem('isNewInterfaceSell', 'true')
                        COUNT_MODAL_SELL = 1
                        this.handleTryV3()
                    })
                } else {
                    AsyncStorage.setItem('countModalSell', (COUNT_MODAL_SELL + 1).toString())
                    COUNT_MODAL_SELL += 1
                }
            }
        } else if (tradeType === 'BUY') {
            if (!isNewInterfaceBuy) {
                if (COUNT_MODAL_BUY === 0 || COUNT_MODAL_BUY === 5) {
                    showModal({
                        type: 'NEW_INTERFACE',
                        icon: null,
                        title: strings('modal.infoNewInterface.title'),
                        description: strings('modal.infoNewInterface.description'),
                        noCallback: async () => {
                            AsyncStorage.setItem('countModalBuy', '1')
                            COUNT_MODAL_BUY = 1
                        }
                    }, () => {
                        AsyncStorage.setItem('isNewInterfaceBuy', 'true')
                        COUNT_MODAL_BUY = 1
                        this.handleTryV3()
                    })
                } else {
                    AsyncStorage.setItem('countModalBuy', (COUNT_MODAL_BUY + 1).toString())
                    COUNT_MODAL_BUY += 1
                }
            }
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        const { tradeType } = this.props.exchangeStore

        this.handleSetTradeWay(tradeType, 'STORAGE_CACHE')

    }

    handleTryV3 = () => {
        Log.log('EXC/Main.handleTryV3 init')
        Keyboard.dismiss()
        NavStore.goNext('TradeV3ScreenStack')
    }

    handleConvertToPaymentCurrency = (fromCurrency, amount) => amount


    handleSetRevert = async (tradeType, cacheType) => {
        return this.handleSetTradeWay(tradeType, cacheType, false)
    }

    handleSetTradeWay = async (tradeType, cacheType, resetSelected = true) => {

        setLoaderStatus(true)

        let initState = {
            selectedTradeWay: {}
        }
        if (resetSelected) {
            initState = {
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

                deviceToken: null
            }
        }

        if (tradeType === 'BUY') {

            initState = {
                ...initState,
                extendsFields: {
                    fieldForCryptocurrency: 'outCurrencyCode',
                    fieldForFiatCurrency: 'inCurrencyCode',
                    fieldForPaywayCode: 'inPaywayCode',
                    fieldForWayId: 'IN',
                    fieldForWayId2: 'OUT'
                }
            }

        } else {

            initState = {
                ...initState,
                sendAllModalOk: null,
                extendsFields: {
                    fieldForCryptocurrency: 'inCurrencyCode',
                    fieldForFiatCurrency: 'outCurrencyCode',
                    fieldForPaywayCode: 'outPaywayCode',
                    fieldForWayId: 'OUT',
                    fieldForWayId2: 'IN'
                }
            }
        }

        this.setState({
            ...initState
        }, () =>
            this.setState({
                show: true
            }, () => {
                setTimeout(() => {
                    setLoaderStatus(false)
                }, 50)
            })
        )

    }

    handleSetState = (field, state, callback) => {
        if (field === 'mass') {
            this.setState(state)
        } else if (typeof callback === 'undefined') {
            this.setState({ [field]: state })
        } else {
            this.setState({ [field]: state }, callback)
        }
    }

    handleGetTradeWay = (selectedCryptocurrency, selectedPaymentSystem) => {
        const {
            extendsFields
        } = this.state

        const tradeWays = this.props.exchangeStore.tradeApiConfig.exchangeWays

        const tradeWayList = []

        if (tradeWays) {
            let item
            for (item of tradeWays) {
                if (
                    item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode &&
                    item[extendsFields.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem &&
                    item[extendsFields.fieldForFiatCurrency] === selectedPaymentSystem.currencyCode
                ) {
                    tradeWayList.push(item)
                    break
                }
            }
        }
        return tradeWayList[0]
    }

    handleValidateSubmit = async () => {
        const {
            selectedCryptocurrency,
            selectedFiatTemplate,
            selectedPaymentSystem,
            selectedFiatCurrency
        } = this.state

        const { exchangeStore } = this.props

        if (typeof selectedCryptocurrency.currencyCode === 'undefined') throw new Error(strings('tradeScreen.modalError.selectCryptocurrency'))


        if (typeof selectedFiatCurrency.cc === 'undefined') throw new Error(exchangeStore.tradeType === 'BUY' ? strings('tradeScreen.modalError.selectWhatYouGive') : strings('tradeScreen.modalError.selectWhatYouGet'))

        if (typeof selectedPaymentSystem.paymentSystem === 'undefined') throw new Error(strings('tradeScreen.modalError.selectPaymentSystem'))

        // if (!selectedFiatTemplate) throw new Error(strings('tradeScreen.modalError.selectFiatTemplate'))

        if (!this.refLimits.handleValidateLimits()) {
            Keyboard.dismiss()
            throw new Error(strings('tradeScreen.modalError.limit'))
        }

        if (this.refOptionalData.getState().enabled)
            await this.refOptionalData.validateData()

        if (this.refCards.getState().enabled) {
            this.refCards.validate()
        }
    }

    handleRefresh = async () => {

        this.setState({
            refreshing: true
        })

        await exchangeActions.init()

        this.setState({
            refreshing: false
        })
    }

    handleSubmitTrade = async () => {
        setTimeout(() => {
            this.actualHandleSubmitTrade()
        }, 100)

    }

    actualHandleSubmitTrade = async (forceSellAll = false, fromModal = false) => {

        if (forceSellAll) {
            await this.refAmount.handleSellAll()
        }

        const {
            selectedCryptocurrency,
            selectedFiatCurrency,
            selectedPaymentSystem,
            selectedCard,
            selectedAccount
        } = this.state

        const { tradeType } = this.props.exchangeStore
        const tradeWay = this.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)
        const amount = this.refAmount.handleGetAmountEquivalent()
        try {
            await this.handleValidateSubmit()
        } catch (e) {
            if (e.message.indexOf('UI_') === 0) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('tradeScreen.modalError.' + e.message + '.title'),
                    description: strings('tradeScreen.modalError.' + e.message + '.desc')
                })
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            }
            return
        }
        try {
            if (tradeType === 'SELL' && fromModal === false) {

                const limitPercent = 0.95
                const limitUSD = 2

                const percentCheck = BlocksoftUtils.diff(BlocksoftUtils.div(amount.amountEquivalentInCrypto, selectedAccount.balancePretty), limitPercent)
                const diffCheck = BlocksoftUtils.diff(selectedAccount.balancePretty, amount.amountEquivalentInCrypto)
                let diffUSD = 9999999
                if (typeof selectedCryptocurrency.currencyRateJson.USD !== 'undefined') {
                    diffUSD = BlocksoftUtils.add(RateEquivalent.mul({ value: diffCheck, currencyCode: selectedCryptocurrency.currencyCode, basicCurrencyRate: selectedCryptocurrency.currencyRateJson.USD }), limitUSD)
                }
                console.log('input', { amountCrypto: amount.amountEquivalentInCrypto, amountFiat: amount.amountEquivalentInFiat, percentCheck, diffCheck, diffUSD, useAll: amount.useAllFunds })
                if (amount.useAllFunds === false && percentCheck * 1 > 0 || diffUSD * 1 < 0) {
                    showModal({
                        type: 'YES_NO_MODAL',
                        icon: 'WARNING',
                        title: strings('modal.titles.attention'),
                        description: strings('modal.infoSendAllModal.description', { coin: selectedCryptocurrency.currencyName }),
                        reverse: true,
                        noCallback: () => {
                            this.actualHandleSubmitTrade(true, true)
                        }
                    }, () => {
                        this.actualHandleSubmitTrade(false, true)
                    })
                    return
                }
            }
        } catch (e) {
            Log.log('EXC/Main modalSellAll error ' + e.message)
        }

        NavStore.goNext('ConfirmScreen', {
            orderData: {
                checkTmp: true,
                selectedCryptocurrency,
                selectedFiatCurrency,
                selectedPaymentSystem,
                selectedCard,
                selectedAccount,
                tradeWay,
                amount,
                uniqueParams: this.state.uniqueParams
            }
        })
    }

    amountInputOnFocus = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ x: 0, y: 370, animated: true })
            } catch (e) {
            }
        }, 400)
    }

    render() {
        UpdateOneByOneDaemon.pause()
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
                    self={this}
                    handleSetState={this.handleSetState}
                    navigation={this.props.navigation}
                    titleComponent={<NavigationTitleComponent
                        handleSetRevert={this.handleSetRevert}
                        handleSetState={this.handleSetState}
                        exchangeStore={exchangeStore} />}
                />
                <KeyboardAwareView>
                    {
                        show ?
                            <ScrollView
                                ref={(ref) => this.scrollView = ref}
                                keyboardShouldPersistTaps={'always'}
                                showsVerticalScrollIndicator={false}
                                style={styles.wrapper__scrollView}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={this.state.refreshing}
                                        onRefresh={this.handleRefresh}
                                    />
                                }>
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                    {
                                        exchangeStore.tradeType === 'BUY' ?
                                            <View style={styles.top}>
                                                <View style={styles.top__item}>
                                                    <Text
                                                        style={[styles.titleText, typeof selectedCryptocurrency.currencyCode === 'undefined' ? styles.titleText_disabled : null]}>
                                                        {strings('tradeScreen.youGive')}
                                                    </Text>
                                                    <FiatCurrencies
                                                        ref={ref => this.refFiatCurrencies = ref}
                                                        selectedFiatCurrency={selectedFiatCurrency}
                                                        extendsFields={extendsFields}
                                                        selectedCryptocurrency={selectedCryptocurrency}
                                                        selectedPaymentSystem={selectedPaymentSystem}
                                                        navigation={navigation}
                                                        handleSetState={this.handleSetState} />
                                                </View>
                                                <View style={styles.top__item_space} />
                                                <View style={styles.top__item}>
                                                    <Text style={styles.titleText}>
                                                        {strings('tradeScreen.youGet')}
                                                    </Text>
                                                    <Cryptocurrencies
                                                        self={this}
                                                        ref={ref => this.refCryptocurrencies = ref}
                                                        refFiatCurrencies={this.refFiatCurrencies}
                                                        selectedCryptocurrency={selectedCryptocurrency}
                                                        selectedAccount={selectedAccount}
                                                        handleSetState={this.handleSetState}
                                                        extendsFields={extendsFields}
                                                        navigation={navigation} />
                                                </View>
                                            </View>
                                            :
                                            <View style={styles.top}>
                                                <View style={styles.top__item}>
                                                    <Text
                                                        style={[styles.titleText, typeof selectedCryptocurrency.currencyCode === 'undefined' ? styles.titleText_disabled : null]}>
                                                        {strings('tradeScreen.youGive')}
                                                    </Text>
                                                    <Cryptocurrencies
                                                        ref={ref => this.refCryptocurrencies = ref}
                                                        refFiatCurrencies={this.refFiatCurrencies}
                                                        selectedCryptocurrency={selectedCryptocurrency}
                                                        selectedAccount={selectedAccount}
                                                        handleSetState={this.handleSetState}
                                                        extendsFields={extendsFields}
                                                        navigation={navigation} />
                                                </View>
                                                <View style={styles.top__item_space} />
                                                <View style={styles.top__item}>
                                                    <Text style={styles.titleText}>
                                                        {strings('tradeScreen.youGet')}
                                                    </Text>
                                                    <FiatCurrencies
                                                        ref={ref => this.refFiatCurrencies = ref}
                                                        selectedFiatCurrency={selectedFiatCurrency}
                                                        extendsFields={extendsFields}
                                                        selectedCryptocurrency={selectedCryptocurrency}
                                                        selectedPaymentSystem={selectedPaymentSystem}
                                                        navigation={navigation}
                                                        handleSetState={this.handleSetState} />
                                                </View>
                                            </View>
                                    }

                                </TouchableWithoutFeedback>

                                <View style={styles.middle}>
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <View>
                                            <Text
                                                style={[styles.titleText, { marginLeft: 30 }]}>{exchangeStore.tradeType === 'BUY' ? strings('tradeScreen.pickPaySys') : strings('tradeScreen.pickPaySysSell')}</Text>
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
                                    <View style={{ height: 0, maxHeight: 0, overflow: 'hidden' }}>
                                        <FiatTemplate
                                            refLimits={this.refLimits}
                                            refAmount={this.refAmount}
                                            selectedPaymentSystem={selectedPaymentSystem}
                                            selectedCryptocurrency={selectedCryptocurrency}
                                            selectedFiatCurrency={selectedFiatCurrency}
                                            selectedFiatTemplate={selectedFiatTemplate}
                                            handleSetState={this.handleSetState}
                                            handleGetTradeWay={this.handleGetTradeWay}
                                            handleConvertToPaymentCurrency={this.handleConvertToPaymentCurrency} />
                                    </View>
                                    <AmountInput
                                        ref={ref => this.refAmount = ref}
                                        selectedFiatTemplate={selectedFiatTemplate}
                                        extendsFields={extendsFields}
                                        selectedPaymentSystem={selectedPaymentSystem}
                                        selectedFiatCurrency={selectedFiatCurrency}
                                        selectedCryptocurrency={selectedCryptocurrency}
                                        selectedAccount={selectedAccount}
                                        onFocus={this.amountInputOnFocus}
                                        submitTrade={this.handleSubmitTrade}
                                    />
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
                                        exchangeStore={exchangeStore}
                                        selectedPaymentSystem={selectedPaymentSystem}
                                        selectedCard={selectedCard} 
                                        />
                                </View>
                                <View style={styles.box}>
                                    <Cards
                                        self={this}
                                        ref={ref => this.refCards = ref}
                                        selectedCard={selectedCard}
                                        extendsFields={extendsFields}
                                        selectedCryptocurrency={selectedCryptocurrency}
                                        selectedPaymentSystem={selectedPaymentSystem}
                                        handleSetState={this.handleSetState} />
                                </View>

                                <View style={styles.btn}>
                                    <Button press={this.handleSubmitTrade}>
                                        {submitBtnFix}
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
        exchangeStore: state.exchangeStore
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
        marginTop: 80
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',

        width: '100%',
        paddingHorizontal: 15
    },
    top__item: {
        flex: 1
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
