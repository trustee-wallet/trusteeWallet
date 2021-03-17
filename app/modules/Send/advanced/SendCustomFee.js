/**
 * @version 0.41
 */
import React from 'react'

import { View, Text } from 'react-native'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import SendCustomFeeETH from '@app/modules/Send/advanced/SendCustomFeeETH'

class SendCustomFee extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            selectedCustomFeeComponent: ''
        }
    }

    render = () => {

        const { currencyCode } = this.props.sendScreenStore.dict

        let prefix = currencyCode
        if (typeof currencyCode !== 'undefined' && currencyCode) {
            const tmp = currencyCode.split('_')
            if (typeof tmp[0] !== 'undefined' && tmp[0]) {
                prefix = tmp[0]
            }
        }
        if (prefix === 'CUSTOM') {
            const settings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            if (typeof settings.tokenBlockchain !== 'undefined' && settings.tokenBlockchain === 'ETHEREUM') {
                prefix = 'ETH'
            }
        }

        switch (prefix) {
            case 'ETH':
                return <SendCustomFeeETH
                    sendScreenStore={this.props.sendScreenStore}
                    currentSelectedFee={this.props.currentSelectedFee}
                    onFocus={this.props.onFocus}
                />
            case 'BTC':
            case 'LTC':
            case 'XVG':
            case 'DOGE':
            case 'USDT':
            case 'BSV':
            case 'BTG':
            case 'BCH':
                return <View><Text>btc gxfgxfg</Text></View>
            default:
                return null
        }
    }
}

export default SendCustomFee
