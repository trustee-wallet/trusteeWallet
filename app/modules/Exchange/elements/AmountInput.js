import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native'

import Input from '../../../components/elements/Input'

import { setLoaderStatus } from '../../../appstores/Actions/MainStoreActions'
import { showModal } from '../../../appstores/Actions/ModalActions'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftTransfer from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import Log from '../../../services/Log/Log'
import { strings } from '../../../services/i18n'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'


class AmountInput extends Component {

    constructor(props){
        super(props)
        this.state = {
            selectedAmount: '',
            useAllFunds: false,
            amountEquivalent: {
                inAmount: 0,
                outAmount: 0
            },
            calculateWay: 'IN',
        }
    }

    componentWillReceiveProps(nextProps) {

        const { selectedInCryptocurrency, selectedPaymentSystem, selectedOutCryptocurrency, selectedFiatTemplate } = nextProps

        if(
            typeof selectedInCryptocurrency.currencyCode != 'undefined' && typeof selectedPaymentSystem != 'undefined' && typeof selectedOutCryptocurrency.currencyCode != 'undefined' && selectedInCryptocurrency.currencyCode !== selectedOutCryptocurrency.currencyCode
        ){
            if(selectedFiatTemplate){
                if(this.amountInput != null){
                    this.amountInput.handleInput((selectedFiatTemplate.value / selectedInCryptocurrency.currency_rate_usd).toString(), false)
                    this.calculateEquivalent(selectedInCryptocurrency, selectedOutCryptocurrency, selectedFiatTemplate.value / selectedInCryptocurrency.currency_rate_usd)
                }
            }
            if(!selectedFiatTemplate){
                if(this.amountInput != null){
                    this.calculateEquivalent(selectedInCryptocurrency, selectedOutCryptocurrency, this.amountInput.getValue())
                }
            }
        }
    }

    setInputData = (value) => {
        this.amountInput.handleInput(value)
    }

    handleGetAmountEquivalent = () => this.state

    handleSetState = (field, value, callback) => { this.setState({ [field]: value }, () => callback()) }

    handleSetMoneyType = () => {

        let { calculateWay, amountEquivalent } = this.state

        this.setState({
            calculateWay: calculateWay === 'IN' ? 'OUT' : 'IN'
        }, () => {

        })

        let toAmountInput = calculateWay === 'IN' ? amountEquivalent.outAmount : amountEquivalent.inAmount
        toAmountInput = toAmountInput.toString()
        toAmountInput = toAmountInput == 0 || toAmountInput == '' ? '' : toAmountInput

        this.amountInput.handleInput(toAmountInput, false)

        console.log(this.state)
    }

    handleSellAll = async () => {
        setLoaderStatus(true)

        try {

            const {
                selectedWallet
            } = this.props.mainStore
            const {
                wallet_hash: walletHash
            } = selectedWallet

            const {
                selectedInCryptocurrency,
                selectedOutCryptocurrency
            } = this.props

            const {
                address,
                currency_code: currencyCode,
                derivation_path: derivationPath
            } = this.props.selectedInAccount

            const { addressForEstimateSellAll } = this.props.handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)
            const tmpAddressForEstimate = addressForEstimateSellAll != null ? addressForEstimateSellAll : address

            const derivationPathTmp = derivationPath.replace(/quote/g, '\'')


            Log.log('Exchange.MainDataScreen.handleExchangeAll start')


            const tmp = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address)).getBalance()
            const balanceRaw = tmp ? BlocksoftUtils.add(tmp.balance, tmp.unconfirmed) : 0 // to think show this as option or no
            console.log(currencyCode, walletHash, derivationPathTmp, address, tmpAddressForEstimate, balanceRaw)

            const fees = await (
                BlocksoftTransfer
                    .setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(address)
                    .setAddressTo(tmpAddressForEstimate)
                    .setAmount(balanceRaw)
                    .setTransferAll(true)
            ).getFeeRate()

            const current = await (
                BlocksoftTransfer
                    .setCurrencyCode(currencyCode)
                    .setAddressFrom(address)
                    .setFee(fees[fees.length - 1])
            ).getTransferAllBalance(balanceRaw)

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePrettie(current)

            this.setState({
                moneyType: 'IN'
            }, () => {
                this.amountInput.handleInput(amount.toString())
            })

            this.setState({
                useAllFunds: true
            })

        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                Log.err('Exchange.MainDataScreen.handleExchangeAll error ' + e.message)
            } else {
                e.message = strings('send.errors.' + e.message)
            }


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

        for(let item of equivalentFunctionPrepare){
            if(item !== '{')
                equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
            else
                break
        }

        equivalentFunctionPrepare = equivalentFunctionPrepare.substr(1)
        equivalentFunctionPrepare = equivalentFunctionPrepare.substring(0, equivalentFunctionPrepare.length - 1)

        const equivalentFunction = new Function('amount', 'side', 'exchangeWayObj', equivalentFunctionPrepare)

        return equivalentFunction(amount, side, selectedExchangeWay)
    }

    calculateEquivalent = (selectedInCryptocurrency, selectedOutCryptocurrency, amount) => {
        const { calculateWay } = this.state

        const exchangeWay = this.props.handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)



        let amountEquivalent = this.prepareAndCallEquivalentFunction(exchangeWay, calculateWay, amount)

        console.log(amountEquivalent)

        // console.log(selectedExchangeWay, this.getEquivalentSide(), amount * selectedFiatCurrency.rate)
        // console.log(amountEquivalentInCryptoTmp)

        this.setState({
            // amountEquivalentInFiatToApi: (amount * selectedFiatCurrency.rate).toString(),
            // amountEquivalentInCryptoToApi: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
            // amountEquivalentInCrypto: (amountEquivalentInCryptoTmp[`${extendsFields.fieldForWayId2.toLowerCase()}Amount`]).toString(),
            amountEquivalent
        })
        // }

    }

    amountInputCallback = (amount, changeUseAllFunds) => {
        const { selectedFiatTemplate, selectedInCryptocurrency, selectedOutCryptocurrency } = this.props
        const { useAllFunds } = this.state

        this.calculateEquivalent(selectedInCryptocurrency, selectedOutCryptocurrency, amount)

        selectedFiatTemplate ? this.props.handleSetState('selectedFiatTemplate', '') : null

        if (useAllFunds && changeUseAllFunds) {
            this.setState({
                useAllFunds: false
            })
        }
    }

    renderInputBottomText = () => {
        // const { amountEquivalent } = this.state
        const { selectedInCryptocurrency, selectedOutCryptocurrency } = this.props
        // const { tradeType } = this.props.exchangeStore
        const { calculateWay } = this.state
        //
        // // let bottomLeftText = strings(`${'exchange.mainData.equivalentCryptoBuy' : 'exchange.mainData.equivalentCryptoSell'}`) : strings('exchange.mainData.equivalentFiat')
        // let bottomLeftText = strings(`${'exchange.mainData.equivalentCryptoBuy'}`)
        // const selectedEquivalent = 1 * (+amountEquivalent).toFixed(2)
        // const symbol = selectedInCryptocurrency.currencySymbol

        // return `${bottomLeftText} ${selectedEquivalent} ${symbol}`

        const { amountEquivalent } = this.state

        const amount = calculateWay === 'IN' ? amountEquivalent.outAmount : amountEquivalent.inAmount
        const symbol = calculateWay === 'IN' ? selectedOutCryptocurrency.currencySymbol : selectedInCryptocurrency.currencySymbol
        const string = calculateWay === 'IN' ? strings('tradeScreen.youGet') : strings('tradeScreen.youGive')

        return string + ' ' + amount + ' ' + symbol
    }


    render() {

        const { calculateWay, useAllFunds } = this.state
        const { onFocus, selectedInCryptocurrency, selectedOutCryptocurrency, selectedFiatTemplate, exchangeStore } = this.props
        const tapText = calculateWay === 'IN' ? selectedInCryptocurrency.currencySymbol : selectedOutCryptocurrency.currencySymbol
        const bottomLeftText = this.renderInputBottomText()

        return (
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container__to} />
                </TouchableWithoutFeedback>
                <Input
                    ref={component => this.amountInput = component}
                    id={'amountInput'}
                    name={calculateWay === 'IN' ? strings('tradeScreen.youGive').replace(':', '') : strings('tradeScreen.youGet').replace(':', '')}
                    type={'EMPTY'}
                    decimals={10}
                    additional={'NUMBER'}
                    tapText={tapText}
                    tapCallback={this.handleSetMoneyType}
                    tapWrapperStyles={{ top: 6, right: 20, padding: 15, backgroundColor: '#fff' }}
                    tapContentStyles={{ padding: 0, paddingHorizontal: 8, height: 30, borderRadius: 6, backgroundColor: '#F9F2FF' }}
                    tapTextStyles={{ fontSize: 12 }}
                    style={{ marginRight: 2, marginLeft: 30,  paddingRight: 108 }}
                    bottomLeftText={bottomLeftText}
                    keyboardType={'numeric'}
                    onFocus={onFocus}
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
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container__bot} />
                </TouchableWithoutFeedback>
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
    container__to: {
        width: '100%',
        height: 30
    },
    container__bot: {
        width: '100%',
        height: 20
    }
}
