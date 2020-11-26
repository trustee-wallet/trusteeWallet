/**
 * @version 0.1
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
    Linking,
    Keyboard
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
import FileSystem from '../../services/FileSystem/FileSystem'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import { check, request, PERMISSIONS } from 'react-native-permissions'
import ImagePicker from 'react-native-image-picker'
import { CardIOModule, CardIOUtilities } from 'react-native-awesome-card-io'
import countriesDict from '../../assets/jsons/other/country-codes'
import Validator from '../../services/UI/Validator/Validator'
import valid from 'card-validator'
import _ from 'lodash'
import axios from 'axios'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateCardsDaemon from '../../daemons/back/UpdateCardsDaemon'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import store from '../../store'
import { setSendData } from '../../appstores/Stores/Send/SendActions'

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
            imagePickerOptions: {
                title: 'Select Avatar',
                customButtons: [{ name: '', title: '' }]
                // storageOptions: {
                //     cameraRoll: true
                // },
            },
        }
    }

    init = async () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        const { tradeType } = this.props.exchangeStore
        const type = this.props.navigation.getParam('tradeType')

        let apiUrl = await ApiV3.initData(type ? type : tradeType)
        console.log(apiUrl)
        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl
            })
        }, 10)

    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.addListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( 'dark-content' );
    }

    componentWiilUnmount() {
        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.removeListener( 'keyboardWillShow', this.onKeyboardShow );
	    StatusBar.setBarStyle( 'dark-content' );
    }

    onKeyboardShow = () => {
        StatusBar.setBarStyle( 'dark-content' );
    }

    handlerBackPress = () => {
        if (this.webref) {
            if (this.state.homePage) {
                this.setState({
                    homePage: false
                })
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
                const countryCode = await this.getCountryCode(value)

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

    getCountryCode = async (numberCard) => {
        try {
            numberCard = numberCard.split(' ').join('')

            const link = 'https://lookup.binlist.net/' + numberCard
            Log.log('Trage/MainV3Screeen.getCountryCode getCountryCode axios ' + link)
            const res = await axios.get(link)

            return res.data.country.numeric
        } catch (e) {
            Log.err('Card.getCurrencyCode error ' + e.message)
        }

        return false
    }

    onMessage(event) {
        try {
            const allData = JSON.parse(event.nativeEvent.data)
            const { error, backToOld, close, homePage, cardData, tradeType, takePhoto, scanCard, deleteCard, 
                updateCard, orderData, injectScript, currencySelect, dataSell, didMount, navigationState, message, exchangeStatus } = allData

            Log.log('Trade/MainV3Screen.onMessage parsed', event.nativeEvent.data)

            if (error || close) {
                NavStore.goNext('HomeScreen')
                return
            }

            if (backToOld) {
                if (tradeType === 'SELL') {
                    AsyncStorage.setItem('isNewInterfaceSell', 'false')
                } else if (tradeType === 'BUY') {
                    AsyncStorage.setItem('isNewInterfaceBuy', 'false')
                }
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
                this.onTakePhoto(typeof takePhoto.number === 'undefined' ? {number : takePhoto} : takePhoto) // внимательно проверяй что внутри функций
            } else if (scanCard) {
                this.handleScan()
            } else if (deleteCard) {
                this.onDeleteCard(deleteCard)
            } else if (updateCard) {
                this.onUpdateCard(updateCard)
            }

            if (injectScript && orderData) {
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

    sellV3(dataSell) {

        const { accountList } = store.getState().accountStore
        const walletHash = store.getState().mainStore.selectedWallet.walletHash
        const account = accountList[walletHash]

        const { cryptoCurrencies } = store.getState().currencyStore
        const cryptoCurrencyNew = _.find(cryptoCurrencies, { currencyCode: dataSell.currencyCode})

        const dataToScreen = {
            disabled: true,
            address: dataSell.address,
            value: dataSell.amount.toString(),
            account: account[dataSell.currencyCode],
            cryptoCurrency: cryptoCurrencyNew,
            description: strings('send.descriptionExchange'),
            useAllFunds: dataSell.useAllFunds,
            type: 'TRADE_SEND',
            copyAddress: true,
            toTransactionJSON: {
                bseOrderID: dataSell.orderId
            }
        }

        if (typeof dataSell.memo !== 'undefined') {
            dataToScreen.destinationTag = dataSell.memo
        }

        MarketingEvent.startSell({
            orderId: dataSell.orderId + '',
            currencyCode: dataToScreen.cryptoCurrency.currencyCode,
            addressFrom: dataToScreen.account.address,
            addressFromShort: dataToScreen.account.address ? dataToScreen.account.address.slice(0, 10) : 'none',
            addressTo: dataToScreen.address,
            addressAmount: dataToScreen.value,
            walletHash: dataToScreen.account.walletHash
        })

        setSendData(dataToScreen)

        NavStore.goNext('SendScreen')
    }

    async onTakePhoto(cardData) {
        const { imagePickerOptions } = this.state

        Log.log('Trade/MainV3Screen onTakePhoto cardData', cardData)
        const _this = this
        try {
            request(
                Platform.select({
                    android: PERMISSIONS.ANDROID.CAMERA,
                    ios: PERMISSIONS.IOS.CAMERA
                })
            ).then((res) => {
                // setLoaderStatus(true)
                ImagePicker.launchCamera(imagePickerOptions, (response) => {
                    if (typeof response.error === 'undefined') {
                        _this._onTakePhotoInner(response, cardData)
                    } else {
                        Log.log('Trade/MainV3Screen ImagePicker.launchCamera error ' + response)
                        showModal({
                            type: 'INFO_MODAL',
                            icon: 'INFO',
                            title: strings('modal.openSettingsModal.title'),
                            description: response.error
                        })
                        // setLoaderStatus(false)
                    }
                })
            })
        } catch (e) {
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

            let path = response.uri

            if (typeof response.uri === 'undefined')
                return

            if (Platform.OS === 'ios') {
                path = path.substring(path.indexOf('/Documents'))
            }

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
                    verification_server: 'V3'
                }]
            })
            Log.log('Trade/MainV3DataScreen save cardData' + cardData)
        }

        await this._verifyCard(cardData)
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
            const cashbackToken = MarketingEvent.DATA.LOG_CASHBACK
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
                const fs = new FileSystem()
                const base64 = await fs.handleImageBase64(cardData.photoSource)
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

            if (typeof cardJson !== 'undefined' && cardJson && typeof cardJson.verificationStatus !== 'undefined' && cardJson.verificationStatus === 'PENDING' || cardJson.verificationStatus === 'WAIT_FOR_PHOTO') {
                await this.resCardToWebView(numberCard)
            } else {
                this.webref.postMessage(JSON.stringify({ "res": { cardID, res, numberCard } }))
            }

        } catch (e) {
            Log.err('Trade/MainV3Screen validate e', e)
        }
    }

    async resCardToWebView (numberCard) {
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
            setTimeout(async() => {
                await this.resCardToWebView(numberCard)
            }, 60e3) //60 sec
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
            walletHash: item.walletHash
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
        if (typeof item.number !== 'undefined') {
            await this._verifyCard(item)
        }
    }

    modal(){
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: null,
            description: strings('modal.modalV3.description')
        },() => {
            NavStore.goNext('HomeScreen')
        })
    }

    render() {

        this.init()
        firebase.analytics().setCurrentScreen('Trade.MainV3Screen')

        const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta)`

        return (
            <View style={styles.wrapper}>
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
                                onLoadStart={StatusBar.setBarStyle('dark-content')}
                                onLoad={StatusBar.setBarStyle('dark-content')}
                                useWebKit={true}
                                startInLoadingState={true}
                            />
                        </KeyboardAvoidingView> : null}
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
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

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
