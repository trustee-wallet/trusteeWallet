/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftPrivateKeysUtils from '../../../common/BlocksoftPrivateKeysUtils'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const networksConstants = require('../../../common/ext/networks-constants')

const bitcoin = require('bitcoinjs-lib')

export default class BtcTxBuilder {

    constructor(settings) {
        this._settings = settings
        this._bitcoinNetwork = networksConstants[settings.network].network
        this.keyPair = {}
        this.p2wpkh = {}
        this.p2sh = {}
    }

    /**
     * @param {string} data.mnemonic
     * @param {string} data.walletHash
     * @param {string} inputs[].txid
     * @param {string} inputs[].vout
     * @param {string} inputs[].value
     * @param {string} inputs[].height
     * @param {string} inputs[].address
     * @param {string} inputs[].isSegwit
     * @param {string} inputs[].confirmations
     * @param {string} inputs[].valueBN
     * @returns {Promise<void>}
     * @private
     */
    async _getRawTxValidateKeyPairByInputs(data, inputs) {
        const discoverFor =  {
            mnemonic: data.mnemonic,
            walletHash: data.walletHash,
        }
        for (let i = 0, ic = inputs.length; i < ic; i++ ) {
            const input = inputs[i]
            if (typeof input === 'undefined' || !input) {
                throw new Error('nothing to discover in input ' + JSON.stringify(input))
            }
            if (typeof input.path === 'undefined' || !input.path) {
                throw new Error('no path to discover in input ' + JSON.stringify(input))
            }
            discoverFor.path = input.path
            discoverFor.addressToCheck = input.address
            discoverFor.currencyCode = 'BTC'
            if (input.isSegwit) {
                discoverFor.currencyCode = 'BTC' + input.isSegwit
            }
            const tmp = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor)
            this._getRawTxValidateKeyPair(tmp.privateKey, input.address, input.isSegwit)
        }
    }

    _getRawTxValidateKeyPair(privateKey, addressFrom, isSegwit = false) {
        if (this.keyPair[addressFrom]) return true
        this.keyPair[addressFrom] = false
        if (!privateKey) {
            throw new Error('no privateKey')
        }
        try {
            this.keyPair[addressFrom] = bitcoin.ECPair.fromWIF(privateKey, this._bitcoinNetwork)
            let address
            if (isSegwit === '_SEGWIT') {
                try {
                    this.p2wpkh[addressFrom] = bitcoin.payments.p2wpkh({
                        pubkey: this.keyPair[addressFrom].publicKey,
                        network: this._bitcoinNetwork
                    })
                } catch (e) {
                    e.message += ' in privateKey Segwit signature create'
                    // noinspection ExceptionCaughtLocallyJS
                    throw e
                }

                if (typeof this.p2wpkh[addressFrom].address === 'undefined') {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('not valid segwit p2sh')
                }
                address = this.p2wpkh[addressFrom].address
            } else if (isSegwit === '_SEGWIT_COMPATIBLE') {
                try {
                    this.p2wpkh[addressFrom] = bitcoin.payments.p2wpkh({ pubkey: this.keyPair[addressFrom].publicKey, network: this._bitcoinNetwork })
                    this.p2sh[addressFrom] = bitcoin.payments.p2sh({ redeem: this.p2wpkh[addressFrom], network: this._bitcoinNetwork })
                } catch (e) {
                    e.message += ' in privateKey SegwitCompatible signature create'
                    // noinspection ExceptionCaughtLocallyJS
                    throw e
                }
                if (typeof this.p2sh[addressFrom].address === 'undefined') {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('not valid segwit compatible p2sh')
                }
                address = this.p2sh[addressFrom].address
            } else {
                address = bitcoin.payments.p2pkh({
                    pubkey: this.keyPair[addressFrom].publicKey,
                    network: this._bitcoinNetwork
                }).address
            }

            if (address !== addressFrom) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('not valid signing address ' + addressFrom + ' != ' + address + ' segwit type = ' + JSON.stringify(isSegwit))
            }
        } catch (e) {
            e.message += ' in privateKey BTC signature check '
            throw e
        }
    }

    _getRawTxAddInput(txb, i, txId, vout, nSequence, address) {
        if (typeof (this.p2wpkh[address]) === 'undefined') {
            txb.addInput(txId, vout, nSequence)
        } else if (typeof (this.p2sh[address]) === 'undefined') {
            txb.addInput(txId, vout, nSequence, this.p2wpkh[address].output)
        } else {
            txb.addInput(txId, vout, nSequence)
        }
    }

    _getRawTxSign(txb, i, value, address) {
        if (typeof (this.p2wpkh[address]) === 'undefined') {
            txb.sign(i, this.keyPair[address], null, null, value)
        } else if (typeof (this.p2sh[address]) === 'undefined') {
            txb.sign(i, this.keyPair[address], null, null, value)
        } else {
            txb.sign(i, this.keyPair[address], this.p2sh[address].redeem.output, null, value)
        }

    }

    _getRawTxAddOutput(txb, to, amount) {
        txb.addOutput(to, amount)
    }


    /**
     * @param {string} data.walletHash
     * @param {string} data.mnemonic
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressFromXpub
     * @param {string} data.privateKeyLegacy
     * @param {string} data.addressFromLegacy
     * @param {string} data.addressFromLegacyXpub
     * @param {string} data.txAllowReplaceByFee
     * @param {string} data.walletAllowReplaceByFee
     * @param {string} data.feeForTx.feeForByte
     * @param {number} data.jsonData.nSequence
     * @param {number} data.nSequence
     * @param {string} preparedInputsOutputs.feeForByte
     * @param {string} preparedInputsOutputs.inputs[].txid
     * @param {string} preparedInputsOutputs.inputs[].vout
     * @param {string} preparedInputsOutputs.inputs[].value
     * @param {string} preparedInputsOutputs.inputs[].height
     * @param {string} preparedInputsOutputs.inputs[].address
     * @param {string} preparedInputsOutputs.inputs[].isSegwit
     * @param {string} preparedInputsOutputs.inputs[].confirmations
     * @param {string} preparedInputsOutputs.inputs[].valueBN
     * @param {string} preparedInputsOutputs.outputs[].to
     * @param {string} preparedInputsOutputs.outputs[].amount
     * @return {Promise<string>}
     */
    async getRawTx(data, preparedInputsOutputs) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('BtcTxBuilder.getRawTx requires privateKey')
        }

        const MAX_SEQ = 4294967294 // 0xfffffffe // no replace by fee
        const MIN_SEQ = 4294960000 // for RBF

        if (typeof data.jsonData === 'undefined' || !data.jsonData || typeof data.jsonData.nSequence === 'undefined') {
            if (data.walletAllowReplaceByFee) {
                data.nSequence = MIN_SEQ
                data.txAllowReplaceByFee = true
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx allow RBF ' + data.nSequence)
            } else {
                data.nSequence = MAX_SEQ
                data.txAllowReplaceByFee = false
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx no RBF ' + data.nSequence)
            }
        } else {
            data.nSequence = data.jsonData.nSequence*1 + 1
            data.txAllowReplaceByFee = true

            if (data.nSequence >= MAX_SEQ) {
                data.nSequence = MAX_SEQ
                data.txAllowReplaceByFee = false
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx no RBF by old nSeq ' + data.jsonData.nSequence + ' +1 => ' + data.nSequence)
            } else {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx allow RBF by old nSeq ' + data.jsonData.nSequence + ' +1 => ' + data.nSequence)
            }
        }

        if (data.addressFromXpub) {
            await this._getRawTxValidateKeyPairByInputs(data, preparedInputsOutputs.inputs)
        } else if (typeof data.privateKeyLegacy !== 'undefined') {
            this._getRawTxValidateKeyPair(data.privateKey, data.addressFrom, '_SEGWIT')
            this._getRawTxValidateKeyPair(data.privateKeyLegacy, data.addressFromLegacy, false)
        } else {
            this._getRawTxValidateKeyPair(data.privateKey, data.addressFrom, false)
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx validated address private key')

        let txb
        if (preparedInputsOutputs.feeForByte <= 250 ) {
            txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork)
        } else {
            BlocksoftCryptoLog.log('preparedInputsOutputs.feeForByte', preparedInputsOutputs.feeForByte)
            txb = new bitcoin.TransactionBuilder(this._bitcoinNetwork, preparedInputsOutputs.feeForByte * 10)
        }
        txb.setVersion(1)

        const log = { inputs: [], outputs: [] }
        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            const input = preparedInputsOutputs.inputs[i]
            const tmp = { txid: input.txid, vout: input.vout, nSequence: data.nSequence }
            try {
                this._getRawTxAddInput(txb, i, input.txid, input.vout, data.nSequence, input.address)
                log.inputs.push(tmp)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx input added', input)
            } catch (e) {
                e.message = ' transaction BTC add input error: ' + e.message + ' ' + JSON.stringify(tmp)
                throw e
            }
        }

        let output
        for (output of preparedInputsOutputs.outputs) {
            const tmp = { addressTo: output.to, amount: output.amount}
            try {
                this._getRawTxAddOutput(txb, output.to, output.amount * 1, output)
                log.outputs.push(tmp)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx output added ', output )
            } catch (e) {
                e.message = ' transaction BTC add output error: ' + e.message + ' ' + JSON.stringify(tmp)
                throw e
            }
        }

        for (let i = 0, ic = preparedInputsOutputs.inputs.length; i < ic; i++) {
            try {
                const input = preparedInputsOutputs.inputs[i]
                this._getRawTxSign(txb, i, input.value * 1, input.address)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx sign added')
            } catch (e) {
                e.message = ' transaction BTC sign error: ' + e.message
                throw e
            }
        }

        let hex
        try {
            hex = txb.build().toHex()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxBuilder.getRawTx size ' + hex.length, log)
        } catch (e) {
            e.message = ' transaction BTC build error: ' + e.message
            throw e
        }

        return hex
    }
}
