/**
 * @version 0.5
 */

import DogeTransferProcessor from '../doge/DogeTransferProcessor'

export default class LtcTransferProcessor extends DogeTransferProcessor {

    /**
     * @type {string}
     * @private
     */
    _trezorServer = 'https://ltc1.trezor.io'

    /**
     * @type {number}
     * @private
     */
    _maxDiffInOutReadable = 0.1
}
