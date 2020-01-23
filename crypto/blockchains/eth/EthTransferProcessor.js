/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import EthEstimateGas from './ext/EthEstimateGas'
import EthBasic from './basic/EthBasic'
import EthPricesCache from './basic/EthPrices'
import EthTxSendProvider from './basic/EthTxSendProvider'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

export default class EthTransferProcessor extends EthBasic {
    /**
     * @type {boolean}
     * @private
     */
    _checkBalance = true

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        return EthPricesCache.get()
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string|int} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @return {Promise<{feeForTx, langMsg, gasPrice, gasLimit}[]>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate started')

        let gasPrice = await EthPricesCache.get()

        let gasLimit
        if (typeof alreadyEstimatedGas === 'undefined' || !alreadyEstimatedGas) {
            gasLimit = await EthEstimateGas(this._web3Link, BlocksoftUtils.toWei(gasPrice.fast), data.addressFrom, data.addressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter
        } else {
            gasLimit = alreadyEstimatedGas
        }
        if (!gasLimit) {
            let e = new Error('invalid transaction (no gas limit)')
            e.code = 'ERROR_USER'
            throw e
        }

        let gasLimitBN = BlocksoftUtils.toBigNumber(gasLimit)
        BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate prefinished')

        BlocksoftCryptoLog.log('gasPrice ' + gasPrice.price_2.toString())
        BlocksoftCryptoLog.log('gatLimit ' + gasLimitBN.toString())
        BlocksoftCryptoLog.log('feeForTx ' + gasPrice.price_2.mul(gasLimitBN).toString())
        return [
            {
                langMsg: 'eth_speed_slow',
                gasPrice: gasPrice.price_0.toString(),
                gasLimit: gasLimit, // in wei
                feeForTx: gasPrice.price_0.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_medium',
                gasPrice: gasPrice.price_1.toString(),
                gasLimit: gasLimit,
                feeForTx: gasPrice.price_1.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_fast',
                gasPrice: gasPrice.price_2.toString(),
                gasLimit: gasLimit,
                feeForTx: gasPrice.price_2.mul(gasLimitBN).toString()
            }
        ]
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        let balance = await this._web3.eth.getBalance(data.addressFrom)
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        if (balance == 0) {
            return 0
        }
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForTx === 'undefined' || data.feeForTx.feeForTx == 0) {
            let fees = await this.getFeeRate(data)
            data.feeForTx = fees[2]
        }
        let res = BlocksoftUtils.toBigNumber(balance).sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance with fee ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
        return res
    }
    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.feeForTx.gasPrice
     * @param {string} data.feeForTx.gasLimit
     * @param {string} data.feeForTx.feeForTx
     * @param {string} data.amount
     * @param {string} data.data
     * @return {Promise<{hash}>}
     */
    async sendTx(data) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('ETH transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('ETH transaction required addressTo')
        }

        BlocksoftCryptoLog.log('EthTxProcessor.sendTx started')

        if (this._checkBalance === true){
            // check usual
            let balance = await this._web3.eth.getBalance(data.addressFrom)
            if (balance == 0) {
                let e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                e.code = 'ERROR_USER'
                throw e
            }
            if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForTx === 'undefined' || data.feeForTx.feeForTx == 0) {
                let fees = await this.getFeeRate(data)
                data.feeForTx = fees[2]
            }
            let res = BlocksoftUtils.toBigNumber(balance).sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).sub(BlocksoftUtils.toBigNumber(data.amount)).toString()
            BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check balance ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
            if (res < 0) {
                let e = new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                e.code = 'ERROR_USER'
                throw e
            }
        }

        let tx = {
            from: data.addressFrom,
            to: data.addressTo,
            gasPrice: data.feeForTx.gasPrice * 1,
            gas: data.feeForTx.gasLimit * 1,
            value: data.amount
        }
        BlocksoftCryptoLog.log(tx)
        if (typeof data.data !== 'undefined') {
            tx.data = data.data //actual value for erc20 etc
        }

        let sender = new EthTxSendProvider(this._web3)
        let logData = tx
        let result
        try {
            result = await sender.send(tx, data)
        } catch (e) {
            delete (data.privateKey)
            logData.error = e.message
            MarketingEvent.logOnlyRealTime('eth_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logData)
            throw e
        }
        logData.result = result
        MarketingEvent.logOnlyRealTime('eth_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logData)

        return result
    }
}
