/**
 * @version 0.41
 */
import React from 'react'

import { View, Text, StyleSheet } from 'react-native'

import { strings } from '@app/services/i18n'

// eslint-disable-next-line import/no-duplicates
import GasPriceAmountInput from '@app/components/elements/NewInput'
// eslint-disable-next-line import/no-duplicates
import GasLimitAmountInput from '@app/components/elements/NewInput'
// eslint-disable-next-line import/no-duplicates
import Nonce from '@app/components/elements/NewInput'

import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { feesTitles } from '@app/modules/Send/advanced/helpers'

class SendCustomFeeETH extends React.PureComponent {

    constructor(props) {
        super(props)

        this.state = {
            feesPretty: 0,
            gasLimitError : false,
            gasLimitErrorText : ''
        }
        this.gasPriceInput = React.createRef()
        this.gasLimitInput = React.createRef()
        this.nonceInput = React.createRef()
        this.somePause = false
    }

    componentDidMount() {
        const currentSelectedFee = this.props.currentSelectedFee
        this.gasPriceInput.handleInput(currentSelectedFee.gasPriceGwei.toString(), false)
        this.gasLimitInput.handleInput(currentSelectedFee.gasLimit.toString(), false)
        // -1 is default nonce as "will be used one from node"
        let nonceForTx = ''
        if (typeof currentSelectedFee.nonceForTx !== 'undefined') {
            nonceForTx = currentSelectedFee.nonceForTx.toString() === '-1' ? '' : currentSelectedFee.nonceForTx.toString()
            this.nonceInput.handleInput(nonceForTx, false)
        }
        const gasPrice = BlocksoftUtils.toWei(currentSelectedFee.gasPriceGwei, 'gwei')
        const feeForTx = BlocksoftUtils.mul(currentSelectedFee.gasLimit, gasPrice)
        const feesPretty = BlocksoftUtils.toEther(feeForTx)

        this.setState({
            feesPretty,
            gasPriceGwei : currentSelectedFee.gasPriceGwei,
            gasLimit : currentSelectedFee.gasLimit,
            nonceForTx,
        })
    }

    handleRecount = async (field, value) => {
        if (this.somePause !== false) {
            clearTimeout(this.somePause)
        }
        this.somePause = setTimeout(() => {
            this._handleRecount(field, value)
        }, 100)
    }
    _handleRecount = async (field, value) => {

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
            if (gasLimitInputValidate.value * 1 < 21000) {
                this.setState({
                    gasLimitError : true,
                    gasLimitErrorText : strings('send.errors.SERVER_RESPONSE_MIN_GAS_ETH')
                })
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
        const feeForTx = BlocksoftUtils.mul(gasLimit, gasPrice)
        const feesPretty = BlocksoftUtils.toEther(feeForTx)

        const nonceForTx = _nonce === false || _nonce === '' ? _nonce : Math.round(_nonce * 1)

        const item = {feeForTx, gasLimit, gasPrice, gasPriceGwei, nonceForTx, isCustomFee : true}
        SendActionsUpdateValues.setTmpSelectedFee(item)

        this.setState({
            feesPretty,
            gasPriceGwei,
            gasLimit,
            nonceForTx,
            gasLimitError : false
        })
    }

    renderGasError = () => {
        const { gasLimitError, gasLimitErrorText } = this.state
        const { colors, GRID_SIZE } = this.context

        if (!gasLimitError) return
        return (
            <View style={{ marginVertical: GRID_SIZE }}>
                <View style={styles.texts}>
                    <View style={styles.texts__icon}>
                        <Icon
                            name='information-outline'
                            size={22}
                            color='#864DD9'
                        />
                    </View>
                    <Text style={{ ...styles.texts__item, color: colors.common.text3 }}>
                        {gasLimitErrorText}
                    </Text>
                </View>
            </View>
        )

    }

    render() {

        const { colors, GRID_SIZE } = this.context


        const {feesCurrencySymbol} = feesTitles(this.props.currentSelectedFee, this.props.sendScreenStore.dict)

        const { feesBasicCurrencyRate, feesBasicCurrencySymbol } = this.props.sendScreenStore.dict

        const { isTransferAll } = this.props.sendScreenStore.ui

        let fiatFee = RateEquivalent.mul({ value: this.state.feesPretty, currencyCode: 'ETH', basicCurrencyRate: feesBasicCurrencyRate })
        if (Number(fiatFee) < 0.01) {
            fiatFee = `< ${feesBasicCurrencySymbol} 0.01`
        } else {
            fiatFee = `${feesBasicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(fiatFee).justCutted}`
        }


        const customFee = strings(`send.fee.customFee.calculatedFee`) + `\n${this.state.feesPretty} ${feesCurrencySymbol} / ${fiatFee} `

        return (
            <View style={{ marginTop: 10, paddingHorizontal: GRID_SIZE  }}>
                <View>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{customFee}</Text>
                </View>
                <View style={{ paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{strings(`send.fee.customFee.eth.gasPrice`)}</Text>
                </View>
                <View style={{ ...styles.inputWrapper, marginBottom: GRID_SIZE }}>
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
                        onFocus={this.props.onFocus}
                    />
                </View>
                <View style={{ marginBottom: GRID_SIZE }}>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{strings(`send.fee.customFee.eth.gasLimit`)}</Text>
                </View>
                <View style={{ ...styles.inputWrapper, marginBottom: GRID_SIZE }}>
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
                        disabled={isTransferAll}
                        callback={(value) => this.handleRecount('gasLimit', value)}
                        onFocus={this.props.onFocus}
                    />
                </View>
                {this.renderGasError()}
                <View style={{ marginBottom: GRID_SIZE }}>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{strings(`send.fee.customFee.eth.nonce`)}</Text>
                </View>
                <View style={{ ...styles.inputWrapper, marginBottom: GRID_SIZE }}>
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
                        onFocus={this.props.onFocus}
                    />
                </View>
            </View>
        )
    }
}

SendCustomFeeETH.contextType = ThemeContext

export default SendCustomFeeETH

const styles = StyleSheet.create({
    inputWrapper: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 8,
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
        fontSize: 14
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
