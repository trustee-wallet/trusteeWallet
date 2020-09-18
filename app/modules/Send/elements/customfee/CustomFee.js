/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, Text } from 'react-native'

import CustomFeeBitcoin from './CustomFeeBitcoin'

import CustomFeeEthereum from './CustomFeeEthereum'


class CustomFee extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedCustomFeeComponent: ''
        }

        this.customFeeBitcoin = React.createRef()
        this.customFeeEthereum = React.createRef()

    }

    handleGetCustomFee = async () => {

        const fee = await this[`${this.state.selectedCustomFeeComponent}`].getCustomFee()

        if (typeof fee == 'undefined')
            throw new Error('validate error')

        return fee
    }

    callTransferAll = (fee) => {

        const { useAllFunds, handleTransferAll } = this.props

        if (useAllFunds) {
            handleTransferAll(fee)
        }
    }

    renderFee = () => {

        let { currencyCode, getCustomFee, useAllFunds } = this.props

        let prefix = currencyCode
        if (typeof currencyCode !== 'undefined' && currencyCode) {
            const tmp = currencyCode.split('_')
            if (typeof tmp[0] !== 'undefined' && tmp[0]) {
                prefix = tmp[0]
            }
        }
        if (typeof getCustomFee === 'undefined') {
            getCustomFee = ''
        }
        switch (prefix) {
            case 'ETH':
                this.state.selectedCustomFeeComponent = 'customFeeEthereum'
                return <CustomFeeEthereum
                    ref={ref => this.customFeeEthereum = ref}
                    getCustomFee={getCustomFee}
                    fee={this.props.fee}
                    currencyCode={currencyCode}
                    callTransferAll={this.callTransferAll}
                    useAllFunds={useAllFunds}/>
            case 'BTC':
            case 'LTC':
            case 'XVG':
            case 'DOGE':
            case 'USDT':
                this.state.selectedCustomFeeComponent = 'customFeeBitcoin'
                return <CustomFeeBitcoin
                    ref={ref => this.customFeeBitcoin = ref}
                    getCustomFee={getCustomFee}
                    fee={this.props.fee}
                    currencyCode={currencyCode}
                    callTransferAll={this.callTransferAll}
                    useAllFunds={useAllFunds}/>
            default:

                return <View><Text>Default</Text></View>
        }
    }

    render() {
        return this.renderFee()
    }
}

export default CustomFee
