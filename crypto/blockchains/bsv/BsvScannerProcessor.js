/**
 * @version 0.5
 */

import DogeScannerProcessor from '../doge/DogeScannerProcessor'
import BtcCashUtils from '@crypto/blockchains/bch/ext/BtcCashUtils'

export default class BsvScannerProcessor extends DogeScannerProcessor {

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

    _addressesForFind(address, jsonData = {}) {
        const address2 = BtcCashUtils.fromLegacyAddress(address)
        return [address, address2, 'bitcoincash:' + address2]
    }
}

