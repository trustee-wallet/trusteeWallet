/**
 * @version 0.3
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
    Keyboard,
    ActivityIndicator,
    SafeAreaView
} from 'react-native'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import ApiV3 from '../../services/Api/ApiV3'
import Log from '../../services/Log/Log'

import { WebView } from 'react-native-webview'
import { i18n, strings, sublocale } from '../../services/i18n'
import AsyncStorage from '@react-native-community/async-storage'
import cardDS from '../../appstores/DataSource/Card/Card'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { FileSystem } from '../../services/FileSystem/FileSystem'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import { Camera } from '../../services/Camera/Camera'
import { CardIOModule, CardIOUtilities } from 'react-native-awesome-card-io'
import countriesDict from '../../assets/jsons/other/country-codes'
import Validator from '../../services/UI/Validator/Validator'
import valid from 'card-validator'
import _ from 'lodash'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateCardsDaemon from '../../daemons/back/UpdateCardsDaemon'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

import { BlocksoftTransferUtils } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import config from '../../config/config'
import { SendActions } from '../../appstores/Stores/Send/SendActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import { Cards } from '../../services/Cards/Cards'

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window')

let CACHE_INIT_KEY = false

const V3_API = 'https://api.v3.trustee.deals'

class MainV3DataScreen extends Component {

    constructor() {
        super()
        this.state = {
            show: false,
            inited: false,
            apiUrl: 'https://testexchange.trustee.deals/waiting',
            homePage: false,
            countedFees: {},
            selectedFee: {}
        }
    }

    init = async () => {

        const { currencyCode } = this.props.cryptoCurrency

        const prev = NavStore.getPrevRoute().routeName

        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        const { tradeType } = this.props.exchangeStore
        const type = this.props.navigation.getParam('tradeType')

        let apiUrl = await ApiV3.initData(type ? type : tradeType, prev === 'AccountScreen' && currencyCode)

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
            const { error, backToOld, close, homePage, cardData, tradeType, takePhoto, scanCard, deleteCard,
                updateCard, orderData, injectScript, currencySelect, dataSell, didMount, navigationState, message, exchangeStatus, useAllFunds } = allData

            Log.log('Trade/MainV3Screen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
                return
            }

            if (backToOld) {
                if (tradeType === 'SELL') {
                    AsyncStorage.setItem('isNewInterfaceSell', 'false')
                } else if (tradeType === 'BUY') {
                    AsyncStorage.setItem('isNewInterfaceBuy', 'false')
                }
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.goNext('HomeScreen')
            }

            if (typeof homePage !== 'undefined' && (homePage === true || homePage === false)) {

                this.setState({
                    homePage
                })
                return
            }

            if (cardData) {
                Log.log('Trade/MainV3Screen.onMessage cardData', cardData)
                if (typeof cardData.actionType === 'undefined' || cardData.actionType === 'ADD') {
                    this.onSaveCard(cardData)
                }
            } else if (takePhoto) {
                Log.log('Trade/MainV3Screen.onMessage takePhoto' + JSON.stringify(takePhoto))
                this.onTakePhoto(typeof takePhoto.number === 'undefined' ? { number: takePhoto } : takePhoto) // внимательно проверяй что внутри функций
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

            if (dataSell) {
                this.sellV3(dataSell)
            }

        } catch {
            Log.err('Trade/MainV3Screen.onMessage parse error ', event.nativeEvent)
        }
    }

    async sellV3(data) {
        // console.log('Trade/MainV3Screen dataSell', JSON.stringify(data))
        try {
            Log.log('Trade/MainV3Screen dataSell', data)
            await SendActions.startSend({
                gotoReceipt: true,
                addressTo: data.address,
                amountPretty: data.amount.toString(),
                memo: data.memo,
                currencyCode: data.currencyCode,
                isTransferAll: data.useAllFunds,
                bseOrderId: data.orderHash || data.orderId,
                comment: data.comment || '',
                uiType: 'TRADE_SEND',
                uiApiVersion: 'v3',
                uiProviderType: data.providerType // 'FIXED' || 'FLOATING'
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Trade/MainV3Screen.sellV3', e)
            }
            throw e
        }
    }

    async onTakePhoto(cardData) {
        if (!await Camera.checkCameraOn('TRADE/Cards validateCard')) {
            return
        }

        // @ksu check this
        // setLoaderStatus(true)
        try {
            Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery started')
            const res = await Camera.openCameraOrGallery('TRADE/Cards validateCard')
            Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery res', res)

            let showError = true
            let msgError = typeof res.error !== 'undefined' ? res.error : ''
            if (!res) {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery no result')
                msgError += ' no result'
            } else if (res.didCancel) {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery cancelled')
                msgError += ', need to select from gallery'
                if (msgError.indexOf('file path of photo') !== 'undefined') {
                    msgError = strings('tradeScreen.modalError.selectPhoto')
                }
            } else if (res.error) {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery error ', res.error)
                msgError += ' ' + res.error
            } else if (typeof res.path === 'undefined' || !res.path || res.path === '') {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery no path')
                msgError += ' no path from gallery'
            } else if (typeof res.base64 === 'undefined' || !res.base64 || res.base64 === '') {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery not loaded from gallery')
                msgError += ' not loaded from gallery'
            } else {
                Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery path ' + res.path)
                this._onTakePhotoInner(res, cardData)
                showError = false
            }

            // setLoaderStatus(false)
            if (showError) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: msgError
                })
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('TRADE/Cards validateCard Camera.openCameraOrGallery error ' + e.message, e)
            }
            // setLoaderStatus(false)
            Log.log('TRADE/Cards validateCard Camera.openCameraOrGallery error ' + e.message)
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

            Log.log('Trade/MainV3Screen._onTakePhotoInner cardData', JSON.parse(JSON.stringify(cardData)))

            let path = response.path

            if (typeof response.path === 'undefined')
                return

            // if (Platform.OS === 'ios') {
            //     path = path.substring(path.indexOf('/Documents'))
            // }

            if (response.didCancel) {
                Log.log('Trade/MainV3Screen._onTakePhotoInner User cancelled image picker')
            } else if (response.error) {
                Log.log('Trade/MainV3Screen._onTakePhotoInnerImagePicker error ', response.error)
            } else {
                const passData = { alreadySaved: true, photoSource: path }
                if (typeof cardData.number === 'undefined') {
                    Log.log('Trade/MainV3DataScreen._onTakePhotoInner cardData.number === undefined')
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
            Log.err('Trade/MainV3Screen._onTakePhotoInner error ' + e.message)

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
            Log.log('Trade/MainV3DataScreen save cardData' + cardData)
        }
        if (cardData.type === 'visa' || cardData.type === 'mastercard') {
            await this._verifyCard(cardData)
        }
    }

    async _verifyCard(cardData) {
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
                Log.log('Trade/MainV3DataScreen._verifyCard will ask time from server')
                const now = await BlocksoftAxios.get(V3_API + '/data/server-time')
                if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                    msg = now.data.serverTime
                    Log.log('Trade/MainV3DataScreen._verifyCard msg from server ' + msg)
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

            let res = await ApiV3.validateCard(data, 'PROD')

            res = res.data

            await cardDS.updateCard({
                key: {
                    id: cardID
                },
                updateObj: {
                    cardVerificationJson: JSON.stringify(res)
                }
            })

            Log.log('Trade/MainV3Screen res for card ' + cardID, res)

            const cardJson = res
            const numberCard = cardData.number

            if (typeof cardJson !== 'undefined' && cardJson && typeof cardJson.verificationStatus !== 'undefined' &&
                (cardJson.verificationStatus === 'PENDING' || cardJson.verificationStatus === 'WAIT_FOR_PHOTO')) {
                await this.resCardToWebView(numberCard)
            } else {
                this.webref.postMessage(JSON.stringify({ "res": { cardID, res, numberCard } }))
            }

        } catch (e) {
            Log.err('Trade/MainV3Screen validate e', e)
        }
    }

    async resCardToWebView(numberCard) {
        const cacheJson = await UpdateCardsDaemon.updateCardsDaemon({ force: true, numberCard })
        let cardStatus = cacheJson
        let card
        if (typeof cacheJson === 'undefined' || !cacheJson) {
            card = await cardDS.getCards({ numberCard })

            card = card[0]
            cardStatus = JSON.parse(card.cardVerificationJson)
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
            Log.err('Trade/Cards deleteCard error ' + e.message)
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
        Log.log('Trade/MainV3DataScreen card updated')

        if (item.type === 'visa' || item.type === 'mastercard') {
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
            this.webref.postMessage(JSON.stringify({ fees: { countedFees: 'notUsedNotPassed', selectedFee: 'notUsedNotPassed', amount } }))
            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Trade/MainV3Screen.handleTransferAll', e)
            }

            Log.errorTranslate(e, 'Trade/MainV3Screen.handleTransferAll', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

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
                style={{ backgroundColor: colors.common.header.bg, position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center' }}
                color={this.context.colors.common.text2}
            />
        )
    }

    render() {

        const { colors, isLight } = this.context

        this.init()
        firebase.analytics().setCurrentScreen('Trade.MainV3Screen')

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
                            style={{ flexGrow: 1 }}>
                            <WebView
                                ref={webView => (this.webref = webView)}
                                javaScriptEnabled={true}
                                source={{ uri: this.state.apiUrl }}
                                injectedJavaScript={INJECTEDJAVASCRIPT}
                                scalesPageToFit={false}
                                scrollEnabled={false}
                                style={{ flex: 1 }}
                                renderError={(e) => {
                                    Log.err('Trade.WebViewMainScreen.render error ' + e)
                                    this.modal()
                                }}
                                onError={(e) => {
                                    Log.err('Trade.WebViewMainScreen.on error ' + e.nativeEvent.title + ' ' + e.nativeEvent.description)
                                    this.modal()
                                }}
                                onHttpError={(e) => {
                                    Log.log('Trade.WebViewMainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                    this.modal()
                                }}
                                onMessage={e => {
                                    this.onMessage(e)
                                }}
                                onLoadProgress={(e) => {
                                    Log.log('Trade.WebViewMainScreen.on load progress ' + e.nativeEvent.title + ' ' + e.nativeEvent.progress)
                                }}
                                onContentProcessDidTerminate={(e) => {
                                    Log.log('Trade.WebViewMainScreen.on content terminate ' + e.nativeEvent.title)
                                }}
                                onShouldStartLoadWithRequest={(e) => {
                                    Log.log('Trade.WebViewMainScreen.on start load with request ' + e.navigationType)
                                    return true
                                }}
                                // onLoadStart={StatusBar.setBarStyle('dark-content')}
                                // onLoad={StatusBar.setBarStyle('dark-content')}
                                useWebKit={true}
                                startInLoadingState={true}
                                renderLoading={this.renderLoading}
                            />
                        </KeyboardAvoidingView> : 
                        <>
                            {this.renderLoading()}
                        </>
                        }
                </View>
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
        exchangeStore: state.exchangeStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

MainV3DataScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(MainV3DataScreen)

const styles = {
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
}
