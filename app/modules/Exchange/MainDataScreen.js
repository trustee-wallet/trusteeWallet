/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Text, View, ScrollView, Keyboard, TouchableWithoutFeedback, RefreshControl } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import ExchangeOutCurrency from './elements/ExchangeOutCurrency'
import ExchangeInCurrency from './elements/ExchangeInCurrency'
import ExchangePaymentSystem from './elements/ExchangePaymentSystem'
import ExchangeAmountInput from './elements/ExchangeAmountInput'
import ExchangeLimits from './elements/ExchangeLimits'
import ExchangeNavigationTitleComponent from './elements/ExchangeNavigationTitleComponent'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../services/i18n'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import exchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'
import AsyncStorage from '@react-native-community/async-storage'

let CACHE_INIT_KEY = ''
let COUNT_MODAL = 0

const EXTENDS_FIELDS = {
    fieldForInCurrency: 'inCurrencyCode',
    fieldForOutCurrency: 'outCurrencyCode',
    fieldForPaywayCode: 'outPaywayCode',
    fieldForWayId: 'OUT',
    fieldForWayId2: 'IN'
}

class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            refreshing: false,
            selectedInCurrency: {},
            selectedInAccount: {},
            selectedPaymentSystem: '',
            selectedOutCurrency: {},
            selectedOutAccount: {},

            prevInAccount: {},
            prevOutAccount: {},

            uniqueParams: {},

            selectedTradeWay: {},
            fieldForPaywayCode: '',

            deviceToken: null,
            show: false,
            inited: false,
            isNewInterface: false
        }
    }

    async componentDidMount() {
        if (COUNT_MODAL === 0 || COUNT_MODAL === 5){
            showModal({
                type: 'NEW_INTERFACE',
                icon: null,
                title: strings('modal.infoNewInterface.title'),
                description: strings('modal.infoNewInterface.description'),
                noCallback: async () => {
                    AsyncStorage.setItem('countModal', '1')
                    COUNT_MODAL = 1
                }
            },() => {
                AsyncStorage.setItem('isNewInterface', 'true')
                COUNT_MODAL = 1
                this.handleTryV3()
            })
        } else {
            AsyncStorage.setItem('countModal', (COUNT_MODAL + 1).toString())
            COUNT_MODAL += 1
        }
    }

    init = async () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        setLoaderStatus(true)

        const initState = {
            selectedInCurrency: {},
            selectedInAccount: {},
            selectedPaymentSystem: '',
            selectedOutCurrency: {},
            selectedOutAccount: {},
            prevInAccount: {},
            prevOutAccount : {},

            uniqueParams: {},

            selectedTradeWay: {},
            fieldForPaywayCode: '',

            deviceToken: null
        }

        this.setState({
                ...initState
            }, () => {
                setTimeout(() => {
                    this.setState({
                        show: true
                    }, () => {
                        setTimeout(() => {
                            setLoaderStatus(false)
                        }, 10)
                    })
                }, 10)
            }
        )

    }

    handleSetState = (field, state) => {
        if (field === 'mass') {
            this.setState(state)
        } else {
            this.setState({ [field]: state })
        }
    }

    handleSetRevert = () => {
        const {
            selectedInCurrency,
            selectedOutCurrency,
            selectedInAccount,
            selectedOutAccount
        } = this.state

        this.setState({
            selectedOutCurrency : selectedInCurrency,
            selectedInCurrency : selectedOutCurrency,
            selectedInAccount : selectedOutAccount,
            selectedOutAccount : selectedInAccount,
            prevInAccount : selectedInAccount,
            prevOutAccount : selectedOutAccount
        })

        console.log('setPrevIn', selectedInAccount)
    }

    handleGetTradeWay = (selectedInCurrency, selectedPaymentSystem) => {
        const tradeApiConfig = this.props.exchangeStore.exchangeApiConfig

        if (typeof EXTENDS_FIELDS === 'undefined' || typeof EXTENDS_FIELDS.fieldForInCurrency === 'undefined') {
            return false
        }

        const tradeWayList = []

        if (tradeApiConfig) {
            let item
            for (item of tradeApiConfig) {
                if (typeof item === 'undefined' || !item) continue
                if (item[EXTENDS_FIELDS.fieldForInCurrency] === selectedInCurrency.currencyCode &&
                    item[EXTENDS_FIELDS.fieldForOutCurrency] === selectedPaymentSystem.currencyCode &&
                    item[EXTENDS_FIELDS.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem
                ) {
                    tradeWayList.push(item)
                    break
                }
            }
        }
        return tradeWayList[0]
    }

    handleValidateSubmit = async () => {
        Log.log('EXC/Main.handleValidateSubmit init')
        const {
            selectedInCurrency,
            selectedOutCurrency,
            selectedPaymentSystem
        } = this.state

        if (typeof selectedInCurrency.currencyCode === 'undefined') throw new Error(strings('tradeScreen.modalError.selectCryptocurrency'))

        if (typeof selectedOutCurrency === 'undefined') throw new Error(strings('tradeScreen.modalError.selectWhatYouGet'))

        if (typeof selectedPaymentSystem.paymentSystem === 'undefined') throw new Error(strings('tradeScreen.modalError.selectPaymentSystem'))

        if (!this.refLimits.handleValidateLimits()) {
            Keyboard.dismiss()
            throw new Error(strings('tradeScreen.modalError.limit'))
        }
    }

    handleTryV3 = async () => {
        Log.log('EXC/Main.handleTryV3 init')
        Keyboard.dismiss()
        NavStore.goNext('MainV3DataScreen')
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

    actualHandleSubmitTrade = async () => {
        Log.log('EXC/Main.handleSubmitTrade init')
        const {
            selectedInCurrency,
            selectedOutCurrency,
            selectedPaymentSystem,
            selectedInAccount,
            selectedOutAccount,
            prevInAccount,
            prevOutAccount
        } = this.state

        const tradeWay = this.handleGetTradeWay(selectedInCurrency, selectedPaymentSystem)
        const amount = this.refAmount.handleGetAmountEquivalent()
        try {
            await this.handleValidateSubmit()

        } catch (e) {
            Log.log('EXC/Main.handleSubmitTrade error ' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
            return
        }

        NavStore.goNext('ExchangeConfirmScreen', {
            orderData: {
                selectedInCurrency,
                selectedOutCurrency,
                selectedPaymentSystem,
                selectedInAccount,
                selectedOutAccount,
                prevInAccount,
                prevOutAccount,
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

        this.init()

        const {
            selectedInCurrency,
            selectedOutCurrency,
            selectedInAccount,
            selectedOutAccount,
            selectedPaymentSystem,
            selectedTradeWay,
            isLimitValid,
            show
        } = this.state

        const { navigation } = this.props
        const submitBtnFix = strings('exchangeScreen.exchangeBtn')

        firebase.analytics().setCurrentScreen('Exchange.MainScreen.Exchange')

        return (
            <View style={styles.wrapper}>
                <Navigation
                    self={this}
                    handleSetState={this.handleSetState}
                    navigation={this.props.navigation}
                    titleComponent={<ExchangeNavigationTitleComponent
                        handleSetRevert={this.handleSetRevert}
                        selectedInCurrency={selectedInCurrency}
                        selectedOutCurrency={selectedOutCurrency}
                    />}
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

                                    <View style={styles.top}>
                                        <View style={styles.top__item}>
                                            <Text
                                                style={[styles.titleText, typeof selectedInCurrency.currencyCode === 'undefined' ? styles.titleText_disabled : null]}>
                                                {strings('tradeScreen.youGive')}
                                            </Text>
                                            <ExchangeInCurrency
                                                ref={ref => this.refInCurrency = ref}
                                                refOutCurrency={this.refOutCurrency}
                                                selectedInCurrency={selectedInCurrency}
                                                selectedInAccount={selectedInAccount}
                                                handleSetState={this.handleSetState}
                                                extendsFields={EXTENDS_FIELDS}
                                                navigation={navigation}/>
                                        </View>
                                        <View style={styles.top__item_space}/>
                                        <View style={styles.top__item}>
                                            <Text style={styles.titleText}>
                                                {strings('tradeScreen.youGet')}
                                            </Text>
                                            <ExchangeOutCurrency
                                                ref={ref => this.refOutCurrency = ref}
                                                selectedOutCurrency={selectedOutCurrency}
                                                selectedOutAccount={selectedOutAccount}
                                                extendsFields={EXTENDS_FIELDS}
                                                selectedInCurrency={selectedInCurrency}
                                                selectedPaymentSystem={selectedPaymentSystem}
                                                navigation={navigation}
                                                handleSetState={this.handleSetState}/>
                                        </View>
                                    </View>


                                </TouchableWithoutFeedback>

                                <View style={styles.middle}>
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <View>
                                            <Text
                                                style={[styles.titleText, { marginLeft: 30 }]}>{strings('exchangeScreen.pickProvider')}</Text>
                                            <View styles={styles.line}/>
                                        </View>
                                    </TouchableWithoutFeedback>
                                    <ExchangePaymentSystem
                                        ref={ref => this.refPaymentSystem = ref}
                                        refOptionalData={this.refOptionalData}
                                        handleSetState={this.handleSetState}
                                        extendsFields={EXTENDS_FIELDS}
                                        selectedPaymentSystem={selectedPaymentSystem}
                                        selectedTradeWay={selectedTradeWay}
                                        selectedInCurrency={selectedInCurrency}
                                        selectedOutCurrency={selectedOutCurrency}/>
                                </View>

                                <View style={styles.box}>

                                    <ExchangeAmountInput
                                        ref={ref => this.refAmount = ref}
                                        extendsFields={EXTENDS_FIELDS}
                                        selectedPaymentSystem={selectedPaymentSystem}
                                        selectedInCurrency={selectedInCurrency}
                                        selectedOutCurrency={selectedOutCurrency}
                                        selectedInAccount={selectedInAccount}
                                        selectedOutAccount={selectedOutAccount}
                                        onFocus={this.amountInputOnFocus}
                                        submitTrade={this.handleSubmitTrade}/>

                                    <ExchangeLimits ref={ref => this.refLimits = ref}
                                                    refAmount={this.refAmount}
                                                    extendsFields={EXTENDS_FIELDS}
                                                    selectedPaymentSystem={selectedPaymentSystem}
                                                    selectedInCurrency={selectedInCurrency}
                                                    selectedOutCurrency={selectedOutCurrency}
                                                    selectedInAccount={selectedInAccount}
                                                    selectedOutAccount={selectedOutAccount}
                                                    isLimitValid={isLimitValid}
                                                    handleGetTradeWay={this.handleGetTradeWay}
                                                    handleSetState={this.handleSetState}/>

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
        selectedInAccount: state.mainStore.selectedInAccount,
        selectedOutAccount: state.mainStore.selectedOutAccount,
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
    btnTop: {
        marginTop: 40,
        marginHorizontal: 30,
        marginBottom: 10
    },
    btn: {
        marginTop: 10,
        marginHorizontal: 30,
        marginBottom: 40
    }
}
