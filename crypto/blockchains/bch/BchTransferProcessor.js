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
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BchUnspentsProvider(this._settings)
        this.sendProvider = new BchSendProvider(this._settings)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings)
        this.txBuilder = new BchTxBuilder(this._settings)
        this._initedProviders = true
    }
}
