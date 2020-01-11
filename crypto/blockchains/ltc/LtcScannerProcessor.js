/**
 * @version 0.5
 */

import DogeScannerProcessor from '../doge/DogeScannerProcessor'

export default class LtcScannerProcessor extends DogeScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {string}
     * @private
     */
    _trezorPath = 'https://ltc1.trezor.io/api/v2/address/'
}
