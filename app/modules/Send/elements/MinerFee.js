/**
 * @version 0.41
 */
import React from 'react'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import CheckData from '@app/modules/Send/elements/CheckData'
import { feeTitles } from '@app/modules/Send/advanced/helpers'

class MinerFee extends React.PureComponent {

    render() {
        const selectedFee = this.props.sendScreenStoreSelectedFee
        if (typeof selectedFee === 'undefined' || !selectedFee) {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not selectedFee')
            return false
        }

        const {feePretty, feeCurrencySymbol, fiatFee} = feeTitles(selectedFee, this.props.sendScreenStoreDict)

        let nonceForTxTitle = false
        if (selectedFee.isCustomFee) {
            nonceForTxTitle = 'send.receiptScreen.customNonce'
        } else if (typeof selectedFee.showNonce !== 'undefined' && selectedFee.showNonce) {
            nonceForTxTitle = 'send.receiptScreen.nonce'
        }

        return (
            <>
                <CheckData
                    name={strings('send.receiptScreen.minerFee')}
                    value={`${feePretty} ${feeCurrencySymbol}`}
                    subvalue={fiatFee}
                />
                {
                    nonceForTxTitle && typeof selectedFee.nonceForTx !== 'undefined' && (selectedFee.nonceForTx || selectedFee.nonceForTx.toString() === '0') && selectedFee.nonceForTx.toString() !== '-1' ?
                        <CheckData
                            name={strings(nonceForTxTitle)}
                            value={selectedFee.nonceForTx + ''}
                        /> : null
                }
            </>
        )
    }
}

MinerFee.contextType = ThemeContext

export default connect(null, {})(MinerFee)
