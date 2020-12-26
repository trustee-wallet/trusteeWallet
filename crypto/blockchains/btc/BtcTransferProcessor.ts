/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import DogeTransferProcessor from '../doge/DogeTransferProcessor'
import BtcUnspentsProvider from './providers/BtcUnspentsProvider'
import DogeSendProvider from '../doge/providers/DogeSendProvider'
import BtcTxInputsOutputs from './tx/BtcTxInputsOutputs'
import BtcTxBuilder from './tx/BtcTxBuilder'
import BtcNetworkPrices from './basic/BtcNetworkPrices'

export default class BtcTransferProcessor extends DogeTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    _trezorServerCode = 'BTC_TREZOR_SERVER'

    _builderSettings: BlocksoftBlockchainTypes.BuilderSettings = {
        minOutputDustReadable: 0.000001,
        minChangeDustReadable: 0.000001,
        feeMaxForByteSatoshi: 1000, // for tx builder
        feeMaxAutoReadable2: 0.01, // for fee calc,
        feeMaxAutoReadable6: 0.005, // for fee calc
        feeMaxAutoReadable12: 0.001, // for fee calc
        changeTogether: true,
        minRbfStepSatoshi: 30,
        minSpeedUpMulti : 1.7
    }

    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BtcUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new DogeSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new BtcTxInputsOutputs(this._settings, this._builderSettings)
        this.txBuilder = new BtcTxBuilder(this._settings, this._builderSettings)
        this.networkPrices = new BtcNetworkPrices()
        this._initedProviders = true
    }
}
