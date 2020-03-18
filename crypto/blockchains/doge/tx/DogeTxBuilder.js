/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const networksConstants = require('../../../common/ext/networks-constants')

const bitcoin = require('bitcoinjs-lib')

export default class DogeTxBuilder {

    /**
     * @param {Object} settings
     * @param {int} settings.decimals
     * @param {string} settings.network
     * @param {int} minFeeLimitReadable
     */
    constructor(settings, minFeeLimitReadable) {
        this._settings = settings
        this._bitcoinNetwork = networksConstants[settings.network].network
        this._minFeeLimit = BlocksoftUtils.fromUnified(minFeeLimitReadable, settings.decimals)
    }

    _getRawTxValidateKeyPair(privateKey, addressFrom) {
        this.keyPair = false
        try {
            this.keyPair = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            const address = bitcoin.payments.p2pkh({
                pubkey: this.keyPair.publicKey,
                network: this._bitcoinNetwork
            }).address
            if (address !== addressFrom) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('not valid signing address ' + addressFrom + ' != ' + address)
            }
        } catch (e) {
            e.message += ' in privateKey DOGE signature check '
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
     * @param {string} logInputsOutputs.msg
     * @param {string} logInputsOutputs.totalIn
     * @param {string} logInputsOutputs.diffInOutReadable
     * @param {string} logInputsOutputs.diffInOut
     * @param {string} logInputsOutputs.totalOut
     * @private
     */
    getRawTx(data, preparedInputsOutputs, logInputsOutputs) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('DogeTxBuilder.getRawTx requires privateKey')
        }
        if (typeof data.nSequence === 'undefined') {
            data.nSequence = 0xfffffffe
        }

        this._getRawTxValidateKeyPair(data.privateKey, data.addressFrom, data)
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx validated address private key')

        let feeLimit = preparedInputsOutputs.feeForByte * 10000
        BlocksoftCryptoLog.log('preparedInputsOutputs.feeLimit_1', feeLimit)
        if (feeLimit < logInputsOutputs.diffInOut) {
            feeLimit = logInputsOutputs.diffInOut * 1
            BlocksoftCryptoLog.log('preparedInputsOutputs.feeLimit_2', feeLimit)
        }
        if (feeLimit < this._minFeeLimit) {
            feeLimit = this._minFeeLimit
            BlocksoftCryptoLog.log('preparedInputsOutputs.feeLimit_3', feeLimit)
        }
        const txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork, feeLimit)
        BlocksoftCryptoLog.log('preparedInputsOutputs.feeForByte', preparedInputsOutputs.feeForByte)



        txb.setVersion(1)

        const log = { inputs: [], outputs: [] }
        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            const input = preparedInputsOutputs.inputs[i]
            this._getRawTxAddInput(txb, i, input.txid, input.vout, data.nSequence)
            log.inputs.push({ txid: input.txid, vout: input.vout, nSequence : data.nSequence })
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx input added', input)
        }

        let output
        for (output of preparedInputsOutputs.outputs) {
            this._getRawTxAddOutput(txb, output.to, output.amount * 1)
            log.outputs.push({ addressTo: output.to, amount: output.amount})
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx output added ', output )
        }

        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            try {
                const input = preparedInputsOutputs.inputs[i]
                this._getRawTxSign(txb, i, input.value * 1)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx sign added')
            } catch (e) {
                e.message = ' transaction DOGE sign error: ' + e.message
                throw e
            }
        }

        let hex
        try {
            hex = txb.build().toHex()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxBuilder.getRawTx size ' + hex.length, log)
        } catch (e) {
            e.message = ' transaction DOGE build error: ' + e.message
            throw e
        }

        return hex
    }
}
