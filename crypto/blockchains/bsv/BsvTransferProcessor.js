/**
 * @version 0.5
 */
import DogeTransferProcessor from '../doge/DogeTransferProcessor'

import BsvUnspentsProvider from './providers/BsvUnspentsProvider'
import BsvSendProvider from './providers/BsvSendProvider'

import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'

import DogeTxBuilder from '../doge/tx/DogeTxBuilder'

export default class BsvTransferProcessor extends DogeTransferProcessor {

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BsvUnspentsProvider(this._settings)
        this.sendProvider = new BsvSendProvider(this._settings)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings)
        this.txBuilder = new DogeTxBuilder(this._settings)
        this._initedProviders = true
    }
}
