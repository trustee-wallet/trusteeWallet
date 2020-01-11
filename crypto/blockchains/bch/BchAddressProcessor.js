/**
 * @version 0.5
 */
import BtcCashUtils from './ext/BtcCashUtils'
import BtcAddressProcessor from '../btc/address/BtcAddressProcessor'

let bitcoin = require('bitcoinjs-lib')

export default class BchAddressProcessor extends BtcAddressProcessor {

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        let keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, { network: this._currentBitcoinNetwork })
        let publicKey = keyPair.publicKey
        let address = BtcCashUtils.fromPublicKeyToAddress(publicKey)
        let legacyAddress = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: this._currentBitcoinNetwork}).address
        return { address, privateKey: keyPair.toWIF(), addedData: { legacyAddress } }
    }
}
