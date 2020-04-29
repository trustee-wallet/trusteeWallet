/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

import BchUnspentsProvider from './providers/BchUnspentsProvider'
import BchSendProvider from './providers/BchSendProvider'

import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'

import BchTxBuilder from './tx/BchTxBuilder'

export default class BchTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.05

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
        this.unspentsProvider = new BchUnspentsProvider(this._settings)
        this.sendProvider = new BchSendProvider(this._settings)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._inputsOutputsSettings)
        this.txBuilder = new BchTxBuilder(this._settings, this._maxDiffInOutReadable)
        this._initedProviders = true
    }
}
