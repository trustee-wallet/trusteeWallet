/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Keyboard, TouchableWithoutFeedback, Text } from 'react-native'

import Input from '../../../components/elements/Input'

import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import Log from '../../../services/Log/Log'
import { strings } from '../../../services/i18n'

import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import { SendActions } from '../../../appstores/Stores/Send/SendActions'

class ExchangeAmountInput extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedAmount: '',
            useAllFunds: false,
            amountEquivalentOutCrypto: '0',
            amountEquivalentInCrypto: '0',
            amountEquivalentOutCryptoToApi: '0',
            amountEquivalentInCryptoToApi: '0',
            amountEquivalent: '0',
            moneyType: 'IN'
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedInCurrency, selectedPaymentSystem, selectedOutCurrency } = nextProps

        if (
            selectedInCurrency && typeof selectedPaymentSystem.currencyCode !== 'undefined' && typeof selectedOutCurrency.currencyCode !== 'undefined'
        ) {
            const selectedExchangeWay = this.handleGetTradeWay(selectedInCurrency, selectedPaymentSystem)
            if (this.amountInput != null) {
                this.calculateEquivalent(selectedExchangeWay, selectedOutCurrency, this.amountInput.getValue())
            }
        }
    }

    handleGetAmountEquivalent = () => this.state

    handleSetState = (field, value, callback) => {
        this.setState({ [field]: value }, () => callback())
    }

    handleSetMoneyType = () => {

        const { moneyType, amountEquivalentInCrypto, amountEquivalentOutCrypto } = this.state

        this.setState({
            moneyType: moneyType === 'IN' ? 'OUT' : 'IN'
        })

        let toAmountInput = moneyType === 'OUT' ? amountEquivalentInCrypto : amountEquivalentOutCrypto
        toAmountInput = toAmountInput === 0 || toAmountInput === '' ? '' : toAmountInput

        this.amountInput.handleInput(toAmountInput, false)
    }

    setInputData = (value) => {
        this.amountInput.handleInput(value)
    }

    handleSellAll = async () => {

        setLoaderStatus(true)

        let errorCurrencyCode = ''
        let balancesData
        try {
            const { selectedInCurrency, selectedPaymentSystem } = this.props

            const { currencyCode, address } = this.props.selectedInAccount
            errorCurrencyCode = currencyCode

            const tmp =  this.handleGetTradeWay(selectedInCurrency, selectedPaymentSystem)
            if (typeof tmp === 'undefined' || !tmp) {
                setLoaderStatus(false)
                return 0
            }
            const { addressForEstimateSellAllV2 } = tmp
            const tmpAddressForEstimate = addressForEstimateSellAllV2 != null ? addressForEstimateSellAllV2 : address

            Log.log('EXC/AmountInput.handleSellAll start')

            const { transferBalance } = await SendActions.countTransferAllBeforeStartSend({
                currencyCode,
                addressTo: tmpAddressForEstimate
            })
            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(transferBalance, 'exchangeAmountInput.amount')

            Log.log('EXC/AmountInput.handleSellAll done with amount ' + amount + ' to address ' + tmpAddressForEstimate)

            this.setState({
                moneyType: 'IN'
            }, () => {
                this.amountInput.handleInput(amount.toString())
            })

            this.setState({
                useAllFunds: true
            })

        } catch (e) {
            Log.errorTranslate(e, 'EXC/AmountInput.handleExchangeAll', errorCurrencyCode, JSON.stringify(balancesData))

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
        let item
        for (item of equivalentFunctionPrepare) {
            if (item !== '{')
                equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
            else
                break
        }

        equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
        equivalentFunctionPrepare = equivalentFunctionPrepare.substring(0, equivalentFunctionPrepare.length - 1)

        // eslint-disable-next-line no-new-func
        const equivalentFunction = new Function('amount', 'side', 'exchangeWayObj', equivalentFunctionPrepare)

        return equivalentFunction(amount, side, selectedExchangeWay)

    }

    getEquivalentSide = () => {

        const { moneyType } = this.state
        const { exchangeStore } = this.props

        let side = ''

        if (moneyType === 'IN') side = 'IN'
        if (moneyType === 'OUT') side = 'OUT'

        return side


    }


    calculateEquivalent = (selectedExchangeWay, selectedOutCurrency, amount) => {

        const { moneyType } = this.state
        const { extendsFields } = this.props

        if (!selectedExchangeWay || typeof selectedExchangeWay === 'undefined') {
            return false
        }
        if (moneyType === 'OUT') {
            if (selectedOutCurrency.currencyCode !== selectedExchangeWay[extendsFields.fieldForOutCurrency]) {

                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount * selectedOutCurrency.rate)

                this.setState({
                    amountEquivalentOutCryptoToApi: (amount * selectedOutCurrency.rate).toString(),
                    amountEquivalentInCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentOutCrypto: amount,
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
                    amountEquivalentOutCryptoToApi: (amount).toString(),
                    amountEquivalentInCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
                    amountEquivalentOutCrypto: amount,
                    fee: {
                        providerFee: amountEquivalentInCryptoTmp.providerFee,
                        trusteeFee: amountEquivalentInCryptoTmp.trusteeFee
                    }
                })
            }
        } else {
            if (selectedOutCurrency.currencyCode !== selectedExchangeWay[extendsFields.fieldForOutCurrency]) {
                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount)

                this.setState({
                    amountEquivalentOutCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCryptoToApi: amount.toString(),
                    amountEquivalentOutCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`] / selectedOutCurrency.rate).toString(),
                    amountEquivalentInCrypto: amount,
                    fee: {
                        providerFee: amountEquivalentInCryptoTmp.providerFee,
                        trusteeFee: amountEquivalentInCryptoTmp.trusteeFee
                    }
                })
            } else {

                const amountEquivalentInCryptoTmp = this.prepareAndCallEquivalentFunction(selectedExchangeWay, this.getEquivalentSide(), amount)

                this.setState({
                    amountEquivalentOutCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
                    amountEquivalentInCryptoToApi: amount.toString(),
                    amountEquivalentOutCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId.toLowerCase()}Amount`]).toString(),
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
        const { selectedInCurrency, selectedPaymentSystem, selectedOutCurrency } = this.props
        const { useAllFunds } = this.state

        const amount = value

        const selectedExchangeWay = this.handleGetTradeWay(selectedInCurrency, selectedPaymentSystem)

        this.calculateEquivalent(selectedExchangeWay, selectedOutCurrency, amount)

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }
    }

    handleGetTradeWay = (selectedInCurrency, selectedPaymentSystem) => {
        try {
            const tradeApiConfig = this.props.exchangeStore.exchangeApiConfig

            const { extendsFields } = this.props

            if (typeof extendsFields === 'undefined' || typeof extendsFields.fieldForInCurrency === 'undefined') {
                return false
            }

            const tradeWayList = []

            if (tradeApiConfig) {
                let item
                for (item of tradeApiConfig) {
                    if (typeof item === 'undefined' || !item) continue
                    if (item[extendsFields.fieldForInCurrency] === selectedInCurrency.currencyCode &&
                        item[extendsFields.fieldForOutCurrency] === selectedPaymentSystem.currencyCode &&
                        item[extendsFields.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem
                    ) {
                        tradeWayList.push(item)
                        break
                    }
                }
            }
            return tradeWayList[0]
        } catch (e) {
            Log.err('EXC/AmountInput.handleGetTradeWay error ' + e)
        }
    }

    renderInputBottomText = () => {
        const { amountEquivalentInCrypto, amountEquivalentOutCrypto } = this.state
        const { selectedInCurrency, selectedOutCurrency } = this.props
        const { moneyType } = this.state

        let bottomLeftText = ''
        let selectedEquivalent = ''
        let symbol = ''

        if (moneyType === 'OUT') {
            bottomLeftText = strings('tradeScreen.youGive')
            selectedEquivalent = 1 * (+amountEquivalentInCrypto).toFixed(2)
            symbol = selectedInCurrency ? selectedInCurrency.currencySymbol : ''
        } else {
            bottomLeftText = strings('tradeScreen.youGet')
            selectedEquivalent = 1 * (+amountEquivalentOutCrypto).toFixed(8)
            symbol = selectedOutCurrency ? selectedOutCurrency.currencySymbol : ''
        }

        return `${bottomLeftText} ${selectedEquivalent} ${symbol || ''}`
    }

    renderInputText = () => {
        const { moneyType } = this.state
        let text = ''

        if (moneyType === 'IN') {
            text = strings('tradeScreen.youGive')
        } else {
            text = strings('tradeScreen.youGet')
        }

        return text.replace(':', '')

    }


    render() {

        const { moneyType, useAllFunds } = this.state
        const { onFocus, selectedInCurrency, selectedOutCurrency, exchangeStore } = this.props
        const bottomLeftText = `${this.renderInputBottomText()}`

        return (
            <View>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container__to}/>
                </TouchableWithoutFeedback>
                <View style={[styles.container, { height: 'auto' }]}>

                    <View>
                        <Text
                            style={[styles.titleText, { textAlign: 'center' }]}>{strings('tradeScreen.selectSum')}</Text>
                        <Input
                            ref={component => this.amountInput = component}
                            id={'amountInput'}
                            name={this.renderInputText()}
                            type={'EMPTY'}
                            decimals={10}
                            additional={'NUMBER'}
                            tapText={moneyType === 'IN' ? selectedInCurrency.currencySymbol : selectedOutCurrency.currencySymbol}
                            tapCallback={this.handleSetMoneyType}
                            tapWrapperStyles={{ top: 6, right: 20, padding: 15, backgroundColor: '#fff' }}
                            tapContentStyles={{
                                padding: 0,
                                paddingHorizontal: 8,
                                height: 30,
                                borderRadius: 6,
                                backgroundColor: '#F9F2FF'
                            }}
                            tapTextStyles={{ fontSize: 12 }}
                            style={{ marginRight: 2, marginLeft: 30, paddingRight: 108 }}
                            bottomLeftText={bottomLeftText}
                            keyboardType={'numeric'}
                            onFocus={onFocus}
                            onSubmitEditing={this.onSubmitEditing}
                            action={{
                                title: strings('exchangeScreen.exchangeAll').toUpperCase(),
                                callback: () => {
                                    this.setState({
                                        useAllFunds: !useAllFunds
                                    })
                                    this.handleSellAll()
                                }
                            }}
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(ExchangeAmountInput)

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
