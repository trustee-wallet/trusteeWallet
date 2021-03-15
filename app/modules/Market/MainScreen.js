/**
 * @version 0.30
 * @author yura
 */

import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    View,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    StatusBar,
    StyleSheet,
    Keyboard,
    ActivityIndicator,
    SafeAreaView
} from 'react-native'

import { WebView } from 'react-native-webview'
import { CardIOModule } from 'react-native-awesome-card-io'
import valid from 'card-validator'
import _ from 'lodash'

import NavStore from '@app/components/navigation/NavStore'

import ApiV3 from '@app/services/Api/ApiV3'
import Log from '@app/services/Log/Log'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'


import { strings, sublocale } from '@app/services/i18n'
import cardDS from '@app/appstores/DataSource/Card/Card'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { Camera } from '@app/services/Camera/Camera'

import countriesDict from '@app/assets/jsons/other/country-codes'
import Validator from '@app/services/UI/Validator/Validator'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import config from '@app/config/config'
import { SendActions } from '@app/appstores/Stores/Send/SendActions'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { Cards } from '@app/services/Cards/Cards'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_INIT_KEY = false

class MarketScreen extends Component {

    constructor() {
        super()
        this.state = {
            show: false,
            inited: false,
            apiUrl: null,
            homePage: false,
            countedFees: false,
            selectedFee: false
        }
    }

    init = async () => {

        let { currencyCode } = this.props.cryptoCurrency

        const prev = NavStore.getPrevRoute().routeName

        const side = prev === 'AccountScreen' ? 'OUT' : prev === 'ReceiveScreen' ? 'IN' : null

        currencyCode = (prev === 'AccountScreen' || prev === 'ReceiveScreen') ? currencyCode : null

        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        let apiUrl = await ApiV3.initData('MARKET', currencyCode, side)

        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl
            })
        }, 10)
    }

    componentDidMount() {
        const { isLight } = this.context

        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content');
    }

    componentWiilUnmount() {
        const { isLight } = this.context

        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content');
    }

    onKeyboardShow = () => {
        const { isLight } = this.context

        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content');
    }

    handlerBackPress = () => {

        const { isLight } = this.context

        if (this.webref) {
            if (this.state.homePage) {
                this.setState({
                    homePage: false
                })
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
            }

            this.webref.goBack()
            return true
        }
    }

    _handleNumberInput = async (cardData, data) => {

        cardData.errors = []
        const { value, name } = data

        let tmpErrors = JSON.parse(JSON.stringify(cardData.errors))

        tmpErrors = _.remove(tmpErrors, obj => obj.field !== name)

        const numberValidation = valid.number(value)

        if (name === 'number') {
            if (numberValidation.card) {
                cardData.type = numberValidation.card.type
            } else {
                cardData.type = ''
            }

            cardData.numberPlaceholder = value.replace(' ', '')

        }
        else if (name === 'date') {
            cardData.datePlaceholder = ((value.replace(' ', '')).concat('00000000')).substring(0, 5)
        }

        cardData[name] = value
        cardData.errors = tmpErrors

    }

    handleScan = () => {

        const cardData = {}

        CardIOModule
            .scanCard({
                suppressConfirmation: true,
                suppressManualEntry: true,
                scanInstructions: strings('card.instructions'),
                // languageOrLocale: i18n.locale.split('-')[0] === 'uk' ? 'ru' : i18n.locale,
                requireCVV: false,
                hideCardIOLogo: true
            })
            .then(card => {

                let { cardNumber, expiryMonth, expiryYear } = card

                this._handleNumberInput(cardData, { value: cardNumber, name: 'number' })

                expiryMonth = expiryMonth.toString()

                expiryMonth = expiryMonth.length === 1 ? '0' + expiryMonth : expiryMonth

                expiryYear = expiryYear.toString()

                const date = expiryMonth + expiryYear === '000' ? '' : expiryMonth + '/' + expiryYear.slice(expiryYear.length - 2, expiryYear.length)

                this._handleNumberInput(cardData, { value: date, name: 'date' })

                this.getCountry(cardData.number, cardData)

            })
            .catch(() => {
            })
    }

    async getCountry(value, cardData) {
        if ((value.replace(/\s+/g, '')).length === 16) {
            const validate = await Validator.arrayValidation([
                {
                    id: 'number',
                    name: 'сard number',
                    type: 'CARD_NUMBER',
                    value
                }
            ])

            if (validate.status === 'success') {
                const countryCode = await Cards.getCountryCode(value)

                const country = countriesDict.find(item => item.iso === countryCode)

                if (typeof countryCode !== 'undefined' && typeof country !== 'undefined') {
                    cardData.selectedCountry = {
                        key: countryCode,
                        value: country.country
                    }
                } else {
                    cardData.selectedCountry = {
                        key: '804',
                        value: 'Ukraine'
                    }
                }
            }
            this.webref.postMessage(JSON.stringify({ 'data': cardData }))
        }
    }

    onMessage(event) {

        const { isLight } = this.context

        try {
            const allData = JSON.parse(event.nativeEvent.data)
            const { error, backToOld, close, homePage, cardData, takePhoto, scanCard, deleteCard,
                updateCard, orderData, injectScript, currencySelect, dataSend, didMount, navigationState, message, exchangeStatus,
                useAllFunds, checkCamera } = allData

            Log.log('Market/MainScreen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
                return
            }

            if (backToOld) {
                if (backToOld === 'SELL') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: backToOld })
                } else if (backToOld === 'BUY') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: backToOld })
                } else if (backToOld === 'EXCHANGE') {
                    NavStore.goNext('ExchangeV3ScreenStack')
                }
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
            }

            if (checkCamera) {
                this.checkCameraForWebView()
            }

            if (typeof homePage !== 'undefined' && (homePage === true || homePage === false)) {

                this.setState({
                    homePage
                })
                return
            }

            if (cardData) {
                Log.log('Market/MainScreen.onMessage cardData', cardData)
                if (typeof cardData.actionType === 'undefined' || cardData.actionType === 'ADD') {
                    this.onSaveCard(cardData)
                }
            } else if (takePhoto) {
                Log.log('Market/MainScreen.onMessage takePhoto' + JSON.stringify(takePhoto))
                this.onTakePhoto(typeof takePhoto.number === 'undefined' ? { number: takePhoto } : takePhoto)
            } else if (scanCard) {
                this.handleScan()
            } else if (deleteCard) {
                this.onDeleteCard(deleteCard)
            } else if (updateCard) {
                this.onUpdateCard(updateCard)
            }

            if (useAllFunds) {
                this.handleTransferAll(useAllFunds)
            }

            if (injectScript && orderData) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('SMSV3CodeScreen', {
                    tradeWebParam: {
                        injectScript,
                        orderData,
                        currencySelect,
                        didMount,
                        navigationState,
                        message,
                        exchangeStatus
                    }
                })
            }

            if (dataSend) {
                this.send(dataSend)
            }

        } catch {
            Log.err('Market/MainScreen.onMessage parse error ', event.nativeEvent)
        }
    }

    async checkCameraForWebView() {
        const res = await Camera.checkCameraOn('Market/MainScreen validateCard')
        this.webref.postMessage(JSON.stringify({ cameraRes: res }))
    }

    async send(data) {
        const limits = JSON.parse(data.limits)
        const trusteeFee = JSON.parse(data.trusteeFee)

        const minCrypto = BlocksoftPrettyNumbers.setCurrencyCode(limits.currencyCode).makeUnPretty(limits.limits)

        try {
            Log.log('Market/MainScreen dataSend', data)

            const bseOrderData = {
                amountReceived: null,
                depositAddress: data.address,
                exchangeRate: null,
                exchangeWayType: data.exchangeWayType,
                inTxHash: null,
                orderHash: data.orderHash,
                orderId: data.orderHash,
                outDestination: data.exchangeWayType === 'SELL' ? `${data.outDestination.substr(0, 2)}***${data.outDestination.substr(-4, 4)}` :
                    data.outDestination,
                outTxHash: null,
                payinUrl: null,
                requestedInAmount: { amount: data.amount, currencyCode: data.currencyCode },
                requestedOutAmount: { amount: data.outAmount, currencyCode: data.outCurrency },
                status: "pending_payin"
            }

            SendActions.setUiType({
                ui: {
                    uiType: 'TRADE_SEND',
                    uiApiVersion: 'v3',
                    uiProviderType: data.providerType, // 'FIXED' || 'FLOATING'
                    uiInputAddress: typeof data.address !== 'undefined' && data.address && data.address !== ''
                },
                addData: {
                    gotoReceipt: true,
                    comment: data.comment || ''
                }
            })
            await SendActions.startSend({
                addressTo: data.address,
                amountPretty: data.amount.toString(),
                memo: data.memo,
                currencyCode: data.currencyCode,
                isTransferAll: data.useAllFunds,
                bseOrderId: data.orderHash || data.orderId,
                bseMinCrypto: minCrypto,
                bseTrusteeFee: {
                    value: trusteeFee.trusteeFee,
                    currencyCode: trusteeFee.currencyCode,
                    type: data.exchangeWayType,
                    from: data.currencyCode,
                    to: data.outCurrency
                },
                bseOrderData: bseOrderData
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen.send', e)
            }
            throw e
        }
    }

    async onTakePhoto(cardData) {
        const res = await Camera.checkCameraOn('Market/MainScreen validateCard')
        this.webref.postMessage(JSON.stringify({ cameraRes: res }))
        if (!res) {
            return
        }

        // setLoaderStatus(true)
        try {
            Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery started')
            const res = await Camera.openCameraOrGallery('Market/MainScreen validateCard')
            Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery res', res)

            let showError = true
            let msgError = typeof res.error !== 'undefined' ? res.error : ''
            if (!res) {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery no result')
                msgError += ' no result'
            } else if (res.didCancel) {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery cancelled')
                msgError += ', need to select from gallery'
                if (msgError.indexOf('file path of photo') !== 'undefined') {
                    msgError = strings('tradeScreen.modalError.selectPhoto')
                }
            } else if (res.error) {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery error ', res.error)
                msgError += ' ' + res.error
            } else if (typeof res.path === 'undefined' || !res.path || res.path === '') {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery no path')
                msgError += ' no path from gallery'
            } else if (typeof res.base64 === 'undefined' || !res.base64 || res.base64 === '') {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery not loaded from gallery')
                msgError += ' not loaded from gallery'
            } else {
                Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery path ' + res.path)
                this._onTakePhotoInner(res, cardData)
                showError = false
            }
            setLoaderStatus(false)
            if (showError) {
                this.webref.postMessage(JSON.stringify({ notPhoto: true }))

                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: msgError
                })
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Market/MainScreen validateCard Camera.openCameraOrGallery error ' + e.message, e)
            }
            // setLoaderStatus(false)
            Log.log('Market/MainScreen validateCard Camera.openCameraOrGallery error ' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.openSettingsModal.title'),
                description: strings('modal.openSettingsModal.description')
            })
        }
    }

    _onTakePhotoInner(response, cardData) {
        try {
            if (typeof response.didCancel !== 'undefined' && response.didCancel) {
                setLoaderStatus(false)
            }

            Log.log('Market/MainScreen._onTakePhotoInner cardData', JSON.parse(JSON.stringify(cardData)))

            let path = response.path

            if (typeof response.path === 'undefined')
                return

            if (response.didCancel) {
                Log.log('Market/MainScreen._onTakePhotoInner User cancelled image picker')
            } else if (response.error) {
                Log.log('Market/MainScreen._onTakePhotoInnerImagePicker error ', response.error)
            } else {
                const passData = { alreadySaved: true, photoSource: path }
                if (typeof cardData.number === 'undefined') {
                    Log.log('Market/MainScreen._onTakePhotoInner cardData.number === undefined')
                    throw new Error('YURA! do number in cardData')
                }
                passData.number = cardData.number
                if (typeof cardData.countryCode !== 'undefined') {
                    passData.countryCode = cardData.countryCode
                }
                passData.type = 'visa'
                this.onSaveCard(passData)
            }
        } catch (e) {
            Log.err('Market/MainScreen._onTakePhotoInner error ' + e.message)

            this.webref.postMessage(JSON.stringify({ notPhoto: true }))

            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            })
        }
    }

    async onSaveCard(cardData) {

        let walletHash = cardData.walletHash || 'NULL'
        if (!walletHash || walletHash.length === 0 || walletHash === 'false') {
            walletHash = 'NULL'
        }

        if (typeof cardData.alreadySaved === 'undefined') {
            await cardDS.saveCard({
                insertObjs: [{
                    number: cardData.number,
                    expiration_date: cardData.expirationDate,
                    type: cardData.type,
                    country_code: cardData.countryCode,
                    card_name: cardData.cardName,
                    currency: cardData.currency,
                    wallet_hash: walletHash,
                    verification_server: 'V3',
                    card_email: cardData.email,
                    card_details_json: cardData.cardDetailsJson
                }]
            })
            Log.log('Market/MainScreen save cardData' + JSON.stringify(cardData))
        }
        if (cardData.type === 'visa' || cardData.type === 'mastercard' || cardData.type === 'mir' || cardData.type === 'maestro') {
            await this._verifyCard(cardData)
        }
    }

    async _verifyCard(cardData) {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const entryUrl = exchangeMode === 'DEV' ? apiEndpoints.entryURLTest : apiEndpoints.entryURL

        let cardID = 0
        if (typeof cardData.id === 'undefined' || !cardData.id) {
            const saved = await cardDS.getCards({ number: cardData.number })
            if (!saved) {
                // todo warning
                return false
            }
            cardID = saved[0].id
        } else {
            cardID = cardData.id
        }

        try {
            const deviceToken = MarketingEvent.DATA.LOG_TOKEN
            const locale = sublocale()

            let msg = ''
            try {
                Log.log('Market/MainScreen._verifyCard will ask time from server')
                const now = await BlocksoftAxios.get(`${entryUrl}/data/server-time`)
                if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                    msg = now.data.serverTime
                    Log.log('Market/MainScreen._verifyCard msg from server ' + msg)
                }
            } catch (e) {
                // do nothing
            }

            const sign = await CashBackUtils.createWalletSignature(true, msg)
            const cashbackToken = CashBackUtils.getWalletToken()

            const data = new FormData()
            data.append('cardNumber', cardData.number)
            data.append('countryCode', cardData.countryCode)

            typeof deviceToken !== 'undefined' && deviceToken !== null ?
                data.append('deviceToken', deviceToken) : null

            typeof cashbackToken !== 'undefined' && cashbackToken !== null ?
                data.append('cashbackToken', cashbackToken) : null

            typeof locale !== 'undefined' && locale !== null ?
                data.append('locale', locale) : null

            if (typeof sign !== 'undefined' && sign !== null) {
                data.append('signMessage', sign.message)
                data.append('signMessageHash', sign.messageHash)
                data.append('signature', sign.signature)
            }

            if (typeof cardData.photoSource !== 'undefined') {
                const fs = new FileSystem({})
                const base64 = await fs.v3handleImageBase64(cardData.photoSource)
                data.append('image', 'data:image/jpeg;base64,' + base64)
            }

            let res
            try {
                res = await ApiV3.validateCard(data, exchangeMode)
                res = res.data
            } catch (e) {
                this.webref.postMessage(JSON.stringify({ serverError: true }))
                Log.log('Market.MainScreen ApiV3.validateCard error', JSON.stringify(e))
            }

            await cardDS.updateCard({
                key: {
                    id: cardID
                },
                updateObj: {
                    cardVerificationJson: JSON.stringify(res)
                }
            })

            Log.log('Market/MainScreen res for card ' + cardID, res)

            const cardJson = res
            const numberCard = cardData.number

            if (typeof cardJson !== 'undefined' && cardJson && typeof cardJson.verificationStatus !== 'undefined' &&
                (cardJson.verificationStatus === 'PENDING' || cardJson.verificationStatus === 'WAIT_FOR_PHOTO')) {
                await this.resCardToWebView(numberCard)
            } else {
                if (res) {
                    this.webref.postMessage(JSON.stringify({ res: { cardID, res, numberCard } }))
                }
            }

        } catch (e) {
            Log.err('Market/MainScreen validate e', e)
        }
    }

    async resCardToWebView(numberCard) {
        const cacheJson = await UpdateCardsDaemon.updateCardsDaemon({ force: true, numberCard })
        let cardStatus = cacheJson
        let card
        if (typeof cacheJson === 'undefined' || !cacheJson) {
            card = await cardDS.getCards({ number: numberCard })
            cardStatus = JSON.parse(card[0].cardVerificationJson)
        }

        if (cardStatus.verificationStatus === 'SUCCESS' || cardStatus.verificationStatus === 'CANCELED') {
            this.webref.postMessage(JSON.stringify({ "res": { "res": cardStatus, numberCard } }))
            return true
        } else {
            this.webref.postMessage(JSON.stringify({ "res": { "res": cardStatus, numberCard } }))
            setTimeout(async () => {
                await this.resCardToWebView(numberCard)
            }, 30e3) //30 sec
        }

    }

    async onDeleteCard(cardID) {
        try {
            await cardDS.deleteCard(cardID)
        } catch (e) {
            Log.err('Market/MainScreen deleteCard error ' + e.message)
        }
    }

    async onUpdateCard(item) {
        const updateObj = {
            cardName: item.cardName,
            countryCode: item.countryCode,
            currency: item.currency,
            expirationDate: item.expirationDate,
            type: item.type,
            walletHash: item.walletHash,
            card_email: item.email,
            card_details_json: item.cardDetailsJson
            // cardVerificationJson: JSON.stringify(res)
        }
        if (typeof item.number !== 'undefined') {
            updateObj.number = item.number
            updateObj.cardVerificationJson = null
        }
        await cardDS.updateCard({
            key: {
                id: item.id
            },
            updateObj
        })
        Log.log('Market/MainScreen card updated')

        if (item.type === 'visa' || item.type === 'mastercard' || item.type === 'mir' || item.type === 'maestro') {
            if (typeof item.number !== 'undefined') {
                await this._verifyCard(item)
            }
        }
    }

    handleTransferAll = async (params) => {
        // console.log('Trade/MainV3DataScreen.handleTransferAll', JSON.stringify(params))
        const currencyCode = params.currencyCode
        const address = params.address
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        try {
            const addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })
            const { transferBalance } = await SendActions.countTransferAllBeforeStartSend({
                currencyCode,
                addressTo: addressToForTransferAll
            })
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferBalance, 'V3.sellAll')
            this.webref.postMessage(JSON.stringify({ fees: { amount: amount || 0 } }))
            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen.handleTransferAll', e)
            }

            this.webref.postMessage(JSON.stringify({ serverError: true }))

            Log.errorTranslate(e, 'Market/MainScreen.handleTransferAll', extend)

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.qrScanner.sorry'),
                description: e.message,
                error: e
            })
        }
    }

    modal() {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: null,
            description: strings('modal.modalV3.description')
        }, () => {
            NavStore.goNext('HomeScreen')
        })
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size="large"
                style={{
                    backgroundColor: colors.common.header.bg, position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                color={this.context.colors.common.text2}
            />
        )
    }

    render() {

        UpdateOneByOneDaemon.pause()

        const { colors, isLight } = this.context

        this.init()
        MarketingAnalytics.setCurrentScreen('Market.MainScreen')

        const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta)`

        return (
            <View style={styles.wrapper}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />
                <View style={{ flex: 1, position: 'relative', marginTop: 0 }}>
                    {this.state.show ?
                        <KeyboardAvoidingView
                            behavior={Platform.select({ ios: 'height', android: 'height' })}
                            enabled={false}
                            hideKeyboardAccessoryView={false}
                            contentContainerStyle={{ flex: 1 }}
                            style={{ flexGrow: 1 }} >
                            <WebView
                                ref={webView => (this.webref = webView)}
                                javaScriptEnabled={true}
                                onNavigationStateChange={this.handleWebViewNavigationStateChange}
                                source={{ uri: this.state.apiUrl }}
                                injectedJavaScript={INJECTEDJAVASCRIPT}
                                scalesPageToFit={false}
                                scrollEnabled={false}
                                style={{ flex: 1 }}
                                renderError={(e) => {
                                    Log.err('Market.MainScreen.render error ' + e)
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
                                }}
                                onError={(e) => {
                                    Log.err('Market.MainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
                                }}
                                onHttpError={(e) => {
                                    Log.log('Market.MainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.goNext('HomeScreen')
                                }}
                                onMessage={e => {
                                    this.onMessage(e)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('Market.MainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('Market.MainScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('Market.MainScreen.on start load with request ' + e.navigationType)
                                    return true
                                }}
                                useWebKit={true}
                                startInLoadingState={true}
                                renderLoading={this.renderLoading}
                            />
                        </KeyboardAvoidingView> :
                        <>
                            {this.renderLoading()}
                        </>}
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

MarketScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(MarketScreen)


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
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
})

