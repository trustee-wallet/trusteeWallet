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
        const pubKey = TronUtils.privHexToPubHex(privateKey)
        const addressHex = TronUtils.pubHexToAddressHex(pubKey)
        const address = TronUtils.addressHexToStr(addressHex)
        return { address, privateKey : privateKey.toString('hex'), addedData: {addressHex, pubKey} }
    }
}
