/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, Text, TouchableOpacity } from 'react-native'

import { strings } from '../../../../services/i18n'

import GasPriceAmountInput from '../../../../components/elements/Input'
import GasLimitAmountInput from '../../../../components/elements/Input'
import Nonce from '../../../../components/elements/Input'

import BlocksoftUtils from '../../../../../crypto/common/BlocksoftUtils'
import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'
import GradientView from '../../../../components/elements/GradientView'
import Theme from '../../../../themes/Themes'
import BlocksoftPrettyNumbers from '../../../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../../../services/UI/RateEquivalent/RateEquivalent'

let styles

const CACHE_PREV_OK = {}

class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.gasPriceInput = React.createRef()
        this.gasLimitInput = React.createRef()
        this.nonceInput = React.createRef()

        this.state = {
            prettyFee: '',
            prettyFeeSymbol: 'ETH',
            feeBasicCurrencySymbol: '',
            feeBasicAmount: ''
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.feeStyles
    }

    componentDidMount() {
        if (typeof this.props.fee.gasLimit !== 'undefined') {
            if (typeof this.props.fee.feeForTxDelegated !== 'undefined') {
                // do nothing
            } else {
                const gasLimitVal = typeof this.props.fee.gasLimit !== 'undefined' && this.props.fee.gasLimit !== '' && this.props.fee.gasLimit ? this.props.fee.gasLimit.toString() : '0'
                const gasPriceVal = typeof this.props.fee.gasPrice !== 'undefined' && this.props.fee.gasPrice !== '' && this.props.fee.gasPrice ? this.props.fee.gasPrice.toString() : '0'
                const nonceVal = typeof this.props.fee.nonceForTx !== 'undefined' && this.props.fee.nonceForTx !== '' && this.props.fee.nonceForTx ? this.props.fee.nonceForTx.toString() : '-1'

                this.gasPriceInput.handleInput(BlocksoftUtils.toGwei(gasPriceVal), false)
                this.gasLimitInput.handleInput(gasLimitVal, false)
                this.nonceInput.handleInput(nonceVal, false)
                this._makePrettyFee(gasPriceVal, gasLimitVal)
            }
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (Object.keys(nextProps.fee).length !== 0 && (JSON.stringify(nextProps.fee) !== JSON.stringify(this.props.fee)) && typeof nextProps.fee.gasLimit !== 'undefined') {
            if (typeof nextProps.fee.feeForTxDelegated !== 'undefined') {
                // do nothing
            } else {
                const gasLimitVal = typeof nextProps.fee.gasLimit !== 'undefined' && nextProps.fee.gasLimit !== '' && nextProps.fee.gasLimit ? nextProps.fee.gasLimit.toString() : '0'
                const gasPriceVal = typeof nextProps.fee.gasPrice !== 'undefined' && nextProps.fee.gasPrice !== '' && nextProps.fee.gasPrice ? nextProps.fee.gasPrice.toString() : '0'
                const nonceVal = typeof nextProps.fee.nonceForTx !== 'undefined' && nextProps.fee.nonceForTx !== '' && nextProps.fee.nonceForTx ? nextProps.fee.nonceForTx.toString() : '-1'

                this.gasPriceInput.handleInput(BlocksoftUtils.toGwei(gasPriceVal), false)
                this.gasLimitInput.handleInput(gasLimitVal, false)
                this.nonceInput.handleInput(nonceVal, false)
                this._makePrettyFee(gasPriceVal, gasLimitVal)
            }
        }
    }

    _makePrettyFee(gasPriceVal, gasLimitVal) {
        const feeForTx = BlocksoftUtils.mul(gasPriceVal, gasLimitVal)
        let prettyFee = BlocksoftPrettyNumbers.setCurrencyCode('ETH').makePretty(feeForTx)
        const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: prettyFee,
            currencyCode: 'ETH',
            basicCurrencyRate: this.props.basicCurrencyRate
        }), 5).justCutted

        prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted

        this.setState({
            prettyFee,
            feeBasicAmount,
            basicCurrencySymbol: this.props.basicCurrencySymbol
        })
        return feeForTx
    }

    getCustomFee = async () => {

        const gasPriceInputValidate = await this.gasPriceInput.handleValidate()
        const gasLimitInputValidate = await this.gasLimitInput.handleValidate()
        const nonceValidate = await this.nonceInput.handleValidate()
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
                const res = {
                    gasPrice: BlocksoftUtils.toWei(gasPriceInputValidate.value, 'gwei'),
                    gasLimit: gasLimitInputValidate.value,
                    isCustomFee: true
                }
                res.feeForTx = BlocksoftUtils.mul(res.gasLimit, res.gasPrice)
                if (nonceValidate.status === 'success' && nonceValidate.value !== '') {
                    res.nonceForTx = nonceValidate.value * 1
                }
                return res
            }
        }
    }

    handleGasPriceCallback = async (gasPrice) => {
        const gasLimitInputValidate = await this.gasLimitInput.handleValidate()
        const gasLimitVal = gasLimitInputValidate.value
        const gasPriceVal = gasPrice === '' ? 0 : gasPrice
        await this._handleGasCallbacks(BlocksoftUtils.toWei(gasPriceVal, 'gwei'), gasLimitVal)
    }

    handleGasLimitAmountCallback = async (gasLimit) => {
        const gasPriceInputValidate = await this.gasPriceInput.handleValidate()
        const gasPriceVal = gasPriceInputValidate.value === '' ? 0 : gasPriceInputValidate.value
        const gasLimitVal = gasLimit === '' ? 0 : gasLimit
        await this._handleGasCallbacks(BlocksoftUtils.toWei(gasPriceVal, 'gwei'), gasLimitVal)
    }

    _handleGasCallbacks = async (gasPriceVal, gasLimitVal) => {
        const feeForTx = this._makePrettyFee(gasPriceVal, gasLimitVal)
        const shouldChangeBalance = typeof this.props.countedFees.shouldChangeBalance !== 'undefined' && this.props.countedFees.shouldChangeBalance
        const amountForTx = BlocksoftUtils.diff(this.props.countedFees.countedForBasicBalance, feeForTx)
        if (amountForTx * 1 > 0) {
            let checkedAmount = this.props.amountForTx
            if (shouldChangeBalance) {
                checkedAmount = amountForTx
            }
            await this._handleCacheOk(feeForTx, gasPriceVal, gasLimitVal)
            this.props.callTransferAll({
                feeForTx,
                amountForTx: checkedAmount
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: strings('send.errors.SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            }, () => {
                this._makePrettyFee(CACHE_PREV_OK.gasPrice, CACHE_PREV_OK.gasLimit)
                this.gasPriceInput.handleInput(BlocksoftUtils.toGwei(CACHE_PREV_OK.gasPrice), false)
                this.gasLimitInput.handleInput(CACHE_PREV_OK.gasLimit, false)
            })
        }
    }

    _handleCacheOk = async (feeForTx, gasPriceVal, gasLimitVal) => {
        CACHE_PREV_OK.feeForTx = feeForTx
        CACHE_PREV_OK.gasPrice = gasPriceVal
        CACHE_PREV_OK.gasLimit = gasLimitVal
    }

    render() {

        const { prettyFee, prettyFeeSymbol, basicCurrencySymbol, feeBasicAmount } = this.state

        return (
            <View>
                <TouchableOpacity
                    style={styles.fee__item}>
                    <View style={styles.fee__item__content}>
                        <View style={styles.fee__item__top}>
                            <Text style={{
                                ...styles.fee__item__title,
                                color: '#efa1ae'
                            }}>
                                {strings(`send.fee.customFeeCalculated`, { symbol: prettyFeeSymbol })}
                            </Text>
                        </View>
                        <Text style={{
                            ...styles.fee__item__top__text,
                            color: '#efa1ae'
                        }}>
                            {prettyFee} {prettyFeeSymbol} ({basicCurrencySymbol} {feeBasicAmount})
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.fee__divider} />
                <GasPriceAmountInput
                    ref={ref => this.gasPriceInput = ref}
                    id={'gasPrice'}
                    name={strings(`send.fee.customFee.eth.gasPrice`)}
                    type={'EMPTY'}
                    additional={'NUMBER'}
                    mark={strings(`send.fee.customFee.eth.gwei`)}
                    keyboardType={'numeric'}
                    inputBaseColor={'#f4f4f4'}
                    inputTextColor={'#f4f4f4'}
                    tintColor={'#f4f4f4'}
                    markStyle={{ color: '#f4f4f4' }}
                    callback={this.handleGasPriceCallback} />
                <GasLimitAmountInput
                    ref={ref => this.gasLimitInput = ref}
                    id={'gasLimit'}
                    name={strings(`send.fee.customFee.eth.gasLimit`)}
                    type={'EMPTY'}
                    additional={'NUMBER'}
                    keyboardType={'numeric'}
                    inputBaseColor={'#f4f4f4'}
                    inputTextColor={'#f4f4f4'}
                    tintColor={'#f4f4f4'}
                    markStyle={{ color: '#f4f4f4' }}
                    callback={this.handleGasLimitAmountCallback}
                    disabled={this.props.useAllFunds} />
                <Nonce
                    ref={ref => this.nonceInput = ref}
                    id={'nonce'}
                    name={strings(`send.fee.customFee.eth.nonce`)}
                    type={'EMPTY'}
                    additional={'NUMBER'}
                    keyboardType={'numeric'}
                    inputBaseColor={'#f4f4f4'}
                    inputTextColor={'#f4f4f4'}
                    tintColor={'#f4f4f4'}
                    markStyle={{ color: '#f4f4f4' }}
                />
            </View>
        )
    }
}

export default CustomFee

const styles_ = {
    array: ['#300f4d', '#300f4d'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const stylesActive = {
    array: ['#b95f94', '#eba0ae'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}
