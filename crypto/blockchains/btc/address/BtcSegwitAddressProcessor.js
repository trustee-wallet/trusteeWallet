/**
 * @version 0.5
 */
import BtcAddressProcessor from './BtcAddressProcessor'

const bitcoin = require('bitcoinjs-lib')

export default class BtcSegwitAddressProcessor extends BtcAddressProcessor {
    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, { network: this._currentBitcoinNetwork })
        const address = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: this._currentBitcoinNetwork}).address
        return { address, privateKey: keyPair.toWIF() }
    }
}
