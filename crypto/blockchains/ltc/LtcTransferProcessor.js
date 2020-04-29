/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

export default class LtcTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'LTC_TREZOR_SERVER'

    /**
     *
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.1

    /**
     * @type {{minOutputToBeDustedReadable: number, minChangeThresholdReadable: number, minFee: number}}
     * @private
     */
    _inputsOutputsSettings = {
        minFee : 1000,
        minOutputToBeDustedReadable: 0.000005,
        minChangeThresholdReadable: 0.00001
    }
}
