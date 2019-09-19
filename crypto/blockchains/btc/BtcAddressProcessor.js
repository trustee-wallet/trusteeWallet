let bitcoin = require('bitcoinjs-lib')
const networksConstants = require('../../common/ext/networks-constants')
class BtcAddressProcessor {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcAddressProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcAddressProcessor requires settings.network')
        }
        switch (settings.network) {
            case 'litecoin':
                this._currentBitcoinNetwork = networksConstants.LTC
                break
            case 'mainnet':
                this._currentBitcoinNetwork = bitcoin.networks.bitcoin
                break
            case 'testnet':
                this._currentBitcoinNetwork = bitcoin.networks.testnet
                break
            default:
                throw new Error('while retrieving Bitcoin address - unknown Bitcoin network specified. Got : ' + settings.network)
        }

    }

    getAddress(privateKey) {
        let keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, {network: this._currentBitcoinNetwork})
        let address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: this._currentBitcoinNetwork }).address
        return { address, privateKey : keyPair.toWIF() }
    }
}

module.exports.init = function(settings) {
    return new BtcAddressProcessor(settings)
}
