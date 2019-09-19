import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

let bitcoin = require('bitcoinjs-lib')

const USDT_TOKEN_ID = 31

function _toPaddedHexString(num, len) {
    // noinspection JSCheckFunctionSignatures
    const str = num.toString(16)
    return "0".repeat(len - str.length) + str
}


class UsdtTxProcessor extends require('./BtcTxProcessor').BtcTxProcessor {

    _customChangesToTx(params) {
        let usdtAmount = params.amount
        let amount = params.dustAmount // is dust
        let omniOutput = this._createOmniSimpleSend(usdtAmount)
        params.txb.addOutput(omniOutput, 0)
        BlocksoftCryptoLog.log('UsdtTxProcessor._createOmniSimpleSend added')
        // end changes
        return {amount}
    }

    _createOmniSimpleSend(amountInUSD, propertyID = USDT_TOKEN_ID) {
        BlocksoftCryptoLog.log('UsdtTxProcessor._createOmniSimpleSend started')
        let simpleSend = [
            '6f6d6e69', // omni
            '0000',     // tx type
            '0000',     // version
            _toPaddedHexString(propertyID, 8),
            _toPaddedHexString(Math.floor(amountInUSD * 100000000), 16)
        ].join('')

        return bitcoin.script.compile([
            bitcoin.opcodes.OP_RETURN,
            Buffer.from(simpleSend, 'hex')
        ])
    }
}

module.exports.init = function(settings) {
    return new UsdtTxProcessor(settings)
}
