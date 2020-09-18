/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import EthEstimateGas from './ext/EthEstimateGas'
import EthBasic from './basic/EthBasic'
import EthNetworkPrices from './basic/EthNetworkPrices'
import EthTxSendProvider from './basic/EthTxSendProvider'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'
import BlocksoftBN from '../../common/BlocksoftBN'

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
        return EthNetworkPrices.get()
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

        const gasPrice = await EthNetworkPrices.get()

        let gasLimit
        if (typeof alreadyEstimatedGas === 'undefined' || !alreadyEstimatedGas) {
            try {
                let ok = false
                let i = 0
                do {
                    try {
                        gasLimit = await EthEstimateGas(this._web3Link, gasPrice.price2, data.addressFrom, data.addressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter
                        MarketingEvent.logOnlyRealTime('eth_gas_limit ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, {
                            amount: data.amount + '',
                            gasLimit
                        })
                        ok = true
                    } catch (e1) {
                        ok = false
                        i++
                        if (i > 3) {
                            throw e1
                        }
                    }
                } while (!ok)
            } catch (e) {
                if (e.message.indexOf('resolve host') !== -1) {
                    throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
                } else {
                    e.message += ' in EthEstimateGas in getFeeRate'
                    throw e
                }
            }
        } else {
            gasLimit = alreadyEstimatedGas
        }
        if (!gasLimit) {
            const e = new Error('invalid transaction (no gas limit)')
            e.code = 'ERROR_USER'
            throw e
        }

        const gasLimitBN = BlocksoftUtils.toBigNumber(gasLimit)
        BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate prefinished', gasPrice, gasLimitBN)

        BlocksoftCryptoLog.log('gasPrice ' + gasPrice.price2.toString())
        BlocksoftCryptoLog.log('gatLimit ' + gasLimitBN.toString())
        BlocksoftCryptoLog.log('feeForTx ' + gasPrice.price2.mul(gasLimitBN).toString())
        return [
            {
                langMsg: 'eth_speed_slow',
                gasPrice: gasPrice.price0.toString(),
                gasLimit: gasLimit, // in wei
                feeForTx: gasPrice.price0.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_medium',
                gasPrice: gasPrice.price1.toString(),
                gasLimit: gasLimit,
                feeForTx: gasPrice.price1.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_fast',
                gasPrice: gasPrice.price2.toString(),
                gasLimit: gasLimit,
                feeForTx: gasPrice.price2.mul(gasLimitBN).toString()
            }
        ]
    }


    /**
     * @param {Object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        let balance = '0'
        try {
            balance = await this._web3.eth.getBalance(data.addressFrom)
        } catch (e) {
            this.checkError(e, data)
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        // noinspection EqualityComparisonWithCoercionJS
        if (balance.toString() === '0') {
            return 0
        }
        let res
        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined' && data.feeForTx.feeForTx.toString() !== '0') {
            res = BlocksoftUtils.toBigNumber(balance).sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
            BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance with fee 1.0', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
        }

        if (res < 0) {
            const fees = await this.getFeeRate(data)
            data.feeForTx = fees[2]
            const diffB = new BlocksoftBN(balance)
            res = diffB.diff(data.feeForTx.feeForTx).get()
            BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance with fee 1.1', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
            if (res < 0) {
                data.feeForTx = fees[1]
                const diffB = new BlocksoftBN(balance)
                res = diffB.diff(data.feeForTx.feeForTx).get()
                BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance with fee 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
            }
            if (res < 0) {
                const diffB = new BlocksoftBN(balance)
                res = diffB.diff(data.feeForTx.feeForTx).get()
                BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance with fee 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
            }
        }

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
     * @param {string} data.txHash
     * @param {string} data.jsonData.nonce
     * @return {Promise<{hash}>}
     */
    async sendTx(data, forceCheckBalance) {
        const txHash = data.txHash || false
        if (typeof data.privateKey === 'undefined') {
            throw new Error('ETH transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('ETH transaction required addressTo')
        }

        if (txHash) {
            BlocksoftCryptoLog.log('EthTxProcessor.sendTx resend started ' + txHash)
        } else {
            BlocksoftCryptoLog.log('EthTxProcessor.sendTx started')
        }

        let finalGasPrice = 0
        let finalGasLimit = 0

        if (typeof data.feeForTx !== 'undefined') {
            finalGasPrice = data.feeForTx.gasPrice * 1
            finalGasLimit = Math.ceil(data.feeForTx.gasLimit * 1)
        }

        if (!txHash && (forceCheckBalance || this._checkBalance === true || finalGasPrice === 0 || finalGasLimit === null || finalGasLimit === 0 || finalGasLimit === null)) {
            // check usual
            let balance = '0'
            try {
                balance = await this._web3.eth.getBalance(data.addressFrom)
            } catch (e) {
                this.checkError(e, data)
            }
            // noinspection EqualityComparisonWithCoercionJS
            if (balance.toString() === '0') {
                throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            }
            // noinspection EqualityComparisonWithCoercionJS
            let res = -1
            if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined' && data.feeForTx.feeForTx.toString() !== '0') {
                const diffB = new BlocksoftBN(balance)
                res = diffB.diff(data.amount).diff(data.feeForTx.feeForTx).get()

                BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check balance 1.0 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
                if (res < 0) {
                    if (typeof data.feeForTx.isCustomFee !== 'undefined' && data.feeForTx.isCustomFee) {
                        throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                    }
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check selected fee 1.0 ', data.feeForTx)
                }
            }

            if (res < 0) {
                const fees = await this.getFeeRate(data)
                if (fees[2]) {
                    data.feeForTx = fees[2]
                    finalGasPrice = data.feeForTx.gasPrice * 1
                    finalGasLimit = data.feeForTx.gasLimit * 1
                    if (finalGasPrice > 0 && finalGasLimit > 0) {
                        const diffB = new BlocksoftBN(balance)
                        res = diffB.diff(data.amount).diff(data.feeForTx.feeForTx).get()
                        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check balance 1.1 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
                    } else {
                        res = -1
                    }
                }
                if (res < 0 && fees[1]) {
                    data.feeForTx = fees[1]
                    finalGasPrice = data.feeForTx.gasPrice * 1
                    finalGasLimit = data.feeForTx.gasLimit * 1
                    if (finalGasPrice > 0 && finalGasLimit > 0) {
                        const diffB = new BlocksoftBN(balance)
                        res = diffB.diff(data.amount).diff(data.feeForTx.feeForTx).get()
                        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check balance 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
                    } else {
                        res = -1
                    }
                }
                if (res < 0 && fees[0]) {
                    data.feeForTx = fees[0]
                    finalGasPrice = data.feeForTx.gasPrice * 1
                    finalGasLimit = data.feeForTx.gasLimit * 1
                    if (finalGasPrice > 0 && finalGasLimit > 0) {
                        const diffB = new BlocksoftBN(balance)
                        res = diffB.diff(data.amount).diff(data.feeForTx.feeForTx).get()
                        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sendTx check balance 1.3 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
                    } else {
                        res = -1
                    }
                }
            }
            if (res < 0) {
                if (data.amount > 0) {
                    throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                } else {
                    throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
                }
            }
        }


        BlocksoftCryptoLog.log('feeForTx', { d: data.feeForTx, finalGasPrice, finalGasLimit })
        if (finalGasLimit === 0 || !finalGasLimit || finalGasLimit === null) {
            throw new Error('SERVER_PLEASE_SELECT_FEE')
        }
        if (finalGasPrice === 0 || !finalGasPrice || finalGasPrice === null) {
            throw new Error('SERVER_PLEASE_SELECT_FEE')
        }

        const tx = {
            from: data.addressFrom,
            to: data.addressTo.toLowerCase(),
            gasPrice: finalGasPrice,
            gas: finalGasLimit,
            value: data.amount
        }

        if (typeof data.data !== 'undefined') {
            tx.data = data.data // actual value for erc20 etc
        }

        const sender = new EthTxSendProvider(this._web3)
        const logData = tx
        let result = false
        try {
            if (txHash) {
                const nonce = data.jsonData.nonce || false
                if (!nonce) {
                    throw new Error('System error: no nonce for ' + txHash)
                }
                tx.nonce = nonce
                result = await sender.innerSendTx(tx, data)
                result.transactionJson = { nonce }
            } else {
                result = await sender.send(tx, data)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.sent ' + data.addressFrom + ' done with nonce ' + result.nonce)
        } catch (e) {
            delete (data.privateKey)
            if (e.message.indexOf('insufficient funds') !== -1) {
                if (data.amount > 0) {
                    throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                } else {
                    throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
                }
            } else {
                logData.error = e.message
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('eth_tx_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)
                throw e
            }
        }
        logData.result = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('eth_tx_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)
        return result
    }
}
