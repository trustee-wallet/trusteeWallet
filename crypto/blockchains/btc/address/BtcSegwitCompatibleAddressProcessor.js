/**
 * @version 0.5
 */
import BtcAddressProcessor from './BtcAddressProcessor'

const bitcoin = require('bitcoinjs-lib')

export default class BtcSegwitCompatibleAddressProcessor extends BtcAddressProcessor {
    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, { network: this._currentBitcoinNetwork })
        const address = bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey }) }).address
        return { address, privateKey: keyPair.toWIF() }
    }
}
