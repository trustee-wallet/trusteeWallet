/**
 * @version 0.1
 */
import React, { Component } from 'react'

import { View, Text, TouchableOpacity } from 'react-native'

import { strings } from '../../../../services/i18n'

import GasPriceAmountInput from '../../../../components/elements/NewInput'
import GasLimitAmountInput from '../../../../components/elements/NewInput'
import Nonce from '../../../../components/elements/NewInput'

import { ThemeContext } from '../../../../modules/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '../../../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../../../services/UI/RateEquivalent/RateEquivalent'
import BlocksoftUtils from '../../../../../crypto/common/BlocksoftUtils'
import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'

const CACHE_PREV_OK = {
    feeForTx: 0,
    gasPrice: 0,
    gasLimit: 0,
    nonce: 0
}

class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.state = {
            countedFees: false,
            selectedFee: {
                feeForByte: '?',
                gasPriceGwei : '?',
            },
            prettyFee: '',
            feeBasicAmount: ''
        }

        this.gasPriceInput = React.createRef()
        this.gasLimitInput = React.createRef()
        this.nonceInput = React.createRef()
    }

    componentDidMount() {
        if (typeof this.props.selectedFee.gasPrice !== 'undefined') {
            const selectedFee = this.props.selectedFee
            this._setSelectedFee(selectedFee, this.props.countedFees, false)
            this.gasPriceInput.handleInput(selectedFee.gasPriceGwei.toString(), false)
            this.gasLimitInput.handleInput(selectedFee.gasLimit.toString(), false)
            this.nonceInput.handleInput(selectedFee.nonceForTx.toString(), false)
        } else {
            console.log('!!!! SHOULD NOT OPEN WITHOUT ANY FEE !!!!')
        }
    }

    handleRecount = async (field, value) => {

        let gasPriceInputValidate = { status: 'success', value }
        if (field !== 'gasPrice') {
            gasPriceInputValidate = await this.gasPriceInput.handleValidate()
        }
        let gasLimitInputValidate = { status: 'success', value }
        if (field !== 'gasLimit') {
            gasLimitInputValidate = await this.gasLimitInput.handleValidate()
        }
        let nonceValidate = { status: 'success', value }
        if (field !== 'nonce') {
            nonceValidate = await this.nonceInput.handleValidate()
        }

        if (gasPriceInputValidate.status === 'success'
            && gasLimitInputValidate.status === 'success'
            && gasPriceInputValidate.value !== 0
            && gasLimitInputValidate.value !== 0) {
            if (gasLimitInputValidate.value < 21000) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('send.errors.SERVER_RESPONSE_MIN_GAS_ETH')
                })
                throw new Error('minimal gas limit not ok ' + gasLimitInputValidate.value)
            } else {
                this._actualRecount(gasPriceInputValidate.value, gasLimitInputValidate.value, nonceValidate.value)
            }
        }

        return true
    }

    _actualRecount = async (_gasPriceGwei, _gasLimit, _nonce) => {
        const gasPriceGwei = _gasPriceGwei * 1
        if (gasPriceGwei === 0) {
            return false
        }
        const gasLimit = Math.round(_gasLimit * 1)
        if (gasLimit === 0) {
            return false
        }
        const gasPrice = BlocksoftUtils.toWei(gasPriceGwei, 'gwei')
        const feeForTx = BlocksoftUtils.mul(gasPrice, gasLimit)

        const nonceForTx = Math.round(_nonce * 1)

        CACHE_PREV_OK.nonce = nonceForTx
        if (CACHE_PREV_OK.feeForTx === feeForTx
            && CACHE_PREV_OK.gasPrice === gasPrice
            && CACHE_PREV_OK.gasLimit === gasLimit
        ) {
            const selectedFee = this.state.selectedFee
            selectedFee.nonceForTx = nonceForTx
            selectedFee.isCustomFee = true
            this.props.updateSelectedFeeBack(selectedFee)
            return
            // do nothing not alredy counted
        }


        const newSelectedFee = {...this.state.selectedFee,
            feeForTx, gasPrice, gasPriceGwei, gasLimit, nonceForTx,
            isCustomFee: true, langMsg : 'custom'
        }
        this._setSelectedFee(newSelectedFee)
    }

    _setSelectedFee(selectedFee, countedFees = false, sendBack = true) {

        // console.log('selectedFee', JSON.parse(JSON.stringify({sendBack, selectedFee})))

        const toState = {selectedFee}
        if (typeof countedFees !== 'undefined' && countedFees) {
            toState.countedFees = countedFees
        } else {
            const shouldChangeBalance = typeof this.props.countedFees.shouldChangeBalance !== 'undefined' && this.props.countedFees.shouldChangeBalance
            const amountForTx = BlocksoftUtils.diff(this.props.countedFees.countedForBasicBalance, selectedFee.feeForTx)
            if (amountForTx * 1 > 0) {
                let checkedAmount = this.props.amountForTx
                if (shouldChangeBalance) {
                    checkedAmount = amountForTx
                }
                toState.selectedFee.amountForTx = checkedAmount
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('send.errors.SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                }, () => {
                    selectedFee.gasPrice = CACHE_PREV_OK.gasPrice
                    selectedFee.gasPriceGwei = BlocksoftUtils.toGwei(CACHE_PREV_OK.gasPrice)
                    selectedFee.gasLimit = CACHE_PREV_OK.gasLimit
                    this.gasPriceInput.handleInput(selectedFee.gasPriceGwei, false)
                    this.gasLimitInput.handleInput(selectedFee.gasLimit, false)
                    selectedFee.feeForTx = BlocksoftUtils.mul(selectedFee.gasPrice, selectedFee.gasLimit)
                })
            }
        }

        CACHE_PREV_OK.feeForTx = selectedFee.feeForTx
        CACHE_PREV_OK.gasPrice = selectedFee.gasPrice
        CACHE_PREV_OK.gasLimit = selectedFee.gasLimit
        CACHE_PREV_OK.nonce = selectedFee.nonceForTx

        const currencyCode = 'ETH'
        const prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(selectedFee.feeForTx)
        const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: prettyFee,
            currencyCode: currencyCode,
            basicCurrencyRate: this.props.basicCurrencyRate
        }), 5).justCutted
        toState.prettyFee = prettyFee
        toState.feeBasicAmount = feeBasicAmount

        this.setState(toState)
        if (sendBack) {
            this.props.updateSelectedFeeBack(selectedFee)
        }
    }


    render() {

        const { colors, GRID_SIZE } = this.context

        const prettyFeeSymbol = 'ETH'
        const customFee = `Calculeted fee:  \n${this.state.prettyFee} ${prettyFeeSymbol} / ` + (Number(this.state.feeBasicAmount) < 0.01 ? ` > ${this.props.basicCurrencySymbol} 0.01` : `${this.props.basicCurrencySymbol} ${this.state.feeBasicAmount}`)
        // ${this.state.selectedFee.gasPriceGwei} gwei :

        return (
            <View style={{ marginTop: 10 }}>
                <View style={{ paddingBottom: 20, paddingLeft: 10 }}>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{customFee}</Text>
                </View>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <GasPriceAmountInput
                        ref={ref => this.gasPriceInput = ref}
                        id={'gasPrice'}
                        name={strings(`send.fee.customFee.eth.gasPrice`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        placeholder={strings(`send.fee.customFee.eth.gwei`)}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        callback={(value) => this.handleRecount('gasPrice', value)}
                    />
                </View>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <GasLimitAmountInput
                        ref={ref => this.gasLimitInput = ref}
                        id={'gasLimit'}
                        placeholder={strings(`send.fee.customFee.eth.gasLimit`)}
                        name={strings(`send.fee.customFee.eth.gasLimit`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        disabled={this.props.useAllFunds}
                        callback={(value) => this.handleRecount('gasLimit', value)}
                    />
                </View>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <Nonce
                        ref={ref => this.nonceInput = ref}
                        id={'nonce'}
                        placeholder={strings(`send.fee.customFee.eth.nonce`)}
                        name={strings(`send.fee.customFee.eth.nonce`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        callback={(value) => this.handleRecount('nonce', value)}
                    />
                </View>
            </View>
        )
    }
}

CustomFee.contextType = ThemeContext

export default CustomFee

const styles = {
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 3,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 1
        }
    },
    customFee: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        paddingBottom: 4
    }
}