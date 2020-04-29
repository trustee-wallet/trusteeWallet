/**
 * @version 0.5
 */
import DogeTransferProcessor from '../doge/DogeTransferProcessor'

import BsvUnspentsProvider from './providers/BsvUnspentsProvider'
import BsvSendProvider from './providers/BsvSendProvider'

import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'

import BsvTxBuilder from './tx/BsvTxBuilder'

export default class BsvTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.1

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee : 2400,
        minOutputToBeDustedReadable: 0.00001,
        minChangeThresholdReadable: 0.00001
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BsvUnspentsProvider(this._settings)
        this.sendProvider = new BsvSendProvider(this._settings)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._inputsOutputsSettings)
        this.txBuilder = new BsvTxBuilder(this._settings, this._maxDiffInOutReadable)
        this._initedProviders = true
    }
}
