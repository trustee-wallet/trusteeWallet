/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BtcTxBuilder from '../../btc/tx/BtcTxBuilder'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

import { TransactionBuilder, script, opcodes } from 'bitcoinjs-lib'

const USDT_TOKEN_ID = 31

function toPaddedHexString(num, len) {
    const str = num.toString(16)
    return "0".repeat(len - str.length) + str
}

function createOmniSimpleSend(amountInUSD: string, propertyID = USDT_TOKEN_ID) {
    BlocksoftCryptoLog.log('UsdtTxBuilder.createOmniSimpleSend started')
    const simpleSend = [
        '6f6d6e69', // omni
        '0000',     // tx type
        '0000',     // version
        toPaddedHexString(propertyID, 8),
        toPaddedHexString(Math.floor(amountInUSD * 100000000), 16)
    ].join('')

    return script.compile([
        opcodes.OP_RETURN,
        Buffer.from(simpleSend, 'hex')
    ])
}

export default class UsdtTxBuilder extends BtcTxBuilder implements BlocksoftBlockchainTypes.TxBuilder {
    _getRawTxAddOutput(txb: TransactionBuilder, output: BlocksoftBlockchainTypes.OutputTx): void {
        if (typeof output.tokenAmount !== 'undefined' && output.tokenAmount && output.tokenAmount !== '0') {
            const omniOutput = createOmniSimpleSend(output.tokenAmount)
            txb.addOutput(omniOutput, 0)
        } else {
            if (typeof output.amount !== 'undefined' && output.amount.toString() === '0') {
                output.amount = '546'
            }
            super._getRawTxAddOutput(txb, output)
        }
    }
}
