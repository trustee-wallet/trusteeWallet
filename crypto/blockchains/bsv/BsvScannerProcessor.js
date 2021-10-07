/**
 * @version 0.5
 */

import BtcScannerProcessor from '../btc/BtcScannerProcessor'

export default class BsvScannerProcessor extends BtcScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BSV_TREZOR_SERVER'
}

