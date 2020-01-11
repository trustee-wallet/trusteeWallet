/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

import XvgUnspentsProvider from './providers/XvgUnspentsProvider'
import XvgSendProvider from './providers/XvgSendProvider'
import XvgTxInputsOutputs from './tx/XvgTxInputsOutputs'

import DogeTxBuilder from '../doge/tx/DogeTxBuilder'

export default class XvgTransferProcessor extends DogeTransferProcessor {

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new XvgUnspentsProvider(this._settings)
        this.sendProvider = new XvgSendProvider(this._settings)
        this.txPrepareInputsOutputs = new XvgTxInputsOutputs(this._settings)
        this.txBuilder = new DogeTxBuilder(this._settings)
        this._initedProviders = true
    }
}
