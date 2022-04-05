/**
 * @version 0.5
 * https://github.com/iancoleman/bip39/blob/aa793f572f26ad20740f28040de13431c973dfb8/src/js/ripple-util.js
 */
const bitcoin = require('bitcoinjs-lib')
const basex = require('base-x')

export default class XrpAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        privateKey = Buffer.from(privateKey)
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey)
        const btcPrivateKey = keyPair.toWIF()
        const ripplePrivateKey = basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(btcPrivateKey).toString("hex").slice(2,66)
        const btcAddress = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: bitcoin.networks.bitcoin}).address
        const rippleAddress = basex('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz').encode(
            basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(btcAddress)
        )
        const addedData = {}
        if (typeof data !== 'undefined' && typeof data.publicKey !== 'undefined') {
            addedData.publicKey = data.publicKey.toString('hex')
        }
        return {address: rippleAddress, privateKey: ripplePrivateKey, addedData}
    }
}
