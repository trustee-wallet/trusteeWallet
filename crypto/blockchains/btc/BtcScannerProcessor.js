/**
 * @version 0.5
 * @todo alternative tx providers back
 */

import DogeScannerProcessor from '../doge/DogeScannerProcessor'

export default class BtcScannerProcessor extends DogeScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 3

    /**
     * @type {string}
     * @private
     */
    _trezorPath = 'https://btc1.trezor.io/api/v2/address/'
}
