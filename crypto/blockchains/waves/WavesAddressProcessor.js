/**
 * @version 0.5
 */
import { crypto, base58Encode } from '@waves/ts-lib-crypto'

export default class WavesAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} _privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(_privateKey, data = {}, superPrivateData = {}) {

        const all = crypto({seed: superPrivateData.mnemonic})
        const buff1 = all.address()
        const address = base58Encode(buff1)
        const key2 = all.keyPair()
        const pubKey = base58Encode(key2.publicKey)
        const privKey = base58Encode(key2.privateKey)
        return { address, privateKey: privKey, addedData: { pubKey} }
    }
}
