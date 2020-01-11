/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const networksConstants = require('../../../common/ext/networks-constants')

let bitcoin = require('bitcoinjs-lib')

export default class DogeTxBuilder {
    constructor(settings) {
        this._settings = settings
        this._bitcoinNetwork = networksConstants[settings.network].network
    }

    _getRawTxValidateKeyPair(privateKey, addressFrom, data) {
        this.keyPair = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            let address = bitcoin.payments.p2pkh({
                pubkey: this.keyPair.publicKey,
                network: this._bitcoinNetwork
            }).address
            if (address !== addressFrom) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('not valid signing address ' + addressFrom + ' != ' + address)
            }
        } catch (e) {
            e.message += ' in privateKey signature check '
            throw e
        }
    }

    _getRawTxAddInput(txb, i, txId, vout, nSequence) {
        txb.addInput(txId, vout, nSequence)
    }

    _getRawTxSign(txb, i, value) {
        txb.sign(i, this.keyPair, null, null, value)
    }

    _getRawTxAddOutput(txb, to, amount) {
        txb.addOutput(to, amount)
    }


    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} preparedInputsOutputs.feeForByte
     * @param {string} preparedInputsOutputs.inputs[].txid
     * @param {string} preparedInputsOutputs.inputs[].vout
     * @param {string} preparedInputsOutputs.inputs[].value
     * @param {string} preparedInputsOutputs.inputs[].height
     * @param {string} preparedInputsOutputs.inputs[].confirmations
     * @param {string} preparedInputsOutputs.inputs].valueBN
     * @param {string} preparedInputsOutputs.outputs[].to
     * @param {string} preparedInputsOutputs.outputs[].amount
     * @return {Promise<string>}
     */
    getRawTx(data, preparedInputsOutputs) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('DogeTxBuilder.getRawTx requires privateKey')
        }
        if (typeof data.nSequence === 'undefined') {
            data.nSequence = 0xfffffffe
        }

        this._getRawTxValidateKeyPair(data.privateKey, data.addressFrom, data)
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx validated address private key')

        let txb
        if (preparedInputsOutputs.feeForByte <= 250 ) {
            txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork)
        } else {
            BlocksoftCryptoLog.log('preparedInputsOutputs.feeForByte', preparedInputsOutputs.feeForByte)
            txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork, preparedInputsOutputs.feeForByte * 10)
        }
        txb.setVersion(1)

        let log = { inputs: [], outputs: [] }
        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            let input = preparedInputsOutputs.inputs[i]
            this._getRawTxAddInput(txb, i, input.txid, input.vout, data.nSequence)
            log.inputs.push({ txid: input.txid, vout: input.vout, nSequence : data.nSequence })
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx input added', input)
        }

        for (let output of preparedInputsOutputs.outputs) {
            this._getRawTxAddOutput(txb, output.to, output.amount * 1)
            log.outputs.push({ addressTo: output.to, amount: output.amount})
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx output added ', output )
        }

        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            try {
                let input = preparedInputsOutputs.inputs[i]
                this._getRawTxSign(txb, i, input.value * 1)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx sign added')
            } catch (e) {
                alert(e.message)
                e.message = ' transaction sign error: ' + e.message
                throw e
            }
        }

        let hex
        try {
            hex = txb.build().toHex()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx size ' + hex.length, log)
        } catch (e) {
            e.message = ' transaction build error: ' + e.message
            throw e
        }

        return hex
    }
}
