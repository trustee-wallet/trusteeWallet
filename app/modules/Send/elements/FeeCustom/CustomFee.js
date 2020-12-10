/**
 * @version 0.1
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

    renderFee = () => {

        const { currencyCode, useAllFunds, countedFees, selectedFee, feesCurrencyCode, basicCurrencySymbol, basicCurrencyRate, updateSelectedFeeBack, onFocus } = this.props

        let prefix = currencyCode
        if (typeof currencyCode !== 'undefined' && currencyCode) {
            const tmp = currencyCode.split('_')
            if (typeof tmp[0] !== 'undefined' && tmp[0]) {
                prefix = tmp[0]
            }
        }

        switch (prefix) {
            case 'ETH':
                this.state.selectedCustomFeeComponent = 'customFeeEthereum'
                return <CustomFeeEthereum
                    ref={ref => this.customFeeEthereum = ref}
                    currencyCode={currencyCode}
                    feesCurrencyCode={feesCurrencyCode}
                    basicCurrencySymbol={basicCurrencySymbol}
                    basicCurrencyRate={basicCurrencyRate}
                    countedFees={countedFees}
                    selectedFee={selectedFee}
                    useAllFunds={useAllFunds}
                    updateSelectedFeeBack={updateSelectedFeeBack}
                />
            case 'BTC':
            case 'LTC':
            case 'XVG':
            case 'DOGE':
            case 'USDT':
            case 'BSV':
            case 'BTG':
            case 'BCH':
                this.state.selectedCustomFeeComponent = 'customFeeBitcoin'
                return <CustomFeeBitcoin
                    ref={ref => this.customFeeBitcoin = ref}
                    currencyCode={currencyCode}
                    feesCurrencyCode={feesCurrencyCode}
                    basicCurrencySymbol={basicCurrencySymbol}
                    basicCurrencyRate={basicCurrencyRate}
                    countedFees={countedFees}
                    selectedFee={selectedFee}
                    useAllFunds={useAllFunds}
                    updateSelectedFeeBack={updateSelectedFeeBack}
                    />
            default:

                return <View><Text>Default</Text></View>
        }
    }

    render() {
        return this.renderFee()
    }
}

export default CustomFee