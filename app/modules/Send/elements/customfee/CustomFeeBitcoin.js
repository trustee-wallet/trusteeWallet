/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View } from 'react-native'

import FeeForByteInput from '../../../../components/elements/Input'
import FeeForTxInput from '../../../../components/elements/Input'

import { strings } from '../../../../services/i18n'
import BlocksoftUtils from '../../../../../crypto/common/BlocksoftUtils'

class CustomFee extends Component {

    constructor(props) {
        super(props)
        this.feeForTxInput = React.createRef()
        this.feeForByteInput = React.createRef()

    }

    componentDidMount() {
        this.feeForTxInput.handleInput(this.props.fee.feeForTx.toString(), false)
        this.feeForByteInput.handleInput(this.props.fee.feeForByte.toString(), false)
    }

    /**
     *
     * @param {object} nextProps
     */
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (Object.keys(nextProps.fee).length !== 0 && (JSON.stringify(nextProps.fee) !== JSON.stringify(this.props.fee))) {
            this.feeForTxInput.handleInput(nextProps.fee.feeForTx.toString(), false)
            this.feeForByteInput.handleInput(nextProps.fee.feeForByte.toString(), false)
        }
    }

    /**
     *
     * @param {number} feeForByte
     */
    handleFeeForByteInput = (feeForByte) => {
        this.feeForTxInput.handleInput(((feeForByte * this.props.fee.txSize).toFixed()).toString(), false)
        this.props.callTransferAll({
            feeForTx: feeForByte * this.props.fee.txSize
        })
    }

    /**
     *
     * @param {number} feeForTx
     */
    handleFeeForTxInput = (feeForTx) => {
        this.feeForByteInput.handleInput(((feeForTx / this.props.fee.txSize).toFixed()).toString(), false)
        this.props.callTransferAll({
            feeForTx
        })
    }

    getCustomFee = async () => {

        const feeForTxInputValidate = await this.feeForTxInput.handleValidate()
        const feeForByteInputValidate = await this.feeForByteInput.handleValidate()


        if (feeForTxInputValidate.status === 'success'
            && feeForTxInputValidate.value !== 0
            && feeForByteInputValidate.status === 'success'
            && feeForByteInputValidate.value !== 0) {

            return {
                feeForByte: feeForByteInputValidate.value,
                feeForTx: feeForTxInputValidate.value
            }
        }
    }

    render() {
        return (
            <View>
                <FeeForByteInput
                    ref={component => this.feeForByteInput = component}
                    id={'feeForByte'}
                    name={strings(`send.fee.customFee.btc.feeForByte`)}
                    type={'EMPTY'}
                    additional={'NUMBER'}
                    mark={strings(`send.fee.customFee.btc.satoshi`)}
                    keyboardType={'numeric'}
                    inputBaseColor={'#f4f4f4'}
                    inputTextColor={'#f4f4f4'}
                    markStyle={{ color: '#f4f4f4' }}
                    tintColor={'#f4f4f4'}
                    callback={(feeForTx) => this.handleFeeForByteInput(feeForTx)}/>
                <FeeForTxInput
                    ref={component => this.feeForTxInput = component}
                    id={'feeForTx'}
                    name={strings(`send.fee.customFee.btc.feeForTx`)}
                    type={'EMPTY'}
                    additional={'NUMBER'}
                    mark={strings(`send.fee.customFee.btc.satoshi`)}
                    keyboardType={'numeric'}
                    inputBaseColor={'#f4f4f4'}
                    inputTextColor={'#f4f4f4'}
                    markStyle={{ color: '#f4f4f4' }}
                    tintColor={'#f4f4f4'}
                    callback={(feeForTx) => this.handleFeeForTxInput(feeForTx)}/>
            </View>
        )
    }
}

export default CustomFee
