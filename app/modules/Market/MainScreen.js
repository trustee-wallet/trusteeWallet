/**
 * @version 0.44
 * @author yura
 */

import React, { PureComponent } from 'react'
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
    SafeAreaView,
    Linking
} from 'react-native'

import { WebView } from 'react-native-webview'
import { CardIOModule } from 'react-native-awesome-card-io'
import valid from 'card-validator'
import _ from 'lodash'

import RNFS from 'react-native-fs'

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

import countriesDict from '@assets/jsons/other/country-codes'
import Validator from '@app/services/UI/Validator/Validator'

import { setBseLink, setLoaderFromBse, setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import config from '@app/config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { Cards } from '@app/services/Cards/Cards'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'

import { getBseLink } from '@app/appstores/Stores/Main/selectors'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'


const { height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_INIT_KEY = false
let CASHE_TIME

class MarketScreen extends PureComponent {

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
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.inited) {
            return
        }
        CACHE_INIT_KEY = key
        this.setState({ inited: true })

        // here to do upload
        const inCurrencyCode = NavStore.getParamWrapper(this, 'inCurrencyCode')
        const outCurrencyCode = NavStore.getParamWrapper(this, 'outCurrencyCode')
        const orderHash = NavStore.getParamWrapper(this, 'orderHash')
        const apiUrl = await ApiV3.initData('MARKET', inCurrencyCode, outCurrencyCode, orderHash)

        setTimeout(() => {
            this.setState({
                show: true,
                apiUrl
            })
        }, 10)

        setBseLink(apiUrl)
    }

    refresh = async () => {
        const apiUrl = await ApiV3.initData('MARKET')
        this.webref && this.webref.postMessage(JSON.stringify({ url: apiUrl }))
    }

    diffMinutes = (dt2, dt1) => {
        let diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
    }

    componentDidMount() {
        const { isLight } = this.context

        CASHE_TIME = new Date()

        this.init()

        if (this.props.navigation.dangerouslyGetParent()) {
            this.props.navigation.dangerouslyGetParent().addListener('tabLongPress', (e) => {
                NavStore.reset('MarketScreen')
            });

            this.props.navigation.dangerouslyGetParent().addListener('tabPress', (e) => {
                const currentTime = new Date()
                if ((this.diffMinutes(currentTime, CASHE_TIME) >= 10) || !this.props.bseLink) {
                    e.preventDefault()
                    NavStore.reset('MarketScreen')
                }
            });
        }

        BackHandler.addEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow)
        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
    }

    componentWillUnmount() {
        const { isLight } = this.context

        BackHandler.removeEventListener('hardwareBackPress', this.handlerBackPress)
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow)
        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
    }

    onKeyboardShow = () => {
        const { isLight } = this.context

        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
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

        } else if (name === 'date') {
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
                    name: 'card number',
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
            this.webref && this.webref.postMessage(JSON.stringify({ 'data': cardData }))
        }
    }

    handleAddCurrency = (currencyCode) => {
        if (currencyCode) {
            NavStore.goNext('HomeScreen', { screen: 'AddAssetScreen', params: { currencyCode: currencyCode } })
        } else {
            NavStore.goNext('HomeScreen', { screen: 'AddAssetScreen' })
        }
    }

    getWalletData = async () => {
        const res = await ApiV3.getWalletData()
        this.webref && this.webref.postMessage(JSON.stringify({ walletData: res }))
    }

    onMessage(event) {

        const { isLight } = this.context

        try {
            const allData = JSON.parse(event.nativeEvent.data)
            const {
                error, backToOld, close, homePage, cardData, takePhoto, scanCard, deleteCard,
                updateCard, orderData, injectScript, currencySelect, dataSend, didMount, navigationState, message, exchangeStatus,
                useAllFunds, checkCamera, refreshControl, restart, share, txHash, needActivateCurrency, checkApproveData, orderHistory,
                openUrl, getWalletData
            } = allData

            Log.log('Market/MainScreen.onMessage parsed', event.nativeEvent.data)

            if (error) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.reset('TabBar')
                return
            }

            if (close) {
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
                NavStore.reset('HomeScreen')
                setBseLink(null)
                return
            }

            if (restart) {
                NavStore.reset('MarketScreen')
                return
            }

            if (checkCamera) {
                this.checkCameraForWebView()
            }

            if (needActivateCurrency) {
                this.handleAddCurrency(needActivateCurrency)
            }

            if (getWalletData) {
                this.getWalletData()
            }

            if (backToOld) {
                if (backToOld === 'SELL') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: backToOld })
                } else if (backToOld === 'BUY') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: backToOld })
                } else if (backToOld === 'EXCHANGE') {
                    NavStore.goNext('ExchangeV3Screen')
                }
                StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
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

            if (refreshControl) {
                this.refresh()
            }

            if (share) {
                const shareOptions = { message: share.title + share.description }
                prettyShare(shareOptions, 'murzik_share_transaction')
            }

            if (txHash) {
                NavStore.goNext('HomeScreen', {
                    screen: 'AccountTransactionScreen', params: {
                        txData: {
                            transactionHash: txHash
                        },
                        source : 'Market/MainScreen.onMessage has txHash ' + JSON.stringify(txHash),
                        goBackProps: true
                    }
                })
            }

            if (checkApproveData) {
                this.checkApprove(checkApproveData)
            }

            if (orderHistory) {
                this.saveOrderHistory(orderHistory)
            }

            if (openUrl) {
                this.openUrl(openUrl)
            }

        } catch {
            Log.err('Market/MainScreen.onMessage parse error ', event.nativeEvent)
        }
    }

    async saveOrderHistory (orderHistory) {

        const path = RNFS.DocumentDirectoryPath + '/logs/trusteeOrdersHistory.csv'

        // write the file
        RNFS.writeFile(path, orderHistory.data, 'utf8')
            .then(async () => {
                Log.log('Market/MainScreen saveOrderHistory success save file ', path)
                const fs = new FileSystem({ fileEncoding: 'utf8', fileName: 'trusteeOrdersHistory', fileExtension: 'csv' });

                const shareOptions = {
                    title: orderHistory.title,
                    subject: orderHistory.subject,
                    message: orderHistory.message,
                    url: await fs.getPathOrBase64()
                }

                prettyShare(shareOptions)
            })
            .catch((err) => {
                Log.err('Market/MainScreen saveOrderHistory error save file ', err.message)
            });
    }

    async openUrl (openUrl) {
        const available = await Linking.canOpenURL(openUrl)
        Log.log('Market/MainScreen openUrl available link ', available)

        if (!available) return true
        await Linking.openURL(openUrl)
    }

    async checkCameraForWebView() {
        const res = await Camera.checkCameraOn('Market/MainScreen validateCard')
        this.webref && this.webref.postMessage(JSON.stringify({ cameraRes: res }))
    }

    async send(data) {
        try {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen send data ' + JSON.stringify(data))
            }
            Log.log('Market/MainScreen send data', data)

            if (data?.url) {
                NavStore.goNext('SellCodeScreen', {
                    url: data.url,
                    data: data
                })
                return
            }

            const limits = data.limits ? JSON.parse(data.limits) : false

            // const trusteeFee = data.trusteeFee ? JSON.parse(data.trusteeFee) : false

            const minCrypto = typeof limits.limits !== 'undefined' && limits.limits ? BlocksoftPrettyNumbers.setCurrencyCode(limits.currencyCode).makeUnPretty(limits.limits) : false

            const bseOrderData = {
                amountReceived: null,
                depositAddress: data.address,
                exchangeRate: null,
                exchangeWayType: data.exchangeWayType,
                inTxHash: null,
                orderHash: data.orderHash,
                orderId: data.orderHash,
                outDestination: data.exchangeWayType === 'SELL'
                    ? `${data.outDestination.substr(0, 2)}***${data.outDestination.substr(-4, 4)}`
                    : data.outDestination,
                outTxHash: null,
                payinUrl: null,
                requestedInAmount: { amount: data.amount, currencyCode: data.currencyCode },
                requestedOutAmount: { amount: data.outAmount, currencyCode: data.outCurrency },
                status: 'pending_payin',
                payway: data.payway || null
            }

            let feeData = false
            try {
                if (typeof data.feeData !== 'undefined' && data.feeData ) {
                    feeData = JSON.parse(data.feeData)
                    feeData = typeof feeData.selectedFee !== 'undefined' ? feeData.selectedFee : false
                }
            } catch (e) {
                // do nothing
            }

            const bse = {
                bseProviderType: data.providerType || 'NONE', //  'FIXED' || 'FLOATING'
                bseOrderId: data.orderHash || data.orderId,
                bseMinCrypto: minCrypto,
                bseTrusteeFee: {
                    // value: trusteeFee ? trusteeFee.trusteeFee : 0,
                    // currencyCode: trusteeFee ? trusteeFee.currencyCode : 'USD',
                    value:  data.amount, // to unify with Vlad
                    currencyCode: data.currencyCode, // to unify

                    type: 'MARKET',
                    from: data.currencyCode,
                    to: data.outCurrency
                },
                bseOrderData: bseOrderData,
                forceExecAmount : typeof data.forceExecAmount !== 'undefined' ? data.forceExecAmount : false
            }

            if (typeof data.apiRaw !== 'undefined' && data.apiRaw && typeof data.apiRaw.dexCurrencyCode !== 'undefined' && data.apiRaw.dexCurrencyCode) {
                bse.bseOrderData.status = 'dex'
                await SendActionsStart.startFromDEX({
                        amount: BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.amount),
                        addressTo : data.outDestination,
                        currencyCode: data.currencyCode,
                        dexCurrencyCode : data.apiRaw.dexCurrencyCode,
                        dexOrderData : data.apiRaw.dexOrderData
                    },
                    bse)
                return true
            }

            await SendActionsStart.startFromBSE(data, bse, feeData)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen.send ' + e.message)
            }
            throw e
        }
    }

    async checkApprove(approveData) {
        setLoaderFromBse(true)
        SendActionsStart.startFromWalletConnect({
            currencyCode: approveData.currencyCode,
            walletConnectData: approveData.data[0].params,
            extraData: {
                txCode: approveData.data[0].txCode,
                providerName: approveData.provider,
                currencyCode: approveData.currencyCode
            },
            transactionFilterType : TransactionFilterTypeDict.SWAP
        }, 'TRADE_LIKE_WALLET_CONNECT')
    }

    async onTakePhoto(cardData) {
        if (!await Camera.checkCameraOn('Market/MainScreen validateCard')) {
            const res = await Camera.checkCameraOn('Market/MainScreen validateCard')
            this.webref && this.webref.postMessage(JSON.stringify({ cameraRes: res }))
            if (!res) {
                return
            }
        }

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

            if (showError) {
                this.webref && this.webref.postMessage(JSON.stringify({ notPhoto: true }))

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

            this.webref && this.webref.postMessage(JSON.stringify({ notPhoto: true }))

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
                    card_details_json: cardData.cardDetailsJson,
                    card_check_status: cardData.cardCheckStatus
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
            const saved = await cardDS.getCardByNumber(cardData.number)
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
                    this.webref && this.webref.postMessage(JSON.stringify({ res: { cardID, res, numberCard } }))
                }
            }

        } catch (e) {
            this.webref && this.webref.postMessage(JSON.stringify({ serverError: true }))
            Log.err('Market/MainScreen validate e', e)
        }
    }

    async resCardToWebView(numberCard) {
        try {
            let cardStatus = await UpdateCardsDaemon.updateCardsDaemon({ force: true, numberCard })
            if (typeof cardStatus === 'undefined' || !cardStatus) {
                cardStatus = await cardDS.getCardVerificationJson(numberCard)
            }
            if (config.debug.appErrors) {
                console.log('Market/MainScreen resCardToWebView cardStatus ' + cardStatus.verificationStatus + ' ' + JSON.stringify(cardStatus))
            }

            if (cardStatus.verificationStatus === 'SUCCESS' || cardStatus.verificationStatus === 'CANCELED') {
                this.webref && this.webref.postMessage(JSON.stringify({ 'res': { 'res': cardStatus, numberCard } }))
                return true
            } else {
                this.webref && this.webref.postMessage(JSON.stringify({ 'res': { 'res': cardStatus, numberCard } }))
                setTimeout(async () => {
                    await this.resCardToWebView(numberCard)
                }, 30e3) //30 sec
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Market/MainScreen resCardToWebView error ' + e.message)
            }
            Log.err('Market/MainScreen resCardToWebView error ' + e.message)
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
            card_details_json: item.cardDetailsJson,
            card_check_status: item.cardCheckStatus
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
            const transferData = await SendActionsStart.getTransferAllBalanceFromBSE({ currencyCode, address })
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferData.transferAllBalance, 'V3.sellAll')
            this.webref && this.webref.postMessage(JSON.stringify({ fees: { amount: amount || 0, transferData } }))
            return {
                currencyBalanceAmount: amount,
                currencyBalanceAmountRaw: transferData.transferBalance
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('Market/MainScreen.handleTransferAll', e)
            }

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
            NavStore.reset('HomeScreen')
        })
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size='large'
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

    handleWebViewNavigationStateChange = (navState) => {
        const { isLight } = this.context

        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')
    }

    render() {

        UpdateOneByOneDaemon.pause()

        const { colors, isLight } = this.context

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
                            style={{ flexGrow: 1 }}>
                            <WebView
                                ref={webView => (this.webref = webView)}
                                javaScriptEnabled={true}
                                onNavigationStateChange={this.handleWebViewNavigationStateChange}
                                source={{ uri: this.state.apiUrl }}
                                injectedJavaScript={INJECTEDJAVASCRIPT}
                                scalesPageToFit={false}
                                scrollEnabled={false}
                                style={{ flex: 1 }}
                                renderError={(e, errorCode) => {
                                    Log.err('Market.MainScreen.render error ' + e + ' code ' + errorCode)
                                    this.modal()
                                    NavStore.reset('TabBar')
                                }}
                                onError={(e) => {
                                    const eMsg = e.nativeEvent.title + ' ' + e.nativeEvent.description
                                    if (eMsg.indexOf('net::ERR_TUNNEL_CONNECTION_FAILED') === -1) {
                                        Log.err('Market.MainScreen.on error ' + eMsg)
                                    } else {
                                        Log.log('Market.MainScreen.on error ' + eMsg)
                                    }
                                    this.modal()
                                    NavStore.reset('TabBar')
                                }}
                                onHttpError={(e) => {
                                    Log.log('Market.MainScreen.on httpError ' + e.nativeEvent.title + ' ' + e.nativeEvent.url + ' ' + e.nativeEvent.statusCode + ' ' + e.nativeEvent.description)
                                    this.modal()
                                    NavStore.reset('TabBar')
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
                                allowsInlineMediaPlayback={true}
                                allowsBackForwardNavigationGestures={true}
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

MarketScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        bseLink: getBseLink(state)
    }
}

export default connect(mapStateToProps)(MarketScreen)


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

