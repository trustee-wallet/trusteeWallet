import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextInput, Image, Text, TouchableOpacity, View, ScrollView, Dimensions, Platform, Keyboard, Clipboard } from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'
import Carousel, { Pagination } from 'react-native-snap-carousel'

import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'

import NavStore from '../../components/navigation/NavStore'

import { setExchangeData, setExchangeType } from '../../appstores/Actions/ExchangeStorage'
import { normalizeWithDecimals } from '../../services/utils'
import Key from 'react-native-vector-icons/Ionicons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { getEquivalent } from '../../services/Exchange/Exchange'

import { setSendData } from '../../appstores/Actions/SendActions'
import axios from 'axios'

import Card from 'react-native-vector-icons/FontAwesome'
import { hideModal, showModal } from '../../appstores/Actions/ModalActions'

import _ from 'lodash'
import { setCards, setLoaderStatus, deleteCard } from '../../appstores/Actions/MainStoreActions'
import accountDS from '../../appstores/DataSource/Account/Account'

import { strings } from '../../../app/services/i18n'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Entypo from 'react-native-vector-icons/Entypo'

import BlocksoftTransaction from '../../../crypto/actions/BlocksoftTransaction/BlocksoftTransaction'
import BlocksoftBalances from '../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import firebase from 'react-native-firebase'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'

import countriesDict from '../../assets/jsons/other/country-codes'
import currenciesDict from '../../assets/jsons/other/country-by-currency-code'

import CurrencyIcon from '../../components/elements/CurrencyIcon'

import Tooltip from 'react-native-walkthrough-tooltip'

import config from '../../config/config'

const { width: WIDTH } = Dimensions.get('window')

let baseUrl, exchangeMode, apiEndpoints

class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            cryptocurrencyList: [],

            amount: 0,
            selectedEstimate: 'CRYPTO',

            inputError: false,
            useAllFunds: false,

            equivalentForCrypto: '0',
            equivalentForFiat: '0',
            sendToApiFiat: '0',
            sendToApiCrypto: '0',
            typingTimeout: 0,
            sliderActiveSlide: 0,
            fcmToken: '',

            selectedCryptocurrency: {},
            selectedAccount: {},
            showSlider: false,
            selectedExchangeRange: {},
            exchangeRange: {},
            exchangeApiConfig: {},
            supportedCountries: [],
            cashbackToken: '',

            amountForCheckLimits: 0,

            cards: [],

            exchangeLocalCurrency: '',
            providerFee: {
                withdrawFee: 0
            },
            equivalentData: {
                networkFee: {
                    crypto: 0,
                    fiat: 0
                },
                sendToApiFiat: 0,
                trusteeFee: {
                    equivalent: 0,
                    percentage: 0
                }
            },



            showDetail: false
        }

        this.handleAddCard = this.handleAddCard.bind(this)
    }

    async componentWillMount() {
        this.init()
    }

    init = async () => {
        //INFO: init exchange config

        exchangeMode = config.exchange.mode
        apiEndpoints = config.exchange.apiEndpoints

        baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL



        //INFO: if user redirected from some screen, set currencyCode from navigation param
        const { navigation } = this.props
        let currencyCode = navigation.getParam('currencyCode')
        currencyCode = typeof currencyCode == 'undefined' ? 'ETH' : currencyCode

        setLoaderStatus(true)

        const { currencies, selectedWallet } = this.props.main
        const { exchangeType } = this.props.exchange
        const { wallet_hash } = selectedWallet
        let getDefaultAccountRes
        let defaultCryptocurrency
        let fcmToken



        let cryptocurrencyList = JSON.parse(JSON.stringify(currencies))
        defaultCryptocurrency = _.find(cryptocurrencyList, { currencyCode })

        getDefaultAccountRes = await accountDS.getAccountData(wallet_hash, currencyCode)

        fcmToken = await AsyncStorage.getItem('fcmToken')

        await this.getExchangeData()

        const cashbackToken = await AsyncStorage.getItem('cashbackToken')

        this.setState({
            cashbackToken,
            selectedEstimate: exchangeType === 'BUY' ? 'FIAT' : 'CRYPTO',
            fcmToken,
            selectedCryptocurrency: defaultCryptocurrency,
            selectedAccount: getDefaultAccountRes.array[0],
            sliderActiveSlide: this.props.cards.length - 1,
        })

        setLoaderStatus(false)
    }

    componentWillReceiveProps(props) {

        const { cards: newCards } = props
        const { cards: oldCards } = this.props

        if (newCards.length != oldCards.length) {
            const index = newCards.length - 1

            setTimeout(() => {

                this._carousel.snapToItem(index, true, true)

                this.prepareCards()

                this.setState({
                    sliderActiveSlide: index
                })
            }, 1000)
        }
    }

    prepareCards = () => {
        const { cards } = this.props
        const { exchangeType } = this.props.exchange
        const { supportedCountries } = this.state

        let tmpCards = JSON.parse(JSON.stringify(cards))

        tmpCards = tmpCards.map(item => {

            let tmpCard = JSON.parse(JSON.stringify(item))

            if(tmpCard.type === 'ADD'){
                return tmpCard
            }

            const isSupported = _.includes(supportedCountries, tmpCard.country_code)

            const nativeCardCurrency = _.find(countriesDict, { iso: item.country_code })

            if((exchangeType === 'SELL' && tmpCard.currency !== nativeCardCurrency.currencyCode) || !isSupported){
                tmpCard.supported = false
            } else {
                tmpCard.supported = true
            }

            return tmpCard
        })

        this.setState({
            showSlider: false
        })

        this.setState({
            cards: tmpCards,
            showSlider: true
        }, () => {
            this.handleOnSnapToItem()
        })
    }

    onScrollView = () => {
        Keyboard.dismiss()
    }

    getExchangeData = async () => {

        const { exchangeType } = this.props.exchange
        const { navigation } = this.props
        let currencyCode = navigation.getParam('currencyCode')
        currencyCode = typeof currencyCode == 'undefined' ? 'ETH' : currencyCode

        try {

            const res = navigation.getParam('exchangeApiConfig')

            const { currencies } = this.props.main
            const { exchangeRange, providerFee } = res.data

            const currencyRangeMin = _.find(exchangeRange.min, { symbol: currencyCode.toLowerCase() })
            const currencyRangeMax = _.find(exchangeRange.max, { symbol: currencyCode.toLowerCase() })
            const tmpProviderFee = _.find(exchangeType === 'BUY' ? providerFee.buy : providerFee.sell, { symbol: currencyCode.toUpperCase() })

            let cryptocurrencyList = JSON.parse(JSON.stringify(currencies))

            let tmpCurrenciesToState = []

            if(exchangeType === 'BUY'){
                const buySettings = res.data.buy

                for(let i = 0; i < buySettings.supportedCrypto.length; i++){
                    const currency = cryptocurrencyList.find(item => item.currencyCode === buySettings.supportedCrypto[i])
                    if(typeof currency != 'undefined') tmpCurrenciesToState.push(currency)
                }
            } else {
                const sellSettings = res.data.sell

                for(let i = 0; i < sellSettings.supportedCrypto.length; i++){
                    const currency = cryptocurrencyList.find(item => item.currencyCode === sellSettings.supportedCrypto[i])
                    if(typeof currency != 'undefined') tmpCurrenciesToState.push(currency)
                }
            }

            this.setState({
                cryptocurrencyList: tmpCurrenciesToState,
                exchangeRange,
                selectedExchangeRange: {
                    symbol: currencyRangeMax.symbol.toUpperCase(),
                    min: exchangeType === 'BUY' ? currencyRangeMin.buy : currencyRangeMin.sell,
                    max: exchangeType === 'BUY' ? currencyRangeMax.buy : currencyRangeMax.sell,
                    perDay: exchangeType === 'BUY' ? currencyRangeMax.perDay : currencyRangeMax.perDay,
                },
                providerFee: tmpProviderFee,
                supportedCountries: exchangeType === 'BUY' ? res.data.buy.supportedCountries : res.data.sell.supportedCountries,
                exchangeApiConfig: res.data,
            }, async() => {
                //INFO: prepare cards to state
                await setCards()
                this.prepareCards()
            })
        } catch (e) {
            Log.err('Exchange.MainDataScreen.getExchangeData error', e)
        }
    }

    handleTransferAll = async () => {


        setLoaderStatus(true)

        const {
            wallet_hash: walletHash
        } = this.props.wallet

        const { addressForEstimateSellAll } = this.state.exchangeApiConfig

        const {
            address,
            currency_code: currencyCode,
            derivation_path: derivationPath
        } = this.state.selectedAccount

        const tmpAddressForEstimate = currencyCode === 'ETH' || currencyCode === 'ETH_TRUE_USD'  ? addressForEstimateSellAll : address

        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')


        Log.log('Exchange.MainDataScreen.handleTransferAll start')
        try {

            const balanceRaw = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address)).getBalance()

            const fees = await (
                BlocksoftTransaction
                    .setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(address)
                    .setAddressTo(tmpAddressForEstimate)
                    .setTransferAll(true)
                    .setAmount(balanceRaw)
                ).getFeeRate()

            const current = await (
                BlocksoftBalances
                    .setCurrencyCode(currencyCode)
                    .setAddress(address)
                    .setFee(fees[2].feeForTx)
                ).getTransferAllBalance()

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePrettie(current)

            this.setState({
                amount: (1 * amount).toString(),
                equivalentForFiat: '0',
                equivalentForCrypto: '0',
                selectedEstimate: 'CRYPTO'
            }, () => {
                this.handleGetEq()
            })

            this.setState({
                useAllFunds: true
            })

        } catch (e) {
            Log.err('Exchange.MainDataScreen.handleTransferAll error', e)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.qrScanner.sorry'),
                description: e.message,
                error: e
            })
        }

        setLoaderStatus(false)

    }

    handleSubmit = async () => {

        try {

            const {
                fcmToken,
                selectedExchangeRange,
                supportedCountries,
                amount,
                useAllFunds,
                selectedEstimate,
                cashbackToken,
                amountForCheckLimits,
            } = this.state

            console.log('MainDataScreen.handleSubmit')
            console.log("\n\n\n\n\n\n\n\n\n", this.state)
            const { exchangeType } = this.props.exchange
            const { address, currency_code } = this.state.selectedAccount
            const cards = this.state.cards
            const index = this._carousel.currentIndex
            let selectedCard = {}
            let validate = true


            const { data: res } = await axios.post(`${baseUrl}/get-server-data`)

            if ((res.data.buyProvider != this.state.exchangeApiConfig.buyProvider && exchangeType == 'BUY') || (res.data.sellProvider != this.state.exchangeApiConfig.sellProvider && exchangeType == 'SELL')) {

                const title = strings('exchange.providerChanged.title')
                const description = strings('exchange.providerChanged.description')

                showModal({
                    type: 'CHOOSE_INFO_MODAL',
                    data: {
                        title,
                        description,
                        declineCallback: () => {
                            MarketingEvent.logEvent('exchange_init_modal_decline', { title, description })
                            NavStore.goBack()
                            hideModal()
                        },
                        acceptCallback: () => {
                            MarketingEvent.logEvent('exchange_init_modal_accept', { title, description })
                            NavStore.goBack()
                            hideModal()
                        }
                    }
                })
                return true
            }

            selectedCard = cards[index]

            if (!index || !selectedCard.supported) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.exchange.descriptionCard')
                })
                validate = false
                Log.log('Exchange.MainDataScreen.handleSubmit not valid by card')
                return
            }
            const isSupported = supportedCountries.find(item => selectedCard.country_code === item)

            if(typeof isSupported == 'undefined'){
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.exchange.descriptionCard')
                })
                validate = false
                Log.log('Exchange.MainDataScreen.handleSubmit not valid by card')
                return
            }

            if (amountForCheckLimits < selectedExchangeRange.min || amountForCheckLimits == 0 || amountForCheckLimits === 'NaN') {
                this.setState({
                    inputError: true
                })
                validate = false
                Log.log('Exchange.MainDataScreen.handleSubmit not valid by min ' + amountForCheckLimits + ' < ' + selectedExchangeRange.min)

            }

            if (amountForCheckLimits > selectedExchangeRange.max) {
                this.setState({
                    inputError: true
                })
                validate = false
                Log.log('Exchange.MainDataScreen.handleSubmit not valid by max ' + amountForCheckLimits + ' > ' + selectedExchangeRange.max)

            }

            if (!(validate && this.state.sendToApiCrypto != 0)) {
                return
            }
            if (exchangeType === 'BUY') {

                const data = {
                    address,
                    countryCode: selectedCard.country_code,
                    cashbackToken: cashbackToken,
                    sendToApiCrypto: +this.state.sendToApiCrypto,
                    sendToApiFiat: +this.state.sendToApiFiat,
                    currency: currency_code,

                    cardNumber: selectedCard.number,
                    expirationDate: selectedCard.expiration_date,
                    deviceToken: fcmToken
                }

                let logData = JSON.parse(JSON.stringify(data))
                logData.cardNumber = '***' + data.cardNumber.substr(data.cardNumber.length - 6)
                MarketingEvent.logEvent('exchange_main_screen_buy_to_sms', logData)
                MarketingEvent.startBuy(logData)
                Log.log('Exchange.MainDataScreen.handleSubmit.BUY sent to sms', logData)

                setExchangeData(data)
                NavStore.goNext('SMSCodeScreen')

            } else {

                setLoaderStatus(true)

                const data = {
                    amount_crypto: +this.state.sendToApiCrypto,
                    amount_fiat: +this.state.sendToApiFiat,
                    currency: currency_code,
                    card_number: selectedCard.number,
                    device_token: fcmToken,
                    locale: this.props.settingsStore.data.language.split('-')[0],
                    country_code: selectedCard.country_code,
                }

                cashbackToken != null ? data.cashback_token = cashbackToken : null

                Keyboard.dismiss()

                Log.log('Exchange.MainDataScreen.handleSubmit.SELL send to api', data)

                const { data: res } = await axios.post(`${baseUrl}/create-sale`, data)

                if (res.state === 'success') {
                    let value = selectedEstimate == 'CRYPTO' ? amount.toString() : this.state.sendToApiCrypto.toString()

                    let logData = data
                    logData.to = res.data.address
                    logData.value = value
                    logData.card_number = '***' + logData.card_number.substr(logData.card_number.length - 6)
                    MarketingEvent.logEvent('exchange_main_screen_sell', logData)
                    MarketingEvent.startSell(logData)
                    Log.log('Exchange.MainDataScreen.handleSubmit.SELL will redirect to Send', logData)

                    setSendData({
                        disabled: true,
                        address: res.data.address,
                        value,
                        account: this.state.selectedAccount,
                        cryptocurrency: this.state.selectedCryptocurrency,
                        description: strings('send.descriptionExchange'),
                        useAllFunds
                    })

                    NavStore.goNext('SendScreen')
                } else {
                    setLoaderStatus(false)

                    Log.err('Exchange.MainDataScreen.handleSubmit.SELL error res', res)

                    showModal({
                        type: 'INFO_MODAL',
                        icon: false,
                        title: strings('modal.exchange.sorry'),
                        description: res.errorMsg[0].msg
                    })
                }

                setLoaderStatus(false)
            }
        } catch (e) {

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }
    }

    handleInput = async (data) => {

        const { useAllFunds } = this.state

        if (useAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }

        let { name, value } = data

        value = normalizeWithDecimals(value, 10)

        if (this.state.typingTimeout) {
            clearTimeout(this.state.typingTimeout)
        }

        this.setState({
            [name]: value,
            typingTimeout: setTimeout(async () => {
                this.handleGetEq({ amount: +value })
            }, 1000)
        })
    }

    handleGetEq = async (data) => {

        const { exchangeLocalCurrency } = this.state
        const { local_currency } = this.props.settingsStore.data
        const cards = this.state.cards
        const index = this._carousel.currentIndex
        let selectedCard

        const { currencyCode } = this.state.selectedCryptocurrency
        const { selectedEstimate, amount, selectedExchangeRange } = this.state
        const { exchangeType } = this.props.exchange
        const self = this
        let res = {}

        selectedCard = cards[index]

        const sendAmount = typeof data != 'undefined' ? data.amount : amount

        const tmpCountry = countriesDict.find(item => selectedCard.currency === item.currencyCode)

        const dataForEq = {
            amount: sendAmount == '' ? 0 : selectedEstimate === 'FIAT' ? (+sendAmount * +(exchangeLocalCurrency.code === 'UAH' || ( exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB') ? 1 : exchangeLocalCurrency.rate)).toFixed(2) : +sendAmount,
            currency: currencyCode,
            type: selectedEstimate.toLowerCase(),
            side: exchangeType == 'BUY' ? 'buy' : 'sell',
        }

        index ? dataForEq.countryCode = tmpCountry.iso : dataForEq.countryCode = local_currency

        MarketingEvent.logEvent('exchange_main_screen_eq', dataForEq)

        try {

            res = await getEquivalent(dataForEq)

            let setData = {}

            if (res.state == 'success') {

                Log.log('Exchange.MainDataScreen.handleGetEq data', res)

                if ((res.data.amountForCheckLimits > selectedExchangeRange.max) || (res.data.amountForCheckLimits < selectedExchangeRange.min)) {
                    if (selectedEstimate === 'CRYPTO') {
                        setData.equivalentForCrypto = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                        setData.sendToApiFiat = 0
                        setData.sendToApiCrypto = 0
                        setData.inputError = true
                        setData.amountForCheckLimits = res.data.amountForCheckLimits
                        setData.equivalentData = res.data
                    } else {
                        setData.equivalentForFiat = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                        setData.sendToApiFiat = 0
                        setData.sendToApiCrypto = 0
                        setData.inputError = true
                        setData.amountForCheckLimits = res.data.amountForCheckLimits
                        setData.equivalentData = res.data
                    }
                    self.setState(setData)
                } else {
                    if (selectedEstimate === 'CRYPTO') {
                        setData.equivalentForCrypto = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                        setData.sendToApiFiat = res.data.sendToApiFiat
                        setData.sendToApiCrypto = res.data.sendToApiCrypto
                        setData.inputError = false
                        setData.amountForCheckLimits = res.data.amountForCheckLimits
                        setData.equivalentData = res.data
                    } else {
                        setData.equivalentForFiat = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                        setData.sendToApiFiat = res.data.sendToApiFiat
                        setData.sendToApiCrypto = res.data.sendToApiCrypto
                        setData.inputError = false
                        setData.amountForCheckLimits = res.data.amountForCheckLimits
                        setData.equivalentData = res.data
                    }
                    self.setState(setData)
                }
            } else {
                Log.log('Exchange.MainDataScreen.handleGetEq fail result', res) //not actual error but kind of
                if (selectedEstimate === 'CRYPTO') {
                    setData.equivalentForCrypto = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                    setData.sendToApiFiat = 0
                    setData.sendToApiCrypto = 0
                    setData.inputError = true
                    setData.amountForCheckLimits = res.data.amountForCheckLimits
                    setData.equivalentData = res.data
                } else {
                    setData.equivalentForFiat = isNaN(res.data.equivalent) ? '0' : res.data.equivalent
                    setData.sendToApiFiat = 0
                    setData.sendToApiCrypto = 0
                    setData.inputError = true
                    setData.amountForCheckLimits = res.data.amountForCheckLimits
                    setData.equivalentData = res.data
                }
                self.setState(setData)
            }
        } catch (e) {
            Log.err('Exchange.MainDataScreen.handleGetEq error', e)
        }
    }

    handleAddCard = () => {
        NavStore.goNext('AddCardScreen')
    }

    handleDeleteCard = (card) => {

        const title = strings('modal.infoDeleteCard.title')
        const description = strings('modal.infoDeleteCard.description')
        const { id: cardID } = card

        showModal({
            type: 'CHOOSE_INFO_MODAL',
            data: {
                title,
                description,
                declineCallback: () => hideModal(),
                acceptCallback: async () => {
                    await deleteCard(cardID)
                    hideModal()
                }
            }
        })
    }

    _renderItem = ({ item, index }) => {

        const tmpCard = item

        if (tmpCard.type === 'ADD') {
            return (
                <View style={styles.slide}>
                    <TouchableOpacity style={styles.slide__add} onPress={() => this.handleAddCard()}>
                        <View style={styles.slide__add__border}>
                            <Text style={styles.slide__add__title}>{strings('exchange.mainData.addCard')}</Text>
                            <Card style={styles.slide__add__icon} name="credit-card" size={20} color="#864dd9"/>
                        </View>
                    </TouchableOpacity>
                    <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 15, zIndex: 1 }}>
                        <View style={styles.slide__add__shadow}/>
                    </View>
                </View>
            )
        } if (!tmpCard.supported){
            return (
                <View style={styles.slide}>
                    <TouchableOpacity
                        style={styles.slide__cross}
                        onPress={() => this.handleDeleteCard(tmpCard)}>
                        <Entypo style={styles.slide__add__icon} name="cross" size={20} color="#404040"/>
                    </TouchableOpacity>
                    <Image
                        style={styles.slide__bg}
                        resizeMode='stretch'
                        source={require('../../assets/images/cardBlocked.png')}/>
                    <View style={styles.slide__blocked}>
                        <Text style={styles.slide__blocked__text}>
                            { strings('exchange.mainData.blockedCard')}
                        </Text>
                    </View>

                    <View style={styles.slide__content}>
                        <View style={styles.slide__top}>
                            <Text style={styles.slide__number__stars}>**** **** **** </Text>
                            <Text style={styles.slide__number__stars__shadow}>**** **** **** </Text>
                            <Text style={styles.slide__number}>{tmpCard.number.slice(tmpCard.number.length - 4, tmpCard.number.length)}</Text>
                            <Text style={styles.slide__number__shadow}>{tmpCard.number.slice(tmpCard.number.length - 4, tmpCard.number.length)}</Text>
                        </View>
                        <View style={styles.slide__bot}>
                            <View style={{ flex: 1, position: 'relative' }}>
                                <View>
                                    <Text style={styles.slide__expirationDate}>
                                        {tmpCard.expiration_date}
                                    </Text>
                                    <Text style={styles.slide__expirationDate__shadow}>
                                        {tmpCard.expiration_date}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.slide__card__name}>
                                        { tmpCard.card_name === null || tmpCard.card_name === '' ? (strings('card.noName')).toUpperCase() : (tmpCard.card_name).toUpperCase() } {'| ' + tmpCard.currency }
                                    </Text>
                                    <Text style={styles.slide__card__name__shadow}>
                                        { tmpCard.card_name === null || tmpCard.card_name === '' ? (strings('card.noName')).toUpperCase() : (tmpCard.card_name).toUpperCase() } {'| ' + tmpCard.currency }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.slide__icon}>
                                {
                                    tmpCard.type != '' ?
                                        <Card style={styles.actionBtn__icon}
                                              name={tmpCard.type == 'visa' ? 'cc-visa' : 'cc-mastercard'} size={25} color="#fff"/> : null
                                }
                            </View>
                        </View>
                    </View>
                </View>
            )
        } else {
            return (
                <View style={styles.slide}>
                    <Image
                        style={styles.slide__bg}
                        resizeMode='stretch'
                        source={require('../../assets/images/cardVisa.png')}/>
                    <View style={styles.slide__content}>
                        <View style={styles.slide__top}>
                            <Text style={styles.slide__number__stars}>**** **** **** </Text>
                            <Text style={styles.slide__number__stars__shadow}>**** **** **** </Text>
                            <Text style={styles.slide__number}>{tmpCard.number.slice(tmpCard.number.length - 4, tmpCard.number.length)}</Text>
                            <Text style={styles.slide__number__shadow}>{tmpCard.number.slice(tmpCard.number.length - 4, tmpCard.number.length)}</Text>
                        </View>
                        <View style={styles.slide__bot}>
                            <View style={{ flex: 1, position: 'relative' }}>
                                <View>
                                    <Text style={styles.slide__expirationDate}>
                                        {tmpCard.expiration_date}
                                    </Text>
                                    <Text style={styles.slide__expirationDate__shadow}>
                                        {tmpCard.expiration_date}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.slide__card__name}>
                                        { tmpCard.card_name === null || tmpCard.card_name === '' ? (strings('card.noName')).toUpperCase() : (tmpCard.card_name).toUpperCase() } {'| ' + tmpCard.currency }
                                    </Text>
                                    <Text style={styles.slide__card__name__shadow}>
                                        { tmpCard.card_name === null || tmpCard.card_name === '' ? (strings('card.noName')).toUpperCase() : (tmpCard.card_name).toUpperCase() } {'| ' + tmpCard.currency }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.slide__icon}>
                                {
                                    tmpCard.type != '' ?
                                        <Card style={styles.actionBtn__icon}
                                              name={tmpCard.type == 'visa' ? 'cc-visa' : 'cc-mastercard'} size={25} color="#fff"/> : null
                                }
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.slide__cross}
                            onPress={() => this.handleDeleteCard(tmpCard)}>
                            <Entypo style={styles.slide__add__icon} name="cross" size={20} color="#f4f4f4"/>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }

    }

    renderInfo = () => {

        const { exchangeType } = this.props.exchange
        const { address } = this.state.selectedAccount

        if (exchangeType == 'BUY') {
            return (
                <View style={styles.key}>
                    <View style={styles.key__icon}>
                        <Key
                            name="ios-key"
                            size={30}
                            color="#7c3cc5"
                        />
                    </View>
                    <View>
                        <Text style={styles.key__title}>
                            {strings('exchange.mainData.address')}
                        </Text>
                        <Text style={styles.key__text}>
                            {typeof address != 'undefined' ? address.slice(0, 13) + '...' + address.slice(address.length - 10, address.length) : ''}
                        </Text>
                    </View>
                </View>
            )
        }
    }

    handleSelectEstimate = (data) => {
        MarketingEvent.logEvent('exchange_main_screen_select_estimate', data)
        const { equivalentForFiat, equivalentForCrypto, exchangeLocalCurrency } = this.state
        const { exchangeType } = this.props.exchange
        const { value } = data
        const clear = {}

        if (value == 'CRYPTO') {
            clear.amount = equivalentForFiat.toString() == 0 ? '' : equivalentForFiat.toString()
            clear.equivalentForFiat = '0'
        } else {
            clear.amount = equivalentForCrypto.toString() == 0 ? '' : exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? ((+equivalentForCrypto).toFixed(2)).toString() : ((+equivalentForCrypto / exchangeLocalCurrency.rate).toFixed(2)).toString()
            clear.equivalentForCrypto = '0'
        }

        this.setState({
            selectedEstimate: value,
            inputError: false,
            ...clear
        }, () => {

            this.handleGetEq()

        })
    }

    handleSelectCryptocurrency = async (data) => {

        MarketingEvent.logEvent('exchange_main_screen_select_crypto', {currency : data.currencyCode.toLowerCase()})

        let account
        const { amount, exchangeApiConfig } = this.state
        const { wallet_hash } = this.props.main.selectedWallet
        const { exchangeType } = this.props.exchange



        const { array: accounts } = await accountDS.getAccountData(wallet_hash, data.currencyCode)


        try {
            account = accounts[0]

            const currencyRangeMin = _.find(this.state.exchangeRange.min, { symbol: data.currencyCode.toLowerCase() })
            const currencyRangeMax = _.find(this.state.exchangeRange.max, { symbol: data.currencyCode.toLowerCase() })
            const tmpProviderFee = _.find(exchangeType === 'BUY' ? exchangeApiConfig.providerFee.buy : exchangeApiConfig.providerFee.sell, { symbol: data.currencyCode })

            this.setState({
                selectedAccount: account,
                selectedCryptocurrency: data,
                selectedExchangeRange: {
                    symbol: currencyRangeMin.currencyCode,
                    min: exchangeType === 'BUY' ? currencyRangeMin.buy : currencyRangeMin.sell,
                    max: exchangeType === 'BUY' ? currencyRangeMax.buy : currencyRangeMax.sell,
                    perDay: exchangeType === 'BUY' ? currencyRangeMax.perDay : currencyRangeMax.perDay
                },
                providerFee: tmpProviderFee,
            }, () => {
                if (amount != '') {
                    this.handleGetEq()
                }
            })
        } catch (e) {
            Log.err('Exchange.MainDataScreen. handleSelectCryptocurrency error', e)
        }

    }

    onFocus = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 185 })
            } catch (e) {
            }
        }, 500)
    }

    handleViewDetail = () => {
        this.setState({
            showDetail: !this.state.showDetail
        })
    }

    handleOnSnapToItem = async () => {

        const { fiatRates, localCurrencySymbol, localCurrencyRate } = this.props.fiatRatesStore
        const { currencyCode } = this.state.selectedCryptocurrency
        const { local_currency } = this.props.settingsStore.data
        const { exchangeType } = this.props.exchange
        const { cards  } = this.state

        const card = cards[this._carousel.currentIndex]

        if(this._carousel.currentIndex){

            const { rate, cc } = fiatRates.find(item => card.currency === item.cc)
            const { symbol } = currenciesDict.find(item => item.currencyCode === cc)

            this.setState({
                exchangeLocalCurrency: {
                    rate: rate,
                    code: cc,
                    symbol
                }
            }, () => {
                this.state.amount != 0 && this.state.amount != '' ? this.handleGetEq() : null
            })
        } else {

            this.setState({
                exchangeLocalCurrency: {
                    rate: localCurrencyRate,
                    code: local_currency,
                    symbol: localCurrencySymbol
                }
            }, () => {
                this.state.amount != 0 && this.state.amount != '' ? this.handleGetEq() : null
            })
        }

        if(exchangeType === 'SELL'){
            // const tmpCountry = countriesDict.find(item => card.currency === item.currencyCode)
            //
            // const res = await axios.post(`${baseUrl}/get-server-data`, { countryCode: typeof tmpCountry == 'undefined' ? local_currency : tmpCountry.iso })
            //
            // console.log(res)

            const exchangeRange = this.state.exchangeApiConfig.exchangeRange[card.currency !== 'RUB' ? 'UAH' : card.currency]



            const currencyRangeMin = _.find(exchangeRange.min, { symbol: currencyCode.toLowerCase() })
            const currencyRangeMax = _.find(exchangeRange.max, { symbol: currencyCode.toLowerCase() })

            this.setState({
                selectedExchangeRange: {
                    symbol: currencyRangeMin.currencyCode,
                    min: exchangeType === 'BUY' ? currencyRangeMin.buy : currencyRangeMin.sell,
                    max: exchangeType === 'BUY' ? currencyRangeMax.buy : currencyRangeMax.sell,
                    perDay: exchangeType === 'BUY' ? currencyRangeMax.perDay : currencyRangeMax.perDay,
                }
            })
        }
    }

    renderDetail = () => {
        try {
            const { exchangeType } = this.props.exchange
            const {
                equivalentForCrypto,
                selectedEstimate,
                exchangeLocalCurrency,
                equivalentData,
                amount,
                selectedCryptocurrency,
                exchangeApiConfig,
                providerFee
            } = this.state

            const tmpProviderFee = providerFee.withdrawFee

            const trusteeFee = typeof exchangeApiConfig.trusteeFee != 'undefined' ? exchangeApiConfig.trusteeFee.fiat.percentage : 0

            let fee = exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? equivalentData.trusteeFee.equivalent : (equivalentData.trusteeFee.equivalent / exchangeLocalCurrency.rate).toFixed(2)
            fee = +fee

            let networkFee = typeof equivalentData.networkFee == 'undefined' ? 0 : exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? equivalentData.networkFee.fiat : (equivalentData.networkFee.fiat / exchangeLocalCurrency.rate).toFixed(2)
            networkFee = +networkFee

            let tmpAmount = selectedEstimate === 'CRYPTO' ? (+(exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? equivalentForCrypto : equivalentForCrypto / exchangeLocalCurrency.rate)).toFixed(2) : (+(amount)).toFixed(2)
            tmpAmount = +tmpAmount

            return (
                <View style={[styles.detail, this.state.showDetail ? styles.detail_active : null]}>
                    {
                        exchangeType === 'BUY' ?
                            <View style={styles.detail__item}>
                                <Text style={styles.detail__text1}>{ strings('exchange.mainData.networkFee') } { tmpProviderFee } { selectedCryptocurrency.currencySymbol }</Text>
                                <Text style={styles.detail__text2}>~ { networkFee } { exchangeLocalCurrency.code }</Text>
                            </View> : null
                    }
                    <View style={styles.detail__item}>
                        <Text style={styles.detail__text1}>{ strings('exchange.mainData.paySystemFee') } { trusteeFee }%</Text>
                        <Text style={styles.detail__text2}>{ fee } { exchangeLocalCurrency.code }</Text>
                    </View>
                    <View style={styles.detail__item}>
                        <Text style={styles.detail__text1}>{ exchangeType === 'SELL' ? strings('exchange.mainData.totalSell') : strings('exchange.mainData.totalBuy') }</Text>
                        <Text style={styles.detail__text2}>
                            {
                                tmpAmount.toFixed(2)
                            }
                            { ' ' + exchangeLocalCurrency.code }</Text>
                    </View>
                </View>
            )
        } catch (e){
            console.log('MainDataScreen.error ' + JSON.stringify(e.message))
        }
    }

    renderNavigationTitleComponent = () => {

        const { exchangeType } = this.props.exchange

        return (
            <View style={styles.navigationTitleComponent}>
                <TouchableOpacity
                    disabled={exchangeType === 'BUY'}
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => { setExchangeType({ exchangeType: 'BUY' }); this.init() }}>
                    <View style={[styles.navigationTitleComponent__btn__left, exchangeType === 'BUY' ? styles.navigationTitleComponent__btn__left_active : null]}>
                        <Text style={[styles.navigationTitleComponent__text, exchangeType === 'BUY' ? styles.navigationTitleComponent__textLeft_active : null]}>
                            { strings('exchange.mainData.titleBuy') }
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.navigationTitleComponent__line} />
                <TouchableOpacity
                    disabled={exchangeType === 'SELL'}
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => { setExchangeType({ exchangeType: 'SELL' }); this.init() }}>
                    <View style={[styles.navigationTitleComponent__btn__right, exchangeType === 'SELL' ? styles.navigationTitleComponent__btn__right_active : null]}>
                        <Text style={[styles.navigationTitleComponent__text, exchangeType === 'SELL' ? styles.navigationTitleComponent__textRight_active : null]}>
                            { strings('exchange.mainData.titleSell') }
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    render() {
        const { exchangeType } = this.props.exchange

        firebase.analytics().setCurrentScreen('Exchange.MainScreen.' + exchangeType)

        const {
            equivalentForCrypto,
            equivalentForFiat,
            selectedEstimate,
            inputError,
            selectedCryptocurrency,
            cryptocurrencyList,
            showSlider,
            selectedExchangeRange,
            cards,
            exchangeLocalCurrency,
        } = this.state

        const enterSymbol = selectedEstimate == 'CRYPTO' ? selectedCryptocurrency.currencySymbol : exchangeLocalCurrency.code
        const estimateSymbol = selectedEstimate == 'CRYPTO' ? exchangeLocalCurrency.code : selectedCryptocurrency.currencySymbol
        const enterSymbolArray = typeof enterSymbol != 'undefined' ? enterSymbol.split('') : []
        const estimateSymbolArray = typeof estimateSymbol != 'undefined' ? estimateSymbol.split('') : []

        const logData = { direction: exchangeType, from: enterSymbol, to: estimateSymbol }
        MarketingEvent.logEvent('exchange_main_screen', logData)
        Log.log(`Exchange.MainDataScreen.${exchangeType} is rendered`, logData)

        return (
            <GradientView
                style={styles.wrapper}
                array={styles.wrapper_gradient.array}
                start={styles.wrapper_gradient.start}
                end={styles.wrapper_gradient.end}>
                <Navigation
                    titleComponent={this.renderNavigationTitleComponent()}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps
                        showsVerticalScrollIndicator={false}
                        onScroll={this.onScrollView}
                        style={styles.wrapper__scrollView}>
                        <View style={styles.wrapper__content}>
                            <View style={styles.box}>
                                <View>
                                    <Text style={styles.box__title}>{strings('exchange.mainData.selectCurrency')}</Text>
                                    <ScrollView contentContainerStyle={styles.crypto}
                                                keyboardShouldPersistTaps
                                                horizontal={true}
                                                showsHorizontalScrollIndicator={false}>
                                        {
                                            cryptocurrencyList.map((item, index) => {

                                                const eq = item.currencyCode === selectedCryptocurrency.currencyCode

                                                return (
                                                    <TouchableOpacity
                                                        style={styles.crypto__item} key={index}
                                                        disabled={eq}
                                                        onPress={() => this.handleSelectCryptocurrency(item)}>
                                                        <View style={styles.radio}>
                                                            <View style={eq ? styles.radio__dot : null}></View>
                                                        </View>
                                                        <View style={styles.crypto__item__icon}>
                                                            <CurrencyIcon currencyCode={item.currencyCode}
                                                                          containerStyle={styles.cryptoList__icoWrap}
                                                                          markStyle={styles.cryptoList__icon__mark}
                                                                          markTextStyle={styles.cryptoList__icon__mark__text}
                                                                          iconStyle={styles.cryptoList__icon}/>
                                                        </View>
                                                        <View>
                                                            {
                                                                WIDTH > 410 ?
                                                                    <Text style={styles.crypto__title}>{item.currencyName}</Text>
                                                                    :
                                                                    null
                                                            }

                                                            <Text style={styles.crypto__text}>{item.currencySymbol}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                )
                                            })
                                        }
                                    </ScrollView>
                                </View>
                                <View style={styles.box__divider}/>

                                <View style={styles.inputs}>
                                    <View style={styles.inputs__top}>
                                        <Text style={{ ...styles.inputs__title, color: inputError ? '#e77ca3' : '#999999' }}>
                                            {strings('exchange.mainData.amount')}
                                        </Text>
                                    </View>
                                    {
                                        exchangeType === 'SELL' ?
                                            <TouchableOpacity style={styles.transferAllBtn} onPress={() => this.handleTransferAll()}>
                                                <View style={styles.inputs__top__right}>
                                                    <Text style={styles.inputs__top__text}>
                                                        {strings('exchange.mainData.sellAll').toUpperCase()}
                                                    </Text>
                                                </View>

                                            </TouchableOpacity> : null
                                    }
                                    <View style={styles.inputs__item}>
                                        <View style={styles.inputs__content}>
                                            <TextInput
                                                style={styles.inputs__input}
                                                onChangeText={(value) => this.handleInput({ name: 'amount', value })}
                                                value={this.state.amount}
                                                // onFocus={() => this.onFocus()}
                                                keyboardType={'numeric'}
                                            />
                                            <GradientView
                                                style={styles.inputs__line}
                                                array={inputError ? lineError.array : lineStyles_.array}
                                                start={lineStyles_.start}
                                                end={lineStyles_.end}/>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => this.handleSelectEstimate({ value: selectedEstimate === 'CRYPTO' ? 'FIAT' : 'CRYPTO' })}>
                                            <View style={styles.inputs__text}>
                                                {
                                                    enterSymbolArray.map((item, index) => {
                                                        return (
                                                            <Text style={{
                                                                ...styles.inputs__currency,
                                                                color: inputError ? '#e77ca3' : '#7127ac'
                                                            }} key={index}>
                                                                {item}
                                                            </Text>
                                                        )
                                                    })
                                                }
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View
                                        style={{ marginRight: 12, marginTop: -8 }}
                                        onPress={() => this.handleSelectEstimate({ value: selectedEstimate === 'CRYPTO' ? 'FIAT' : 'CRYPTO' })}>
                                        <View style={{
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            alignItems: 'flex-end'
                                        }}>
                                            <TouchableOpacity
                                                onPress={() => this.handleSelectEstimate({ value: selectedEstimate === 'CRYPTO' ? 'FIAT' : 'CRYPTO' })}>
                                                <Text style={styles.inputs__subtext}>
                                                    {
                                                        selectedEstimate === 'CRYPTO' ?
                                                            strings(`${exchangeType === 'BUY' ? 'exchange.mainData.equivalentCryptoBuy' : 'exchange.mainData.equivalentCryptoSell'}`, {
                                                                equivalent: 1 * (exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? +(equivalentForCrypto) : equivalentForCrypto / exchangeLocalCurrency.rate).toFixed(2), symbol: ''
                                                            }) :
                                                            strings('exchange.mainData.equivalentFiat', {
                                                                equivalent: equivalentForFiat, symbol: ''
                                                            })
                                                    }
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.inputs__text}
                                                onPress={() => this.handleSelectEstimate({ value: selectedEstimate === 'CRYPTO' ? 'FIAT' : 'CRYPTO' })}>
                                                {
                                                    estimateSymbolArray.map((item, index) => {
                                                        return (
                                                            <Text style={{
                                                                ...styles.inputs__currency,
                                                                color: inputError ? '#e77ca3' : '#7127ac'
                                                            }} key={index}>
                                                                {item}
                                                            </Text>
                                                        )
                                                    })
                                                }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.moreDetail} onPress={this.handleViewDetail}>
                                    <Text style={styles.moreDetail__title}>{ strings('exchange.mainData.moreInformation') }</Text>
                                    <View style={{...styles.moreDetail__icon, marginTop: this.state.showDetail ? 1 : 0 }}>
                                        <Ionicons name={this.state.showDetail ? 'ios-arrow-up' : 'ios-arrow-down'} size={12} color='#7127ac' />
                                    </View>
                                </TouchableOpacity>
                                { this.renderDetail() }
                            </View>
                            {
                                inputError ?
                                    <View style={styles.texts}>
                                        <View style={styles.texts__icon}>
                                            <Icon
                                                name="information-outline"
                                                size={30}
                                                color="#e77ca3"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.texts__item}>
                                                {
                                                    exchangeType === 'BUY' ?
                                                        strings('exchange.mainData.minAmountToBuy') :
                                                            strings('exchange.mainData.minAmountToSell')
                                                }
                                                {
                                                    strings('exchange.mainData.minExchange', {
                                                        crypto: '', fiat: ' ' + (exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? selectedExchangeRange.min : (selectedExchangeRange.min / exchangeLocalCurrency.rate).toFixed(2)) + ' '
                                                    }) + exchangeLocalCurrency.code
                                                }
                                            </Text>
                                            <Text style={styles.texts__item}>
                                                {
                                                    strings(`${exchangeType === 'BUY' ? 'exchange.mainData.maxAmountBuy' : 'exchange.mainData.maxAmountSell'}`, {
                                                        maxAmountToBuy: exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? selectedExchangeRange.perDay : (selectedExchangeRange.perDay / exchangeLocalCurrency.rate).toFixed(2),
                                                        maxAmountToBuyPart: exchangeType === 'SELL' && exchangeLocalCurrency.code === 'RUB' ? selectedExchangeRange.max : (selectedExchangeRange.max / exchangeLocalCurrency.rate).toFixed(2),
                                                        fiatSymbol: exchangeLocalCurrency.code
                                                    })
                                                }
                                            </Text>
                                        </View>
                                    </View> : null
                            }
                            {
                                this.renderInfo()
                            }
                            <View style={styles.btn}>
                                <View style={styles.cards}>
                                    {
                                        showSlider ?
                                            <Carousel
                                                ref={(c) => { this._carousel = c; }}
                                                keyboardShouldPersistTaps
                                                data={cards}
                                                enableMomentum={true}
                                                renderItem={(data) => this._renderItem(data)}
                                                sliderWidth={300}
                                                itemWidth={210}
                                                layout={'stack'}
                                                firstItem={cards.length-1}
                                                onSnapToItem={(index) => this.setState({
                                                    sliderActiveSlide: index
                                                }, () => {
                                                    this.handleOnSnapToItem()
                                                })}
                                            /> : null
                                    }
                                    <Pagination
                                        dotsLength={cards.length}
                                        activeDotIndex={this.state.sliderActiveSlide}
                                        containerStyle={styles.paginationContainer}
                                        dotColor={'#864dd9'}
                                        dotStyle={styles.paginationDot}
                                        inactiveDotColor={'#000'}
                                        inactiveDotOpacity={0.4}
                                        inactiveDotScale={0.6}
                                        carouselRef={this._carousel}
                                        tappableDots={!!this._carousel}
                                    />
                                </View>
                                <Button press={() => this.handleSubmit()}>
                                    {exchangeType === 'BUY' ? `${strings('exchange.buy')} ${selectedCryptocurrency.currencySymbol}` : `${strings('exchange.sell')} ${selectedCryptocurrency.currencySymbol}`}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAwareView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore,
        wallet: state.mainStore.selectedWallet,
        selectedAccount: state.mainStore.selectedAccount,
        cards: state.mainStore.cards,
        exchange: state.exchangeStore,
        account: state.mainStore.selectedAccount,
        settingsStore: state.settingsStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainDataScreen)

const lineStyles_ = {
    array: ['#7127ac', '#864dd9'],
    arrayError: ['#e77ca3', '#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const lineDisabled = {
    array: ['#999999', '#999999'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const lineError = {
    array: ['#e77ca3', '#e77ca3'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper_gradient: {
        array: ['#fff', '#fff'],
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    wrapper__content: {
        flex: 1,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    box: {
        position: 'relative',
        paddingTop: 15,
        borderRadius: 15,
        marginBottom: 35,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    transferAllBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? -4 : -2,
        right: 0,
        zIndex: 20
    },
    inputs: {
        position: 'relative',
        paddingTop: 10,
    },
    inputs__top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        width: '100%',
        marginBottom: -10,

        zIndex: 10
    },
    inputs__top__right: {
        height: 50,
        paddingHorizontal: 20,
        justifyContent: 'center'
    },
    inputs__top__text: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#864dd9'
    },
    inputs__item: {
        flexDirection: 'row',
        alignItems: 'flex-end',

        marginRight: 12
    },
    inputs__title: {
        paddingLeft: 20,

        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127ac'
    },
    inputs__currency: {
        alignSelf: 'flex-end',
        minWidth: 14,
        marginBottom: 2,
        fontSize: 19,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127ac'
    },
    inputs__line: {
        position: 'absolute',
        bottom: 6,
        left: 0,
        width: '100%',
        flex: 1,
        height: 1
    },
    inputs__content: {
        position: 'relative',

        flex: 1,

        marginRight: 10,
        marginLeft: 20,

    },
    inputs__input: {
        height: 50,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    inputs__subtext: {
        marginTop: 3,
        marginRight: 5,
        marginBottom: 4,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular'
    },
    inputs__button: {
        position: 'absolute',
        right: 10,
        top: Platform.OS === 'ios' ? 80 : 90
    },
    inputs__subtext__violet: {
        marginTop: 3,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127ac'
    },
    inputs__text: {
        justifyContent: 'center',
        flexDirection: 'row',
        alignContent: 'flex-end',
        width: 56
    },
    line: {
        height: 1,
        marginBottom: 15,
        marginRight: 50,
        backgroundColor: '#f1f2f4'
    },
    btn: {
        marginTop: 'auto'
    },
    cards: {
        alignItems: 'center',
        marginBottom: 40
    },
    slide: {
        position: 'relative',
        width: 210,
        height: 125,
        borderRadius: 15
    },
    slide__content: {
        position: 'relative',
        marginLeft: 15,
        zIndex: 2
    },
    slide__top: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        marginTop: 25
    },
    slide__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '94%',
        zIndex: 1
    },
    slide__blocked: {
        position: 'absolute',
        top: 0,
        left: 0,

        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        opacity: 0.9,
        zIndex: 5
    },
    slide__blocked__text: {
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 15,

        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Bold',
        color: '#404040'
    },
    slide__blocked__icon: {
        position: 'absolute',
        top: 96
    },
    slide__name: {
        marginTop: 13,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#f4f4f4'
    },
    slide__number__stars: {
        position: 'relative',

        marginTop: 15,

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 10,
        color: '#f4f4f4',
        zIndex: 2
    },
    slide__number__stars__shadow: {
        position: 'absolute',
        top: 22,
        left: 0,

        fontSize: 10,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        color: '#000',

        zIndex: 1
    },
    slide__number: {
        position: 'relative',

        marginTop: 20,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 14,
        color: '#f4f4f4',

        zIndex: 2
    },
    slide__number__shadow: {
        position: 'absolute',
        top: 2,
        right: 45,

        marginTop: 20,
        marginBottom: 25,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 14,
        color: '#000',

        zIndex: 1
    },
    slide__bot: {
        flexDirection: 'row',
        alignItems: 'center',

        position: 'relative',
        marginTop: 15,
    },
    slide__expirationDate: {
        position: 'relative',

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 8,
        color: '#f4f4f4',

        zIndex: 2
    },
    slide__expirationDate__shadow: {
        position: 'absolute',
        top: 2,
        left: 0,

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 8,
        color: '#000',

        zIndex: 1
    },
    slide__card__name: {
        position: 'relative',

        marginTop: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 8,
        color: '#fff',
        zIndex: 2
    },
    slide__card__name__shadow: {
        position: 'absolute',
        top: 2,

        marginTop: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 8,
        color: '#000',

        zIndex: 1
    },
    slide__icon: {
        marginTop: -22,
        marginRight: 10,
        alignSelf: 'flex-end'
    },
    paginationContainer: {
        paddingVertical: 20
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 8
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    texts__item: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e77ca3'
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    },
    key: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 35
    },
    key__icon: {
        marginRight: 15
    },
    key__title: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    key__text: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040'
    },
    slide__add: {
        position: 'relative',
        flex: 1,
        padding: 5,
        marginBottom: 10,
        borderRadius: 10,
        zIndex: 2
    },
    slide__add__border: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        height: '95%',

        borderWidth: 2,
        borderColor: '#864dd9',
        borderStyle: 'dashed',
        borderRadius: 10,

        zIndex: 2
    },
    slide__add__title: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#864dd9'
    },
    slide__add__shadow: {
        position: 'absolute',
        top: 3,
        left: 3,
        width: 204,
        height: 102,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,
        borderRadius: 10
    },
    slide__add__icon: {
        marginLeft: 10,
        marginBottom: 2
    },
    slide__cross: {
        position: 'absolute',
        top: -8,
        right: -8,
        padding: 16,
        zIndex: 10
    },
    box__title: {
        marginLeft: 20,
        marginBottom: 10,
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999'
    },
    box__divider: {
        width: '70%',
        marginRight: 'auto',
        marginLeft: 'auto',
        marginBottom: 8,
        height: 1,
        backgroundColor: '#e3e6e9'
    },
    crypto: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignContent: 'space-between',

        height: 120,

        paddingHorizontal: 20,
        marginBottom: 10
    },
    crypto__item__icon: {
        marginRight: 12,

        borderRadius: 22,
        backgroundColor: '#fff'
    },
    crypto__item: {
        flexDirection: 'row',
        width: WIDTH/2 - 50,
        alignItems: 'center',
        height: 50,
        marginBottom: 10
    },
    crypto__title: {
        fontSize: 18,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    crypto__text: {
        marginTop: WIDTH > 410 ? -5 : 0,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: WIDTH > 410 ? '#999' : '#404040'
    },
    cryptoList__icoWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#6B36A8',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    },
    estimate: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        maxWidth: 190,
        marginTop: -4,
        marginBottom: 8
    },
    estimate__item: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    estimate__text: {
        fontSize: 18,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5,
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },
    moreDetail: {
        flexDirection: 'row',
        justifyContent: 'center',

        padding: 10,
        marginLeft: 10
    },
    moreDetail__title: {
        marginRight: 5,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#6B36A8'
    },
    moreDetail__icon: {
        marginTop: 1
    },
    detail_active: {
        maxHeight: 400,
        paddingBottom: 20,
    },
    detail: {
        maxHeight: 0,
        paddingHorizontal: 20,
        overflow: 'hidden'
    },
    detail__item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',

        marginTop: 5
    },
    detail__text1: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    detail__text2: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040'
    },
    navigationTitleComponent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    navigationTitleComponent__btn: {
        paddingVertical: 12,
    },
    navigationTitleComponent__btn__left: {
        justifyContent: 'center',

        height: 22,

        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#f4f4f4',
        borderTopColor: '#f4f4f4',
        borderLeftColor: '#f4f4f4',
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    navigationTitleComponent__btn__right: {
        justifyContent: 'center',

        height: 22,

        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#f4f4f4',
        borderTopColor: '#f4f4f4',
        borderRightColor: '#f4f4f4',
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
    navigationTitleComponent__line: {
        width: 1,
        height: 22,
        backgroundColor: '#f4f4f4'
    },
    navigationTitleComponent__text: {
        paddingHorizontal: 5,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#f4f4f4',
    },
    navigationTitleComponent__textLeft_active: {
        color: '#7127ac',
    },
    navigationTitleComponent__textRight_active: {
        color: '#7127ac',
    },
    navigationTitleComponent__btn__left_active: {
        backgroundColor: '#f4f4f4'
    },
    navigationTitleComponent__btn__right_active: {
        backgroundColor: '#f4f4f4'
    },
}
