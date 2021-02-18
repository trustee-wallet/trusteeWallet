/**
 * @version 0.11
 */
import React, {Component} from 'react'

import {View, Text, RefreshControl, ScrollView} from 'react-native'
import {connect} from 'react-redux'
import AsyncStorage from '@react-native-community/async-storage'

import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import {setExchangeData} from '../../appstores/Stores/Exchange/ExchangeActions'
import {setLoaderStatus} from '../../appstores/Stores/Main/MainStoreActions'
import {showModal} from '../../appstores/Stores/Modal/ModalActions'

import updateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'

import {strings} from '../../services/i18n'
import Api from '../../services/Api/Api'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import TmpConstants from './elements/TmpConstants'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import Log from '../../services/Log/Log'
import config from '../../config/config'

class ConfirmScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            visible: false
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const orderData = this.props.navigation.getParam('orderData')
        if (typeof orderData.checkTmp !== 'undefined' && typeof orderData.selectedCard !== 'undefined') {
            if (typeof TmpConstants.CACHE_CARD !== 'undefined' && typeof TmpConstants.CACHE_CARD.number !== 'undefined') {
                orderData.selectedCard = TmpConstants.CACHE_CARD
            }
        }
        this.setState({
            ...orderData,
            visible: true
        })
    }

    handleEdit = () => {
        NavStore.goBack()
    }

    handleSubmitTrade = () => {
        const {
            exchangeStore
        } = this.props

        if (exchangeStore.tradeType === 'BUY') {
            this.handleBuySubmit()
        } else {
            this.handleSellSubmit()
        }
    }

    handleConvertToPaymentCurrency = (fromCurrency, amount) => {
        if (!amount || typeof amount === 'undefined') return 0
        return (1 * amount).toFixed(2)
    }

    handleBuySubmit = async () => {

        AsyncStorage.setItem('TRADE_BUY_DATA', JSON.stringify({lastBuyCache: this.state}))

        const {
            selectedCard,
            selectedCryptocurrency,
            selectedAccount,
            tradeWay,
            amount,
            uniqueParams
        } = this.state

        const {
            settingsStore,
            currencyStore
        } = this.props

        const {amountEquivalentInCryptoToApi, amountEquivalentInFiatToApi} = amount


        const dataToSend = {
            outAmount: +((+amountEquivalentInCryptoToApi).toFixed(5)),
            inAmount: +((+amountEquivalentInFiatToApi).toFixed(2)),
            locale: settingsStore.data.language.split('-')[0],
            outDestination: selectedAccount.address,
            exchangeWayId: tradeWay.id,
            uniqueParams
        }

        try {

            setLoaderStatus(true)

            const res = await Api.createOrder(dataToSend)

            setLoaderStatus(false)

            setExchangeData({})

            setExchangeData({
                id: res.data.orderId,
                link: res.data.url,
                cardNumber: selectedCard.number,
                expirationDate: selectedCard.expirationDate,
                selectedCryptocurrency,
                uniqueParams
            })

            if (selectedCryptocurrency.currencyCode !== 'BTC') {
                delete dataToSend.uniqueParams.segwitOutDestination
            }

            NavStore.goNext('SMSCodeScreen')


            const findCryptocurrency = currencyStore.cryptoCurrencies.find(item => item.currencyCode === selectedCryptocurrency.currencyCode)

            if (findCryptocurrency.isHidden) {
                currencyActions.toggleCurrencyVisibility({
                    currencyCode: selectedCryptocurrency.currencyCode,
                    isHidden: 1
                })
            }

        } catch (e) {
            setLoaderStatus(false)

            const msg = Api.checkError(e, 'confirmScreen.confirmScreenBuy', dataToSend)

            setTimeout(() => {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: msg
                })
            }, 500)
        }

        updateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, source: 'HANDLE_BUY'})
    }

    handleSellSubmit = async () => {
        let dataToSend
        try {
            const {
                selectedFiatCurrency,
                selectedCryptocurrency,
                selectedCard,
                selectedAccount,
                tradeWay,
                minCrypto,
                amount,
                uniqueParams
            } = this.state

            const {
                settingsStore,
                currencyStore,
                exchangeStore
            } = this.props

            const {amountEquivalentInCryptoToApi, amountEquivalentInFiatToApi, useAllFunds} = amount

            dataToSend = {
                inAmount: amountEquivalentInCryptoToApi,
                outAmount: +((+amountEquivalentInFiatToApi).toFixed(2)),
                locale: settingsStore.data.language.split('-')[0],
                exchangeWayId: tradeWay.id,
                refundAddress: selectedAccount.address,
                uniqueParams : uniqueParams
            }

            dataToSend.outDestination = selectedCard.number

            if (tradeWay.outPaywayCode === 'MOBILE_PHONE') {
                dataToSend.outDestination = uniqueParams.phone
            }
            if (tradeWay.outPaywayCode === 'ADVCASH' || tradeWay.outPaywayCode === 'PAYEER' || tradeWay.outPaywayCode === 'PERFECT_MONEY') {
                dataToSend.outDestination = uniqueParams.wallet
            }

            setLoaderStatus(true)

            const res = await Api.createOrder(dataToSend)

            Log.log('Trade/V2 dataSell', res.data)
            if (config.debug.sendLogs) {
                console.log('Trade/V2 dataSell', res.data)
            }

            const bseOrderData = {
                amountReceived: null,
                depositAddress: res.data.address,
                exchangeRate: null,
                exchangeWayType: "SELL",
                inTxHash: null,
                orderId: res.data.orderId,
                outDestination: dataToSend.outDestination.substr(0,2) + '***' + dataToSend.outDestination.substr(-4, 4),
                outTxHash: null,
                payinUrl: null,
                requestedInAmount: {amount: dataToSend.inAmount, currencyCode: selectedCryptocurrency.currencyCode},
                requestedOutAmount: {amount: dataToSend.outAmount, currencyCode: tradeWay.outCurrencyCode},
                status: "pending_payin"
            }

            SendActions.setUiType({
                ui: {
                    uiType: 'TRADE_SEND',
                    uiApiVersion : 'v2',
                    uiInputAddress: typeof res.data.address !== 'undefined' && res.data.address
                },
                addData: {
                    gotoReceipt: true,
                }
            })
            await SendActions.startSend({
                addressTo : res.data.address,
                amountPretty : res.data.amount.toString(),
                memo : res.data.memo,
                currencyCode : selectedCryptocurrency.currencyCode,
                isTransferAll : useAllFunds,
                bseOrderId: res.data.orderId,
                bseOrderData : bseOrderData,
                bseMinCrypto : minCrypto,
                bseTrusteeFee : {
                    type : exchangeStore.tradeType,
                    value : amount.fee.trusteeFee[exchangeStore.tradeType === 'BUY' ? 'in' : 'out'],
                    currencyCode : selectedCryptocurrency.currencyCode,
                    from : exchangeStore.tradeType === 'BUY' ? selectedFiatCurrency.cc : selectedCryptocurrency.currencyCode,
                    to : exchangeStore.tradeType === 'BUY' ? selectedCryptocurrency.currencyCode : selectedFiatCurrency.cc,
                }
            })

            setLoaderStatus(false)

            const findCryptocurrency = currencyStore.cryptoCurrencies.find(item => item.currencyCode === selectedCryptocurrency.currencyCode)

            if (findCryptocurrency.isHidden) {
                currencyActions.toggleCurrencyVisibility({
                    currencyCode: selectedCryptocurrency.currencyCode,
                    isHidden: 1
                })
            }

        } catch (e) {
            setLoaderStatus(false)

            const msg = Api.checkError(e,'confirmScreen.confirmScreenSell', dataToSend)

            setTimeout(() => {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: msg
                })
            }, 500)

        }

        updateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, source: 'HANDLE_SELL'})
    }

    renderProviderFee = () => {

        const {selectedFiatCurrency, tradeWay} = this.state

        let tmp = ''

        for (let i = 0; i < tradeWay.providerFee['in'].length; i++) {
            i ? tmp = tmp + ' + ' : null

            if (tradeWay.providerFee['in'][i].type === 'percent')
                tmp = tmp + tradeWay.providerFee['in'][i].amount + ' %'

            if (tradeWay.providerFee['in'][i].type === 'fixed') {
                tmp = tmp + (1 * (tradeWay.providerFee['in'][i].amount).toFixed(2)) + ' ' + selectedFiatCurrency.cc
            }
        }

        return tmp
    }

    renderOutputFee = () => {

        const {selectedFiatCurrency, selectedCryptocurrency, tradeWay} = this.state
        const {exchangeStore} = this.props

        let tmp = ''

        for (let i = 0; i < tradeWay.providerFee['out'].length; i++) {
            i ? tmp = tmp + ' + ' : null

            if (tradeWay.providerFee['out'][i].type === 'percent')
                tmp = tmp + tradeWay.providerFee['out'][i].amount + ' %'

            if (tradeWay.providerFee['out'][i].type === 'fixed' && exchangeStore.tradeType === 'SELL') {
                tmp = tmp + this.handleConvertToPaymentCurrency(tradeWay.outCurrencyCode, tradeWay.providerFee['out'][i].amount) + ' ' + selectedFiatCurrency.cc
            }

            if (tradeWay.providerFee['out'][i].type === 'fixed' && exchangeStore.tradeType === 'BUY') {
                tmp = tmp + tradeWay.providerFee['out'][i].amount + ' ' + selectedCryptocurrency.currencySymbol
            }
        }

        return tmp
    }

    renderInfo = () => {

        const {selectedAccount, selectedCard, tradeWay, uniqueParams} = this.state
        const {exchangeStore} = this.props

        let outTitle = ''
        let outValue = ''
        let outValue2 = ''

        if (exchangeStore.tradeType === 'BUY') {
            outTitle = strings('confirmScreen.withdrawAddress')
            const address = typeof selectedAccount.showAddress === 'undefined' ? selectedAccount.address : selectedAccount.showAddress
            outValue = BlocksoftPrettyStrings.makeCut(address, 6, 4)
        } else if (tradeWay.outPaywayCode === 'MOBILE_PHONE') {
            outTitle = strings('confirmScreen.withdrawPhoneNumber')
            outValue = uniqueParams.phone
        } else if (tradeWay.outPaywayCode === 'ADVCASH' || tradeWay.outPaywayCode === 'PAYEER' || tradeWay.outPaywayCode === 'PERFECT_MONEY') {
            outTitle = strings('confirmScreen.withdrawAdvAccountNumber')
            outValue = uniqueParams.wallet
            if (uniqueParams.email && tradeWay.outPaywayCode === 'ADVCASH') {
                outValue2 = uniqueParams.email
            }
        } else {
            outTitle = strings('confirmScreen.withdrawCardNumber')
            outValue = selectedCard.number.replace(/^.{12}/g, '**** **** **** ')
        }


        return outValue2 ? (
            <View style={styles.wrapper__bottom}>
                <View style={styles.wrapper__row}>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                        {outTitle}
                    </Text>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                        {outValue}
                    </Text>
                </View>
                <View style={styles.wrapper__row}>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>

                    </Text>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                        {outValue2}
                    </Text>
                </View>
            </View>
        ) : (
            <View style={styles.wrapper__bottom}>
                <View style={styles.wrapper__row}>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                        {outTitle}
                    </Text>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                        {outValue}
                    </Text>
                </View>
            </View>
        )
    }

    renderRate = (amount) => {
        return amount
    }

    renderCurrencyName = (selectedCryptocurrency) => {

        if (selectedCryptocurrency.currencyCode === 'USDT') {
            let extend = BlocksoftDict.getCurrencyAllSettings(selectedCryptocurrency.currencyCode)
            extend = typeof extend.addressCurrencyCode !== 'undefined' ? BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName : ''

            // return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + extend
            return selectedCryptocurrency.currencySymbol + ' ' + extend
        } else if (selectedCryptocurrency.currencyCode === 'ETH_USDT') {
            // return selectedCryptocurrency.currencySymbol + ' ' + selectedCryptocurrency.currencyName + ' ' + 'ERC20'
            return selectedCryptocurrency.currencySymbol + ' ' + 'ERC20'
        } else {
            return selectedCryptocurrency.currencyName
        }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    render() {
        UpdateOneByOneDaemon.pause()
        const {selectedCryptocurrency, selectedFiatCurrency, tradeWay, amount, visible} = this.state

        const {exchangeStore} = this.props

        const submitBtnFix = exchangeStore.tradeType === 'BUY' ? strings('confirmScreen.submitBtnBuy') + ' ' + selectedCryptocurrency.currencySymbol : strings('confirmScreen.submitBtnSell') + ' ' + selectedCryptocurrency.currencySymbol
        const fiatField = exchangeStore.tradeType === 'BUY' ? 'inCurrencyCode' : 'outCurrencyCode'


        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('confirmScreen.title')}
                    backAction={this.closeAction}
                    closeAction={this.closeAction}
                />
                <ScrollView
                    ref={(ref) => this.scrollView = ref}
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={this.onScroll}
                    onScrollEndDrag={this.onScroll}
                    onMomentumScrollStart={this.onScroll}
                    onMomentumScrollEnd={this.onScroll}>
                    {
                        visible ?
                            <View style={styles.wrapper__content}>
                                <View style={styles.wrapper__top}>
                                    <View style={styles.wrapper__row}>
                                        <View style={styles.wrapper__column__footer}>
                                            <Text style={styles.wrapper__title}>
                                                {exchangeStore.tradeType === 'BUY' ? strings('tradeScreen.youGet') : strings('tradeScreen.youGive')}
                                            </Text>
                                            <Text style={styles.wrapper__title}>
                                                {this.renderCurrencyName(selectedCryptocurrency)}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[styles.wrapper__text, styles.wrapper__text_40, styles.buttons__total, {
                                                fontSize: 16,
                                                alignSelf: 'flex-end'
                                            }]}>
                                            {exchangeStore.tradeType === 'BUY' ? '~' : ''} {1 * (amount.amountEquivalentInCryptoToApi).slice(0, (amount.amountEquivalentInCryptoToApi.indexOf('.')) + 6)}
                                            {' ' + selectedCryptocurrency.currencySymbol}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.line}/>
                                <View>
                                    <View style={[styles.wrapper__row, styles.wrapper__row_title]}>
                                        <Text style={styles.wrapper__title}>
                                            {strings('confirmScreen.fees')}
                                        </Text>
                                    </View>
                                    <View style={styles.wrapper__row}>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                            {strings('confirmScreen.rate') + ' 1' + ' ' + selectedCryptocurrency.currencySymbol}
                                        </Text>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                            {'~ ' + this.renderRate(this.handleConvertToPaymentCurrency(tradeWay[fiatField], tradeWay.exchangeRate.amount)) + ' ' + selectedFiatCurrency.cc}
                                        </Text>
                                    </View>
                                    {
                                        this.renderProviderFee() && exchangeStore.tradeType === 'BUY' && tradeWay.inPaywayCode !== 'ADVCASH' ?
                                            <View style={styles.wrapper__row}>
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    flex: 1,
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <Text
                                                        style={[styles.wrapper__text, styles.wrapper__text_99, {marginRight: 4}]}>
                                                        {strings('confirmScreen.providerFee')}
                                                    </Text>
                                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                                        {this.renderProviderFee()}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                                    {this.handleConvertToPaymentCurrency(tradeWay[fiatField], amount.fee.providerFee['in'])} {selectedFiatCurrency.cc}
                                                </Text>
                                            </View> : null
                                    }
                                    <View style={styles.wrapper__row}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            flex: 1,
                                            flexWrap: 'wrap'
                                        }}>
                                            <Text
                                                style={[styles.wrapper__text, styles.wrapper__text_99, {marginRight: 4}]}>
                                                {exchangeStore.tradeType === 'BUY' ? strings('confirmScreen.outputFee') : strings('confirmScreen.providerFee')}
                                            </Text>
                                            <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                                {this.renderOutputFee()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                            {this.handleConvertToPaymentCurrency(tradeWay[fiatField], amount.fee.providerFee['out'])} {selectedFiatCurrency.cc}
                                        </Text>
                                    </View>
                                    <View style={styles.wrapper__row}>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                            {strings('confirmScreen.trusteeFee')} {tradeWay.trusteeFee[exchangeStore.tradeType === 'BUY' ? 'in' : 'out'][0].amount} %
                                        </Text>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                            {this.handleConvertToPaymentCurrency(tradeWay[fiatField], amount.fee.trusteeFee[exchangeStore.tradeType === 'BUY' ? 'in' : 'out'])} {selectedFiatCurrency.cc}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.line}/>
                                {this.renderInfo()}
                                <View style={styles.buttons}>
                                    <View style={[styles.wrapper__row, styles.wrapper__row_buttons]}>
                                        <View style={styles.wrapper__column__footer}>
                                            <Text style={styles.buttons__title}>
                                                {exchangeStore.tradeType === 'SELL' ? strings('tradeScreen.youGet') : strings('tradeScreen.youGive')}
                                            </Text>
                                            <Text style={styles.buttons__title}>
                                                {selectedFiatCurrency.cc}
                                            </Text>
                                        </View>
                                        <Text style={{...styles.buttons__total, alignSelf: 'flex-end'}}>
                                            {exchangeStore.tradeType === 'SELL' ? '~' : ''} {1 * (+amount.amountEquivalentInFiat).toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={[styles.wrapper__row, styles.wrapper__row_buttons]}>
                                        <Text
                                            style={{
                                                fontFamily: 'SFUIDisplay-Semibold',
                                                color: '#404040',
                                                fontSize: 14
                                            }}>
                                            {strings('confirmScreen.bottomInformation')}
                                        </Text>
                                    </View>
                                    <View style={styles.wrapper__row}>
                                        <ButtonLine styles={{flex: 1}} press={this.handleEdit}>
                                            {strings('confirmScreen.edit')}
                                        </ButtonLine>
                                        <View style={styles.whiteSpace}/>
                                        <Button styles={{flex: 1}} press={this.handleSubmitTrade}>
                                            {submitBtnFix}
                                        </Button>
                                    </View>
                                </View>
                            </View> : null
                    }
                </ScrollView>
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
        currencyStore: state.currencyStore
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
        flexWrap: 'nowrap',

        paddingHorizontal: 30,
        marginTop: 8
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
        flexDirection: 'row',
        flexWrap: 'wrap',
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
        marginBottom: 20
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
