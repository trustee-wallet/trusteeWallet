/**
 * @version 0.5
 */
import BtcTransferProcessor from '../btc/BtcTransferProcessor'

import BtcTestUnspentsProvider from './providers/BtcTestUnspentsProvider'
import BtcTestSendProvider from './providers/BtcTestSendProvider'

import BtcTxBuilder from '../btc/tx/BtcTxBuilder'
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

export default class BtcTestTransferProcessor extends BtcTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

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
}
