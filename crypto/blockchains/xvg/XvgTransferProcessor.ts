/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import DogeTransferProcessor from '../doge/DogeTransferProcessor'
import XvgUnspentsProvider from './providers/XvgUnspentsProvider'
import XvgSendProvider from './providers/XvgSendProvider'
import DogeTxInputsOutputs from '../doge/tx/DogeTxInputsOutputs'
import DogeTxBuilder from '../doge/tx/DogeTxBuilder'

export default class XvgTransferProcessor extends DogeTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {


    _trezorServerCode = 'NONE'

    _builderSettings: BlocksoftBlockchainTypes.BuilderSettings = {
        minOutputDustReadable: 0.000005,
        minChangeDustReadable: 0.00001,
        feeMaxForByteSatoshi: 100000000, // for tx builder
        feeMaxAutoReadable2: 0.2, // for fee calc,
        feeMaxAutoReadable6: 0.1, // for fee calc
        feeMaxAutoReadable12: 0.05, // for fee calc
        changeTogether: true,
        minRbfStepSatoshi: 10,
        minSpeedUpMulti : 1.5
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): boolean {
        return false
    }

    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new XvgUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new XvgSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._builderSettings)
        this.txBuilder = new DogeTxBuilder(this._settings, this._builderSettings)
        this._initedProviders = true
    }
}
