/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

export default class BtgTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {string}
     * @private
     */
    _trezorServer = 'https://btg1.trezor.io'

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.2

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee : 2400,
        minOutputToBeDustedReadable: 0.00001,
        minChangeThresholdReadable: 0.00001
    }
}
