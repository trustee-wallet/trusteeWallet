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
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.1

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee : 500,
        minOutputToBeDustedReadable: 0.00001,
        minChangeThresholdReadable: 0.00001
    }

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BtcTestUnspentsProvider(this._settings)
        this.sendProvider = new BtcTestSendProvider(this._settings)
        this.txPrepareInputsOutputs = new BtcTxInputsOutputs(this._settings, this._inputsOutputsSettings)
        this.txBuilder = new BtcTxBuilder(this._settings, this._maxDiffInOutReadable)
        this._initedProviders = true
    }
}
