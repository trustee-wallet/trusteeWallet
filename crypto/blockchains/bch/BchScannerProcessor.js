/**
 * @version 0.11
 * https://developer.bitcoin.com/rest/docs/address => trezor
 */
import DogeScannerProcessor from '../doge/DogeScannerProcessor'
import BtcCashUtils from './ext/BtcCashUtils'

export default class BchScannerProcessor extends DogeScannerProcessor{

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 5

    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BCH_TREZOR_SERVER'

    async _get(address, jsonData) {
        let legacyAddress
        if (typeof jsonData.legacyAddress !== 'undefined') {
            legacyAddress = jsonData.legacyAddress
        } else {
            legacyAddress = BtcCashUtils.toLegacyAddress(address)
        }
        return super._get(legacyAddress)
    }

    _addressesForFind(address, jsonData) {
        let legacyAddress
        if (typeof jsonData.legacyAddress !== 'undefined') {
            legacyAddress = jsonData.legacyAddress
        } else {
            legacyAddress = BtcCashUtils.toLegacyAddress(address)
        }

        return [address, legacyAddress, 'bitcoincash:' + address]
    }
}
