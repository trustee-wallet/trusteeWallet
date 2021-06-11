/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import DogeTransferProcessor from '../doge/DogeTransferProcessor'
import BchUnspentsProvider from './providers/BchUnspentsProvider'
import BchSendProvider from './providers/BchSendProvider'
import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'
import BchTxBuilder from './tx/BchTxBuilder'

export default class BchTransferProcessor extends DogeTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    _trezorServerCode = 'BCH_TREZOR_SERVER'

    _builderSettings: BlocksoftBlockchainTypes.BuilderSettings = {
        minOutputDustReadable: 0.000005,
        minChangeDustReadable: 0.00001,
        feeMaxForByteSatoshi: 10000, // for tx builder
        feeMaxAutoReadable2: 0.2, // for fee calc,
        feeMaxAutoReadable6: 0.1, // for fee calc
        feeMaxAutoReadable12: 0.05, // for fee calc
        changeTogether: true,
        minRbfStepSatoshi: 10,
        minSpeedUpMulti : 1.5
    }
    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BchUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new BchSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._builderSettings)
        this.txBuilder = new BchTxBuilder(this._settings, this._builderSettings)
        this._initedProviders = true
    }
}
