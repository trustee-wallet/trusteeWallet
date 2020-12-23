/**
 * @version todo
 * @misha to review
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Keyboard, TouchableWithoutFeedback, Text } from 'react-native'

import Input from '../../../components/elements/Input'

import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import { BlocksoftTransferUtils } from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import Log from '../../../services/Log/Log'
import { strings } from '../../../services/i18n'
import { SendActions } from '../../../appstores/Stores/Send/SendActions'
import config from '../../../config/config'


class AmountInput extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedAmount: '',
            useAllFunds: false,
            amountEquivalentInFiatToApi: '0',
            amountEquivalentInCryptoToApi: '0',
            amountEquivalent: '0',
            moneyType: 'FIAT'
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedFiatCurrency, selectedPaymentSystem, selectedCryptocurrency, selectedFiatTemplate } = nextProps

        if (
            selectedFiatCurrency && typeof selectedPaymentSystem.currencyCode != 'undefined' && typeof selectedCryptocurrency.currencyCode != 'undefined' && selectedFiatTemplate && !selectedFiatTemplate.value
        ) {
            const selectedExchangeWay = this.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)
            if (this.amountInput != null) {
                this.calculateEquivalent(selectedExchangeWay, selectedFiatCurrency, this.amountInput.getValue())
            }
        }
    }

    handleGetAmountEquivalent = () => this.state

    handleSetState = (field, value, callback) => {
        this.setState({ [field]: value }, () => callback())
    }

    handleSetMoneyType = () => {

        let { moneyType, amountEquivalentInFiat, amountEquivalentInCrypto } = this.state

        this.setState({
            moneyType: moneyType === 'FIAT' ? 'CRYPTO' : 'FIAT'
        })

        let toAmountInput = moneyType === 'FIAT' ? amountEquivalentInCrypto : amountEquivalentInFiat
        toAmountInput = toAmountInput == 0 || toAmountInput == '' ? '' : toAmountInput

        this.amountInput.handleInput(toAmountInput, false)
    }

    setInputData = (value) => {
        this.amountInput.handleInput(value)
    }

    handleSellAll = async () => {
        setLoaderStatus(true)

        let errorCurrencyCode = ''
        try {
            const { selectedCryptocurrency, selectedPaymentSystem } = this.props

            const { currencyCode, address } = this.props.selectedAccount
            errorCurrencyCode = currencyCode

            const { addressForEstimateSellAllV2 } = this.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)
            if (config.debug.sendLogs) {
                console.log('TRADE/AmountInput.handleSellAll addressForEstimateSellAll ', addressForEstimateSellAllV2)
            }
            const tmpAddressForEstimate = addressForEstimateSellAllV2 != null ? addressForEstimateSellAllV2 : BlocksoftTransferUtils.getAddressToForTransferAll({ currencyCode, address })

            Log.log('TRADE/AmountInput.handleSellAll start')

            const { transferBalance } = await SendActions.countTransferAllBeforeStartSend({
                currencyCode,
                addressTo: tmpAddressForEstimate
            })
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferBalance, 'amountInput.amount')

            Log.log('TRADE/AmountInput.handleSellAll done with amount ' + amount + ' to address ' + tmpAddressForEstimate)
            if (config.debug.sendLogs) {
                console.log('TRADE/AmountInput.handleSellAll done with amount ' + amount + ' to address ' + tmpAddressForEstimate)
            }

            this.setState({
                moneyType: 'CRYPTO'
            }, () => {
                try {
                    this.amountInput.handleInput(amount.toString())
                } catch (e) {
                    throw new Error(e.message + ' in Trade.AmountInput.handleSellAll')
                }
            })

            this.setState({
                useAllFunds: true
            })

        } catch (e) {
            Log.errorTranslate(e, 'Trade.AmountInput.handleSellAll', errorCurrencyCode)

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

    prepareAndCallEquivalentFunction = (selectedExchangeWay, side, amount) => {

        let equivalentFunctionPrepare = JSON.parse(JSON.stringify(selectedExchangeWay.equivalentFunction))

        for (let item of equivalentFunctionPrepare) {
            if (item !== '{')
                equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
            else
                break
        }

        equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
        equivalentFunctionPrepare = equivalentFunctionPrepare.substring(0, equivalentFunctionPrepare.length - 1)

        const equivalentFunction = new Function('amount', 'side', 'exchangeWayObj', equivalentFunctionPrepare)

        return equivalentFunction(amount, side, selectedExchangeWay)
    }

    getEquivalentSide = () => {

        const { moneyType } = this.state
        const { exchangeStore } = this.props

        let side = ''

        if ((exchangeStore.tradeType === 'BUY' && moneyType === 'FIAT') || (exchangeStore.tradeType === 'SELL' && moneyType === 'CRYPTO')) side = 'IN'
        if ((exchangeStore.tradeType === 'BUY' && moneyType === 'CRYPTO') || (exchangeStore.tradeType === 'SELL' && moneyType === 'FIAT')) side = 'OUT'

        return side
    }


    calculateEquivalent = (selectedExchangeWay, selectedFiatCurrency, amount) => {
        const { moneyType } = this.state
        const { extendsFields } = this.props

        if (!selectedExchangeWay || typeof selectedExchangeWay === 'undefined') {
            return false
        }

        if (moneyType === 'FIAT') {
            if (selectedFiatCurrency.cc !== selectedExchangeWay[extendsFields.fieldForFiatCurrency]) {

                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount * selectedFiatCurrency.rate)

                this.setState({
                    amountEquivalentInFiatToApi: (amount * selectedFiatCurrency.rate).toString(),
                    amountEquivalentInCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInFiat: amount,
                    fee: {
                        providerFee: {
                            in: amountEquivalentInCryptoTmp.providerFee.in,
                            out: amountEquivalentInCryptoTmp.providerFee.out
                        },
                        trusteeFee: {
                            in: amountEquivalentInCryptoTmp.trusteeFee.in,
                            out: amountEquivalentInCryptoTmp.trusteeFee.out
                        }
                    }
                })
            } else {

                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount)

                this.setState({
                    amountEquivalentInFiatToApi: (amount).toString(),
                    amountEquivalentInCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInFiat: amount,
                    fee: {
                        providerFee: amountEquivalentInCryptoTmp.providerFee,
                        trusteeFee: amountEquivalentInCryptoTmp.trusteeFee
                    }
                })
            }
        } else {
            if (selectedFiatCurrency.cc !== selectedExchangeWay[extendsFields.fieldForFiatCurrency]) {
                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount)

                this.setState({
                    amountEquivalentInFiatToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCryptoToApi: amount.toString(),
                    amountEquivalentInFiat: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`] / selectedFiatCurrency.rate).toString(),
                    amountEquivalentInCrypto: amount,
                    fee: {
                        providerFee: amountEquivalentInCryptoTmp.providerFee,
                        trusteeFee: amountEquivalentInCryptoTmp.trusteeFee
                    }
                })
            } else {

                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount)

                this.setState({
                    amountEquivalentInFiatToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCryptoToApi: amount.toString(),
                    amountEquivalentInFiat: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCrypto: amount,
                    fee: {
                        providerFee: {
                            in: amountEquivalentInCryptoTmp.providerFee.in,
                            out: amountEquivalentInCryptoTmp.providerFee.out
                        },
                        trusteeFee: {
                            in: amountEquivalentInCryptoTmp.trusteeFee.in,
                            out: amountEquivalentInCryptoTmp.trusteeFee.out
                        }
                    }
                })
            }
        }

    }

    amountInputCallback = (value, changeUseAllFunds) => {
        const { selectedCryptocurrency, selectedPaymentSystem, selectedFiatCurrency } = this.props
        const { useAllFunds } = this.state

        let amount

        amount = value

        const selectedExchangeWay = this.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)

        this.calculateEquivalent(selectedExchangeWay, selectedFiatCurrency, amount)

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }
    }

    handleGetTradeWay = (selectedCryptocurrency, selectedPaymentSystem) => {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { extendsFields } = this.props

            let tradeWayList = tradeApiConfig.exchangeWays.filter(
                item =>
                    item[extendsFields.fieldForFiatCurrency] === selectedPaymentSystem.currencyCode &&
                    item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode &&
                    item[extendsFields.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem
            )

            return tradeWayList[0]
        } catch (e) {
            Log.err('AmountInput.handleGetTradeWay error ' + e)
        }
    }

    renderInputBottomText = () => {
        const { amountEquivalentInFiat, amountEquivalentInCrypto } = this.state
        const { selectedCryptocurrency, selectedFiatCurrency } = this.props
        const { tradeType } = this.props.exchangeStore
        const { moneyType } = this.state

        let bottomLeftText = ''

        if (moneyType === 'CRYPTO' && tradeType === 'BUY') {
            bottomLeftText = strings('tradeScreen.youGive')
        } else if (moneyType === 'FIAT' && tradeType === 'BUY') {
            bottomLeftText = strings('tradeScreen.youGet')
        } else if (moneyType === 'FIAT' && tradeType === 'SELL') {
            bottomLeftText = strings('tradeScreen.youGive')
        } else {
            bottomLeftText = strings('tradeScreen.youGet')
        }

        // =  && tradeType === 'BUY' ?  : strings('tradeScreen.youGet')
        let selectedEquivalent = moneyType === 'CRYPTO' ? 1 * (+amountEquivalentInFiat).toFixed(2) : 1 * (+amountEquivalentInCrypto).toFixed(8)
        const symbol = moneyType === 'CRYPTO' ? selectedFiatCurrency.cc : selectedCryptocurrency.currencySymbol

        if (selectedEquivalent.toString() === 'NaN') {
            selectedEquivalent = 0
        }
        return `${bottomLeftText} ${selectedEquivalent} ${symbol}`
    }

    renderInputText = () => {
        const { tradeType } = this.props.exchangeStore
        const { moneyType } = this.state
        let text = ''

        if (moneyType === 'CRYPTO' && tradeType === 'BUY') {
            text = strings('tradeScreen.youGet')
        } else if (moneyType === 'FIAT' && tradeType === 'BUY') {
            text = strings('tradeScreen.youGive')
        } else if (moneyType === 'FIAT' && tradeType === 'SELL') {
            text = strings('tradeScreen.youGet')
        } else {
            text = strings('tradeScreen.youGive')
        }

        return text.replace(':', '')
    }

    onSubmitEditing = () => {
        // if(Platform.OS === 'android'){
        //     this.props.submitTrade()
        // }
    }

    render() {

        const { moneyType, useAllFunds } = this.state
        const { onFocus, selectedCryptocurrency, selectedFiatCurrency, selectedFiatTemplate, exchangeStore } = this.props
        const bottomLeftText = `${this.renderInputBottomText()}`

        return (
            <View>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container__to}/>
                </TouchableWithoutFeedback>
                <View style={[styles.container, { height: 'auto' }]}>


                    <View>
                        <Text style={[styles.titleText, { textAlign: 'center' }]}>{strings('tradeScreen.selectSum')}</Text>
                        <Input
                            ref={component => this.amountInput = component}
                            id={'amountInput'}
                            name={this.renderInputText()}
                            type={'EMPTY'}
                            decimals={10}
                            additional={'NUMBER'}
                            tapText={moneyType === 'FIAT' ? selectedFiatCurrency.cc : selectedCryptocurrency.currencySymbol}
                            tapCallback={this.handleSetMoneyType}
                            tapWrapperStyles={{ top: 6, right: 20, padding: 15, backgroundColor: '#fff' }}
                            tapContentStyles={{ padding: 0, paddingHorizontal: 8, height: 30, borderRadius: 6, backgroundColor: '#F9F2FF' }}
                            tapTextStyles={{ fontSize: 12 }}
                            style={{ marginRight: 2, marginLeft: 30, paddingRight: 108 }}
                            bottomLeftText={bottomLeftText}
                            keyboardType={'numeric'}
                            onFocus={onFocus}
                            onSubmitEditing={this.onSubmitEditing}
                            action={exchangeStore.tradeType === 'SELL' ? {
                                title: strings('exchange.mainData.sellAll').toUpperCase(),
                                callback: () => {
                                    this.setState({
                                        useAllFunds: !useAllFunds
                                    })
                                    this.handleSellAll()
                                }
                            } : undefined}
                            actionBtnStyles={{ top: -10, paddingTop: 10, paddingHorizontal: 30, marginRight: 5 }}
                            disabled={false}
                            callback={(value) => this.amountInputCallback(value, true)}/>
                    </View>

                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.container__bot}/>
                    </TouchableWithoutFeedback>
                </View>
            </View>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(AmountInput)

const styles = {
    container: {
        overflow: 'hidden'
    },
    container__to: {
        width: '100%',
        height: 30

    },
    container__bot: {
        width: '100%',
        height: 20
    },
    titleText: {
        marginLeft: 15,
        paddingBottom: 8,

        fontSize: 16,
        color: '#999999'
    }
}
