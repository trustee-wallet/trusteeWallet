/**
 * @version 0.5
 */
import BtcCashUtils from './ext/BtcCashUtils'
import BtcAddressProcessor from '../btc/address/BtcAddressProcessor'

const bitcoin = require('bitcoinjs-lib')

export default class BchAddressProcessor extends BtcAddressProcessor {

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, { network: this._currentBitcoinNetwork })
        const publicKey = keyPair.publicKey
        const address = BtcCashUtils.fromPublicKeyToAddress(publicKey)
        const legacyAddress = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: this._currentBitcoinNetwork}).address
        return { address, privateKey: keyPair.toWIF(), addedData: { legacyAddress } }
    }
}
