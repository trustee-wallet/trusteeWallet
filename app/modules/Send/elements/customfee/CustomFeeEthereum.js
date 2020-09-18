/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, Text } from 'react-native'

import { strings } from '../../../../services/i18n'

import GasPriceAmountInput from '../../../../components/elements/Input'

import GasLimitAmountInput from '../../../../components/elements/Input'

import BlocksoftUtils from '../../../../../crypto/common/BlocksoftUtils'


class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.gasPriceInput = React.createRef()
        this.gasLimitInput = React.createRef()
    }

    componentDidMount() {
        if (typeof this.props.fee.gasLimit !== 'undefined') {
            this.gasPriceInput.handleInput(BlocksoftUtils.toGwei(this.props.fee.gasPrice), false)
            this.gasLimitInput.handleInput(this.props.fee.gasLimit.toString(), false)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (Object.keys(nextProps.fee).length !== 0 && (JSON.stringify(nextProps.fee) !== JSON.stringify(this.props.fee)) && typeof nextProps.fee.gasLimit !== 'undefined') {
            this.gasPriceInput.handleInput(BlocksoftUtils.toGwei(nextProps.fee.gasPrice), false)
            this.gasLimitInput.handleInput(nextProps.fee.gasLimit.toString(), false)
        }
    }

    getCustomFee = async () => {

        const gasPriceInputValidate = await this.gasPriceInput.handleValidate()
        const gasLimitInputValidate = await this.gasLimitInput.handleValidate()

        if (gasPriceInputValidate.status === 'success'
            && gasLimitInputValidate.status === 'success'
            && gasPriceInputValidate.value !== 0
            && gasLimitInputValidate.value !== 0) {

            const res = {
                gasPrice: BlocksoftUtils.toWei(gasPriceInputValidate.value, 'gwei'),
                gasLimit: gasLimitInputValidate.value,
                isCustomFee : true
            }
            res.feeForTx = BlocksoftUtils.mul(res.gasLimit, gasPriceInputValidate.value)
            return res
        }
    }

    handleGasPriceCallback = async (gasPrice) => {
        const gasLimitInputValidate = await this.gasLimitInput.handleValidate()

        this.props.callTransferAll({
            feeForTx: BlocksoftUtils.toWei(gasPrice === '' ? 0 : gasPrice, 'gwei') * gasLimitInputValidate.value
        })
    }

    handleGasLimitAmountCallback = async (gasLimit) => {
        const gasPriceInputValidate = await this.gasPriceInput.handleValidate()

        this.props.callTransferAll({
            feeForTx: BlocksoftUtils.toWei(gasPriceInputValidate.value === '' ? 0 : gasPriceInputValidate.value, 'gwei') * gasLimit
        })
    }

    render() {
        return (
            <View>
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
                    callback={this.handleGasPriceCallback}/>
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
                    disabled={this.props.useAllFunds}/>
            </View>
        )
    }
}

export default CustomFee
