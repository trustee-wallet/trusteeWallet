/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */

import DogeScannerProcessor from '../doge/DogeScannerProcessor'

export default class BtgScannerProcessor extends DogeScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTG_TREZOR_SERVER'
}
