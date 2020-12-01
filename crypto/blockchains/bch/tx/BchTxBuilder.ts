/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeTxBuilder from '../../doge/tx/DogeTxBuilder'
import BtcCashUtils from '../ext/BtcCashUtils'
import { TransactionBuilder } from 'bitcoinjs-lib'

const bitcoin = require('bitcoinjs-lib')

export default class BchTxBuilder extends DogeTxBuilder implements BlocksoftBlockchainTypes.TxBuilder {
    
    _getRawTxValidateKeyPair(privateData: BlocksoftBlockchainTypes.TransferPrivateData, data: BlocksoftBlockchainTypes.TransferData): void {
        this.keyPair = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateData.privateKey, this._bitcoinNetwork)
            const address = bitcoin.payments.p2pkh({
                pubkey: this.keyPair.publicKey,
                network: this._bitcoinNetwork
            }).address
            const legacyAddress = BtcCashUtils.toLegacyAddress(data.addressFrom)
            if (address !== data.addressFrom && address !== legacyAddress) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('not valid signing address ' + data.addressFrom + ' != ' + address + ' != ' + legacyAddress)
            }
        } catch (e) {
            e.message += ' in privateKey BCH signature check '
            throw e
        }
    }

    _getRawTxAddOutput(txb: TransactionBuilder, output: BlocksoftBlockchainTypes.OutputTx): void {
        const to = BtcCashUtils.toLegacyAddress(output.to)
        txb.addOutput(to, output.amount * 1)
    }
}
