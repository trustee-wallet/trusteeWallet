/**
 * @version 0.5
 * https://github.com/iancoleman/bip39/blob/aa793f572f26ad20740f28040de13431c973dfb8/src/js/ripple-util.js
 */
let bitcoin = require('bitcoinjs-lib')
let basex = require('base-x')

export default class XrpAddressProcessor {
    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        //if (typeof (privateKey) === 'String') {
        privateKey = Buffer.from(privateKey)
        //}
        let keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, {network: this._currentBitcoinNetwork})
        let btcPrivateKey = keyPair.toWIF()
        let ripplePrivateKey = basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(btcPrivateKey).toString("hex").slice(2,66)
        let btcAddress = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: bitcoin.networks.bitcoin}).address
        let rippleAddress = basex('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz').encode(
            basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(btcAddress)
        )
        return {address: rippleAddress, privateKey: ripplePrivateKey, addedData : {publicKey : data.publicKey.toString('hex')}}
    }
}
