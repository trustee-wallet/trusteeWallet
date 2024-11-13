/**
 * @version 0.5
 */
import TronUtils from './ext/TronUtils'

export default class TrxAddressProcessor {

    async setBasicRoot(root) {

    }
    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        let pubKey, addressHex, address
        try {
            pubKey = TronUtils.privHexToPubHex(privateKey)
        } catch (e) {
            throw new Error(e.message + ' while TronUtils.privHexToPubHex')
        }
        try {
            addressHex = TronUtils.pubHexToAddressHex(pubKey)
        } catch (e) {
            throw new Error(e.message + ' while TronUtils.pubHexToAddressHex')
        }
        try {
            address = TronUtils.addressHexToStr(addressHex)
        } catch (e) {
            throw new Error(e.message + ' while TronUtils.addressHexToStr')
        }
        return { address, privateKey: privateKey.toString('hex'), addedData: { addressHex, pubKey } }
    }
}
