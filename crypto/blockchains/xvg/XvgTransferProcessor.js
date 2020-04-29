/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

import XvgUnspentsProvider from './providers/XvgUnspentsProvider'
import XvgSendProvider from './providers/XvgSendProvider'

import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'
import DogeTxBuilder from '../doge/tx/DogeTxBuilder'

export default class XvgTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 3

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee : 1000,
        minOutputToBeDustedReadable: 0.2,
        minChangeThresholdReadable: 0.2
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new XvgUnspentsProvider(this._settings)
        this.sendProvider = new XvgSendProvider(this._settings)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._inputsOutputsSettings)
        this.txBuilder = new DogeTxBuilder(this._settings, this._maxDiffInOutReadable)
        this._initedProviders = true
    }
}
