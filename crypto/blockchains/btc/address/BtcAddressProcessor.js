/**
 * @version 0.5
 */
const bitcoin = require('bitcoinjs-lib')

const networksConstants = require('../../../common/ext/networks-constants')

export default class BtcAddressProcessor {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcAddressProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcAddressProcessor requires settings.network')
        }
        if (typeof networksConstants[settings.network] === 'undefined') {
            throw new Error('while retrieving Bitcoin address - unknown Bitcoin network specified. Got : ' + settings.network)
        }
        this._currentBitcoinNetwork = networksConstants[settings.network].network
    }

    setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, { network: this._currentBitcoinNetwork })
        const address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey,  network: this._currentBitcoinNetwork}).address
        return { address, privateKey: keyPair.toWIF() }
    }
}
