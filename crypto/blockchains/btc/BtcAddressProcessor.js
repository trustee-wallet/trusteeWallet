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
        if (typeof (networksConstants[settings.network]) === 'undefined') {
            throw new Error('while retrieving Bitcoin address - unknown Bitcoin network specified. Got : ' + settings.network)
        }
        this._currentBitcoinNetwork = networksConstants[settings.network].network
    }

    getAddress(privateKey) {
        let keyPair = bitcoin.ECPair.fromPrivateKey(privateKey, {network: this._currentBitcoinNetwork})
        let address = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: this._currentBitcoinNetwork}).address
        return {address, privateKey: keyPair.toWIF()}
    }

    getAddressByPublic(publicKey) {
        let pubkeyBuffer = Buffer.from(publicKey.hex, 'hex')
        let keyPair = bitcoin.ECPair.fromPublicKey(pubkeyBuffer)
        let address = bitcoin.payments.p2pkh({
            pubkey: keyPair.publicKey,
            network: this._currentBitcoinNetwork
        }).address
        return address
    }

    getAddressByRawWithWitness(raw) {
        let parsed = bitcoin.Transaction.fromHex(raw)
        if (typeof parsed.ins[0] === 'undefined') return false
        if (typeof parsed.ins[0].witness === 'undefined') return false

        if (!parsed.ins[0].witness || !parsed.ins[0].witness.length) return false
        let witness = [
            Buffer.from(parsed.ins[0].witness[0], 'hex'),
            Buffer.from(parsed.ins[0].witness[1], 'hex')
        ]
        let address = bitcoin.payments.p2wpkh({
            witness,
            network: this._currentBitcoinNetwork
        }).address
        return address
    }
}

module.exports.init = function (settings) {
    return new BtcAddressProcessor(settings)
}
