/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BtcTxBuilder from '../../btc/tx/BtcTxBuilder'

const bitcoin = require('bitcoinjs-lib')

const USDT_TOKEN_ID = 31

function toPaddedHexString(num, len) {
    // noinspection JSCheckFunctionSignatures
    const str = num.toString(16)
    return "0".repeat(len - str.length) + str
}

function createOmniSimpleSend(amountInUSD, propertyID = USDT_TOKEN_ID) {
    BlocksoftCryptoLog.log('UsdtTxBuilder.createOmniSimpleSend started')
    const simpleSend = [
        '6f6d6e69', // omni
        '0000',     // tx type
        '0000',     // version
        toPaddedHexString(propertyID, 8),
        toPaddedHexString(Math.floor(amountInUSD * 100000000), 16)
    ].join('')

    return bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        Buffer.from(simpleSend, 'hex')
    ])
}

export default class UsdtTxBuilder extends BtcTxBuilder {

    _getRawTxAddOutput(txb, to, amount, output) {
        if (typeof output.usdt !== 'undefined') {
            const omniOutput = createOmniSimpleSend(output.usdt)
            txb.addOutput(omniOutput, 0)
        } else {
            txb.addOutput(to, amount)
        }
    }

    async getRawTx(data, preparedInputsOutputs) {
        const newOutputs = []
        for (let output of preparedInputsOutputs.outputs) {
            if (typeof output.usdtLast !== 'undefined') {
                continue
            }
            newOutputs.push(output)
        }
        for (let output of preparedInputsOutputs.outputs) {
            if (typeof output.usdtLast !== 'undefined') {
                newOutputs.push(output)
            }
        }
        const newInputsOutputs = {... preparedInputsOutputs, ...{outputs : newOutputs}}
        return super.getRawTx(data, newInputsOutputs)
    }
}
