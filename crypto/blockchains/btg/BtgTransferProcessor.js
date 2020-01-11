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
}
