/**
 * @version 0.41
 */
import React from 'react'

import { View, Text } from 'react-native'
import BlocksoftDict from '@crypto/common/BlocksoftDict'



class SendCustomFee extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            selectedCustomFeeComponent: ''
        }
    }

    render = () => {

        const { currencyCode } = this.props.ExtraViewParams.dict

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
                return <View><Text>eth gxfgxfg</Text></View>
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

                return <View><Text>gxfgxfg</Text></View>
        }
    }
}

export default SendCustomFee
