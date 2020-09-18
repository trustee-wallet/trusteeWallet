/**
 * @version 0.11
 */
import React, {Component} from 'react'

import {View, Text, Dimensions, PixelRatio} from 'react-native'
import {connect} from 'react-redux'
import AsyncStorage from '@react-native-community/async-storage'

import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'

import {setLoaderStatus} from '../../appstores/Stores/Main/MainStoreActions'
import {showModal} from '../../appstores/Stores/Modal/ModalActions'
import {setSendData} from '../../appstores/Stores/Send/SendActions'

import MarketingEvent from '../../services/Marketing/MarketingEvent'

import updateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'

import Log from '../../services/Log/Log'
import {strings, sublocale} from '../../services/i18n'
import Api from '../../services/Api/Api'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import {capitalize} from '../../services/UI/Capitalize/Capitalize'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'

const {width: SCREEN_WIDTH} = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8
}

class ExchangeConfirmScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            visible: false
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const orderData = this.props.navigation.getParam('orderData')
        this.setState({
            ...orderData,
            visible: true
        })
    }

    handleEdit = () => {
        NavStore.goBack()
    }

    handleSubmitTrade = async () => {

        let dataToSend

        const {
            selectedInCurrency,
            selectedInAccount,
            selectedOutCurrency,
            selectedOutAccount,
            prevInAccount,
            prevOutAccount,
            tradeWay,
            amount,
            uniqueParams
        } = this.state

        try {
            AsyncStorage.setItem('TRADE_EXCHANGE_DATA', JSON.stringify({lastSellCache: this.state}))

            const {
                currencyStore
            } = this.props

            const {amountEquivalentInCryptoToApi, amountEquivalentOutCryptoToApi, useAllFunds} = amount

            dataToSend = {
                inAmount: amountEquivalentInCryptoToApi,
                outAmount: amountEquivalentOutCryptoToApi,
                locale: sublocale(),
                outDestination: selectedOutAccount.address,
                exchangeWayId: tradeWay.id,
                refundAddress: selectedInAccount.address,
                currencyCode: selectedInAccount.currencyCode,
                outCurrencyCode: selectedOutAccount.currencyCode,
            }

            if (dataToSend.outCurrencyCode === dataToSend.currencyCode) {
                Log.err('EXC/ConfirmScreen bad data to send (same codes) ' + dataToSend.outCurrencyCode + ' ' + dataToSend.currencyCode + ' ' + JSON.stringify({dataToSend, prevInAccount, prevOutAccount}))
            }

            let res = false

            setLoaderStatus(true)

            res = await Api.createOrder(dataToSend)

            const dataToScreen = {
                disabled: true,
                address: res.data.address,
                value: res.data.amount.toString(),
                account: selectedInAccount,
                cryptoCurrency: selectedInCurrency,
                description: strings('send.descriptionExchange'),
                useAllFunds,
                type: 'TRADE_SEND',
                copyAddress: true,
                toTransactionJSON: {
                    bseOrderID: res.data.orderId
                }
            }

            if (typeof res.data.memo !== 'undefined') {
                dataToScreen.destinationTag = res.data.memo
            }

            MarketingEvent.startExchange({
                orderId: res.data.orderId + '',
                currencyCode: selectedInAccount.currencyCode,
                outCurrencyCode: selectedOutAccount.currencyCode,
                addressFrom: dataToScreen.account.address,
                addressFromShort: dataToScreen.account.address ? dataToScreen.account.address.slice(0, 10) : 'none',
                addressTo: dataToScreen.address,
                addressAmount: dataToScreen.value,
                walletHash: dataToScreen.account.walletHash
            })

            setSendData(dataToScreen)

            NavStore.goNext('SendScreen')

            setLoaderStatus(false)

            const findCryptocurrency = currencyStore.cryptoCurrencies.find(item => item.currencyCode === selectedOutCurrency.currencyCode)

            if (findCryptocurrency.isHidden) {
                currencyActions.toggleCurrencyVisibility({
                    currencyCode: selectedOutCurrency.currencyCode,
                    isHidden: 1
                })
            }

        } catch (e) {
            setLoaderStatus(false)

            const msg = Api.checkError(e, 'confirmScreen.confirmScreenSell', dataToSend, {
                selectedInCurrency,
                selectedInAccount,
                selectedOutCurrency,
                selectedOutAccount,
                prevInAccount,
                prevOutAccount,
                tradeWay,
                amount,
                uniqueParams
            })

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

        const {selectedInCurrency, tradeWay} = this.state

        let tmp = []

        for (let i = 0; i < tradeWay.providerFee['in'].length; i++) {

            if (tradeWay.providerFee['in'][i].amount === 0) continue

            if (tradeWay.providerFee['in'][i].type === 'percent') {
                tmp.push(tradeWay.providerFee['in'][i].amount + ' %')
            }

            if (tradeWay.providerFee['in'][i].type === 'fixed') {
                tmp.push(1 * (tradeWay.providerFee['in'][i].amount).toFixed(2)) + ' ' + selectedInCurrency.currencySymbol
            }
        }

        if (tmp.length === 0) {
            return ''
        }
        tmp = tmp.join(' + ')


        Log.log('EXC/ConfirmScreen renderProviderFee ' + tmp)

        return tmp
    }

    renderOutputFeeFirst = () => {

        const {selectedInCurrency, selectedOutCurrency, tradeWay} = this.state
        const {exchangeStore} = this.props

        let tmp = []
        for (let i = 0; i < tradeWay.providerFee['out'].length; i++) {

            if (tradeWay.providerFee['out'][i].type === 'percent') {
                tmp.push(tradeWay.providerFee['out'][i].amount + ' %')
            }
        }

        tmp = tmp.join(' + ')

        Log.log('EXC/ConfirmScreen renderOutputFeeFirst ' + tmp)

        return tmp
    }

    renderOutputFeeSecond = () => {

        const {selectedInCurrency, selectedOutCurrency, tradeWay} = this.state
        const {exchangeStore} = this.props

        let tmp = []

        for (let i = 0; i < tradeWay.providerFee['out'].length; i++) {
            if (tradeWay.providerFee['out'][i].type === 'fixed') {
                tmp.push(tradeWay.providerFee['out'][i].amount + ' ' + selectedOutCurrency.currencySymbol)
            }
        }

        tmp = tmp.join(' + ')

        Log.log('EXC/ConfirmScreen renderOutputFeeSecond ' + tmp)

        return tmp
    }

    renderInfo = () => {
        const {selectedOutAccount} = this.state

        return (
            <View style={styles.wrapper__bottom}>

                <View style={styles.wrapper__row}>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                        {strings('confirmScreen.withdrawAddress')}
                    </Text>
                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                        {selectedOutAccount.address.slice(0, 6) + '...' + selectedOutAccount.address.slice(selectedOutAccount.address.length - 4, selectedOutAccount.address.length)}
                    </Text>
                </View>

            </View>
        )
    }

    renderCurrencyName = (selectedCryptocurrency) => {

        if (selectedCryptocurrency.currencyCode === 'USDT') {
            return selectedCryptocurrency.currencySymbol + ' OMNI'
        } else if (selectedCryptocurrency.currencyCode === 'ETH_USDT') {
            return selectedCryptocurrency.currencySymbol + ' ERC20'
        } else {
            return selectedCryptocurrency.currencyName
        }
    }


    renderTrusteeFee = () => {
        const {tradeWay} = this.state
        Log.log('EXC/ConfirmScreen.renderTrusteeFee', tradeWay)


        if (typeof tradeWay === 'undefined' || !tradeWay || typeof tradeWay.trusteeFee === 'undefined' || !tradeWay.trusteeFee) {
            return ''
        }

        const inFee = tradeWay.trusteeFee.in
        const outFee = tradeWay.trusteeFee.out


        let tmp = inFee.find(item => item.type === 'percent')
        if (typeof tmp !== 'undefined' && tmp.amount > 0) return tmp.amount + ' %'

        tmp = outFee.find(item => item.type === 'percent')
        if (typeof tmp !== 'undefined' && tmp.amount > 0) return tmp.amount + ' %'

        return '0 %'
    }

    renderTrusteeFeeAmounts = () => {
        const {selectedInCurrency, selectedOutCurrency, amount} = this.state

        if (typeof amount === 'undefined' || !amount || typeof amount.fee === 'undefined') {
            return ''
        }
        Log.log('EXC/ConfirmScreen.renderTrusteeFeeAmounts', amount)

        if (typeof amount.fee.trusteeFee === 'undefined') {
            return `0.00 ${selectedOutCurrency.currencySymbol}`
        }

        let numbersSize = 5
        if (selectedOutCurrency.currencyCode === 'USDT' || selectedOutCurrency.currencyCode === 'ETH_USDT') {
            numbersSize = 2
        }
        const prettyOut = BlocksoftPrettyNumbers.makeCut(amount.fee.trusteeFee.out, numbersSize).cutted

        if (amount.fee.trusteeFee.in === 0) {
            if (amount.fee.trusteeFee.out === 0) {
                return `0.00 ${selectedOutCurrency.currencySymbol}`
            }
            return `${prettyOut} ${selectedOutCurrency.currencySymbol}`
        }

        return `${amount.fee.trusteeFee.in} ${selectedInCurrency.currencySymbol} | ${prettyOut} ${selectedOutCurrency.currencySymbol}`
    }


    render() {
        UpdateOneByOneDaemon.pause()

        const {selectedInCurrency, selectedOutCurrency, tradeWay, amount, visible} = this.state

        const fiatField = 'outCurrencyCode'

        let submitBtnFix = strings('exchangeConfirmScreen.exchangeBtn') + ' ' + selectedInCurrency.currencySymbol
        if (SIZE === 8) {
            submitBtnFix = strings('exchangeConfirmScreen.exchangeBtn')
        }
        let numbersSize = 5
        if (selectedOutCurrency.currencyCode === 'USDT' || selectedOutCurrency.currencyCode === 'ETH_USDT') {
            numbersSize = 2
        }

        let ratePrep = 0
        let youGetPrep = 0
        let rateAmountPrep = 1
        let feeInPrep = 0
        let feeOutPrep = 0
        if (typeof tradeWay !== 'undefined' && tradeWay && typeof tradeWay.exchangeRate !== 'undefined') {
            const amountTmp = tradeWay.exchangeRate.amount || 0
            ratePrep = BlocksoftPrettyNumbers.makeCut(amountTmp, numbersSize).cutted
            if (!ratePrep || ratePrep.toString().indexOf('0.000') === 0) {
                rateAmountPrep = 1000
                ratePrep = BlocksoftPrettyNumbers.makeCut(amountTmp * 1000, numbersSize).cutted
            } else {
                ratePrep = BlocksoftPrettyNumbers.makeCut(amountTmp, numbersSize).cutted
            }
            youGetPrep = 1 * (+amount.amountEquivalentOutCrypto)
            youGetPrep = BlocksoftPrettyNumbers.makeCut(youGetPrep, numbersSize).cutted
        }


        if (typeof amount.fee !== 'undefined' && typeof amount.fee.providerFee !== 'undefined') {
            feeInPrep = BlocksoftPrettyNumbers.makeCut(amount.fee.providerFee['in'] || 0, numbersSize).cutted
            feeOutPrep = BlocksoftPrettyNumbers.makeCut(amount.fee.providerFee['out'] || 0, numbersSize).cutted
        }

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('exchangeConfirmScreen.title')}
                />
                {
                    visible ?
                        <View style={styles.wrapper__content}>
                            <View style={styles.wrapper__top}>
                                <View style={styles.wrapper__row}>
                                    <View style={styles.wrapper__column__footer}>
                                        <Text style={styles.wrapper__title}>
                                            {strings('tradeScreen.youGive')}
                                        </Text>
                                        <Text style={styles.wrapper__title}>
                                            {this.renderCurrencyName(selectedInCurrency)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[styles.wrapper__text, styles.wrapper__text_40, styles.buttons__total, {fontSize: 16, alignSelf: 'flex-end'}]}>
                                        {1 * (amount.amountEquivalentInCryptoToApi).slice(0, (amount.amountEquivalentInCryptoToApi.indexOf('.')) + 6)} {selectedInCurrency.currencySymbol}
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
                                        {strings('confirmScreen.rate') + ' ' + rateAmountPrep + ' ' + selectedInCurrency.currencySymbol}
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        {'~ ' + ratePrep + ' ' + selectedOutCurrency.currencySymbol}
                                    </Text>
                                </View>

                                {
                                    this.renderProviderFee() ?
                                        <View style={styles.wrapper__row}>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                flex: 1,
                                                flexWrap: 'wrap'
                                            }}>
                                                <Text
                                                    style={[styles.wrapper__text, styles.wrapper__text_99, {marginRight: 4}]}>
                                                    {strings('exchangeScreen.fee')}
                                                </Text>
                                                <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                                    {this.renderProviderFee()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                                {feeInPrep} {selectedInCurrency.currencySymbol}
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
                                            {strings('exchangeScreen.fee') + ' ' + capitalize(tradeWay.provider)}
                                        </Text>
                                        <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                            {this.renderOutputFeeFirst()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        {feeOutPrep} {selectedOutCurrency.currencySymbol}
                                    </Text>
                                </View>

                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        {strings('confirmScreen.outputFee')}
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        {this.renderOutputFeeSecond()}
                                    </Text>
                                </View>


                                <View style={styles.wrapper__row}>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_99]}>
                                        {strings('confirmScreen.trusteeFee')} {this.renderTrusteeFee()}
                                    </Text>
                                    <Text style={[styles.wrapper__text, styles.wrapper__text_40]}>
                                        {this.renderTrusteeFeeAmounts()}
                                    </Text>
                                </View>

                            </View>
                            <View style={styles.line}/>
                            {this.renderInfo()}
                            <View style={styles.buttons}>
                                <View style={[styles.wrapper__row, styles.wrapper__row_buttons]}>
                                    <View style={styles.wrapper__column__footer}>
                                        <Text style={styles.buttons__title}>
                                            {strings('tradeScreen.youGet')}
                                        </Text>
                                        <Text style={styles.buttons__title}>
                                            {this.renderCurrencyName(selectedOutCurrency)}
                                        </Text>
                                    </View>
                                    <Text style={{...styles.buttons__total, alignSelf: 'flex-end'}}>
                                        {'~'}
                                        {youGetPrep + ' '}
                                        {selectedOutCurrency.currencySymbol}
                                    </Text>
                                </View>
                                <View style={[styles.wrapper__row, styles.wrapper__row_buttons]}>
                                    <Text
                                        style={{fontFamily: 'SFUIDisplay-Semibold', color: '#404040', fontSize: 14}}>
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
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
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

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen)

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
        paddingHorizontal: SIZE * 2 - 2,
        marginTop: 8
    },
    wrapper__column__footer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
    },
    wrapper__row_title: {
        marginTop: SIZE,
        marginBottom: SIZE / 2
    },
    wrapper__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    wrapper__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16
    },
    wrapper__text_99: {
        color: '#999999'
    },
    wrapper__text_40: {
        color: '#404040'
    },
    line: {
        height: 1,
        marginHorizontal: SIZE - 1,
        marginTop: SIZE + 3,

        backgroundColor: '#F3E6FF'
    },
    buttons: {
        marginBottom: 30
    },
    wrapper__row_buttons: {
        marginBottom: 10
    },
    buttons__title: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040',
    },
    buttons__total: {
        fontSize: SIZE > 8 ? 24 : 19,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127AC'
    },
    whiteSpace: {
        width: 15
    }
}
