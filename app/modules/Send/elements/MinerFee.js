/**
 * @version 0.41
 */
import React from 'react'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import CheckData from '@app/modules/Send/elements/CheckData'
import { feesTitles } from '@app/modules/Send/advanced/helpers'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

class MinerFee extends React.PureComponent {

    render() {
        const selectedFee = this.props.sendScreenStoreSelectedFee
        if (typeof selectedFee === 'undefined' || !selectedFee) {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not selectedFee')
            return false
        }

        const devMode = MarketingEvent.DATA.LOG_DEV
        const {feesPretty, feesCurrencySymbol, fiatFee} = feesTitles(selectedFee, this.props.sendScreenStoreDict)

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
                    value={`${feesPretty} ${feesCurrencySymbol}`}
                    subvalue={fiatFee}
                />
                {
                    devMode && selectedFee && typeof selectedFee.blockchainData !== 'undefined' && selectedFee.blockchainData && typeof selectedFee.blockchainData.preparedInputsOutputs !== 'undefined' ?
                        <CheckData
                            name={'DEV Mode'}
                            value={ selectedFee.feeForByte + ' sat/B ' + (typeof selectedFee.needSpeed !== 'undefined' && selectedFee.needSpeed ? (' rec. ' + selectedFee.needSpeed + ' sat/B') : '')}
                            subvalue={'ins: ' + selectedFee.blockchainData.preparedInputsOutputs.inputs.length + ' outs: ' + selectedFee.blockchainData.preparedInputsOutputs.outputs.length}
                        /> : null
                }
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

export default MinerFee
