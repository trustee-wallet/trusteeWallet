/**
 * @version 0.5
 */
import BtcTxBuilder from './BtcTxBuilder'

const bitcoin = require('bitcoinjs-lib')

export default class BtcSegwitCompatibleTxBuilder extends BtcTxBuilder {

    _getRawTxValidateKeyPair(privateKey, addressFrom) {
        this.keyPair = false
        this.p2wpkh = false
        this.p2sh = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            this.p2wpkh = bitcoin.payments.p2wpkh({ pubkey: this.keyPair.publicKey, network: this._bitcoinNetwork })
            this.p2sh = bitcoin.payments.p2sh({ redeem: this.p2wpkh, network: this._bitcoinNetwork })
        } catch (e) {
            e.message += ' in privateKey Segwit COMPATIBLE signature check '
            throw e
        }

        if (typeof this.p2sh.address === 'undefined') {
            throw new Error('not valid segwit compatible p2sh')
        }
        const address = this.p2sh.address
        if (address !== addressFrom) {
            throw new Error('not valid segwit compatible signing address ' + addressFrom + ' != ' + address)
        }
    }

    _getRawTxSign(txb, i, value) {
        txb.sign(i, this.keyPair, this.p2sh.redeem.output, null, value)
    }
}
