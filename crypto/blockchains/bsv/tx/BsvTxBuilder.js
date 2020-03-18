/**
 * @version 0.5
 */
import DogeTxBuilder from '../../doge/tx/DogeTxBuilder'
import BtcCashUtils from '../../bch/ext/BtcCashUtils'

const bitcoin = require('bitcoinjs-lib')

export default class BsvTxBuilder extends DogeTxBuilder {
    _getRawTxValidateKeyPair(privateKey, addressFrom) {
        this.keyPair = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            const address = bitcoin.payments.p2pkh({
                pubkey: this.keyPair.publicKey,
                network: this._bitcoinNetwork
            }).address
            const legacyAddress = BtcCashUtils.toLegacyAddress(addressFrom)
            if (address !== addressFrom && address !== legacyAddress) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('not valid signing address ' + addressFrom + ' != ' + address + ' != ' + legacyAddress)
            }
        } catch (e) {
            e.message += ' in privateKey BSV signature check '
            throw e
        }
    }

    _getRawTxAddOutput(txb, to, amount) {
        to = BtcCashUtils.toLegacyAddress(to)
        txb.addOutput(to, amount)
    }
}
