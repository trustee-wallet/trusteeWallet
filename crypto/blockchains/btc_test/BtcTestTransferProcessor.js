/**
 * @version 0.5
 */
import BtcTransferProcessor from '../btc/BtcTransferProcessor'

import BtcTestUnspentsProvider from './providers/BtcTestUnspentsProvider'
import BtcTestSendProvider from './providers/BtcTestSendProvider'

import BtcTxInputsOutputs from '../btc/tx/BtcTxInputsOutputs'

import BtcTxBuilder from '../btc/tx/BtcTxBuilder'

export default class BtcTestTransferProcessor extends BtcTransferProcessor {

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BtcTestUnspentsProvider(this._settings)
        this.sendProvider = new BtcTestSendProvider(this._settings)
        this.txPrepareInputsOutputs = new BtcTxInputsOutputs(this._settings)
        this.txBuilder = new BtcTxBuilder(this._settings)
        this._initedProviders = true
    }
}
