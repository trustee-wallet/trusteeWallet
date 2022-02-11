/**
 * @version 0.41
 */
import React from 'react'

import BlocksoftDict from '@crypto/common/BlocksoftDict'

import SendCustomFeeETH from '@app/modules/Send/advanced/SendCustomFeeETH'
import SendCustomFeeBTC from '@app/modules/Send/advanced/SendCustomFeeBTC'

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
            if (typeof settings.tokenBlockchain !== 'undefined') {
                if (settings.tokenBlockchain === 'ETHEREUM') {
                    prefix = 'ETH'
                } else if (settings.tokenBlockchain === 'BNB') {
                    prefix = 'BNB'
                }
            }
        }

        switch (prefix) {
            case 'ETH':
            case 'ETC':
            case 'BNB':
            case 'BNB_SMART':
            case 'MATIC':
            case 'FTM':
            case 'OPTIMISM':
            case 'RSK':
            case 'AMB':
            case 'METIS':
            case 'VLX':
            case 'ONE':
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
                return <SendCustomFeeBTC
                    sendScreenStore={this.props.sendScreenStore}
                    currentSelectedFee={this.props.currentSelectedFee}
                    onFocus={this.props.onFocus}
                />
            default:
                return null
        }
    }
}

export default SendCustomFee
