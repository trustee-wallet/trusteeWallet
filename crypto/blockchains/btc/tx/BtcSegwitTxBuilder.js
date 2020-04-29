/**
 * @version 0.5
 */
import BtcTxBuilder from './BtcTxBuilder'

const bitcoin = require('bitcoinjs-lib')

export default class BtcSegwitTxBuilder extends BtcTxBuilder {

    _getRawTxValidateKeyPair(privateKey, addressFrom) {
        this.keyPair = false
        this.p2wpkh = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            this.p2wpkh = bitcoin.payments.p2wpkh({ pubkey: this.keyPair.publicKey, network: this._bitcoinNetwork })
        } catch (e) {
            e.message += ' in privateKey Segwit signature check '
            throw e
        }

        if (typeof this.p2wpkh.address === 'undefined') {
            throw new Error('not valid segwit p2sh')
        }

        const address = this.p2wpkh.address
        if (address !== addressFrom) {
            throw new Error('not valid segwit compatible signing address ' + addressFrom + ' != ' + address)
        }
    }

    _getRawTxAddInput(txb, i, txId, vout, nSequence) {
        txb.addInput(txId, vout, nSequence, this.p2wpkh.output)
    }

    _getRawTxSign(txb, i, value) {
        txb.sign(i, this.keyPair, null, null, value)
    }
}
