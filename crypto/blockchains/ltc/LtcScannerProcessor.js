/**
 * @version 0.5
 */

import BtcScannerProcessor from '../btc/BtcScannerProcessor'

export default class LtcScannerProcessor extends BtcScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'LTC_TREZOR_SERVER'
}
