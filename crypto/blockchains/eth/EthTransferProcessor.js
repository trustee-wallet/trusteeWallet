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
import BlocksoftDispatcher from '../BlocksoftDispatcher'

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
     * @param {number|boolean} additionalData.isPrecount
     * @param {number|boolean} additionalData.estimatedGas
     * @return {Promise<{feeForTx, langMsg, gasPrice, gasLimit}[]>}
     */
    async getFeeRate(data, additionalData) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate started ')

        const gasPrice = await EthNetworkPrices.get(typeof data.addressTo !== 'undefined' ? data.addressTo : 'none')

        let gasLimit
        if (typeof additionalData === 'undefined' || typeof additionalData.estimatedGas === 'undefined' || !additionalData.estimatedGas) {
            try {
                let ok = false
                let i = 0
                do {
                    try {
                        gasLimit = await EthEstimateGas(this._web3Link, gasPrice.price[2], data.addressFrom, data.addressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter
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
            gasLimit = additionalData.estimatedGas
        }

        if (!gasLimit) {
            const e = new Error('invalid transaction (no gas limit)')
            e.code = 'ERROR_USER'
            throw e
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate prefinished', gasPrice, gasLimit)

        let balance = false

        // do nothing
        if (data.addressForChange !== 'TRANSFER_ALL') {
            try {
                balance = await this._web3.eth.getBalance(data.addressFrom)
                if (!balance || balance === 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessor.getFeeRate balanceFromWeb3 is empty ' + balance)
                    balance = false
                } else if (this._settings.currencyCode === 'ETH') {
                    const newBalance = BlocksoftUtils.diff(balance, data.amount)
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessor.getFeeRate balance ' + balance + ' minus amount ' + data.amount + ' = ' + newBalance)
                    if (newBalance > 0) {
                        balance = newBalance
                    }
                }

            } catch (e) {
                balance = false
            }
        }


        const fees = []
        const titles = ['eth_speed_slow', 'eth_speed_medium', 'eth_speed_fast']
        for (let index = 0; index <= 2; index++) {
            const fee = BlocksoftUtils.mul(gasPrice.price[index], gasLimit)
            const tmp = {
                langMsg: titles[index],
                gasPrice: gasPrice.price[index].toString(),
                gasLimit: gasLimit,
                feeForTx: fee.toString()
            }
            if (balance) {
                const diff = BlocksoftUtils.diff(balance, fee)
                if (diff * 1 < 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' TransferProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' skipped as diff ' + diff + ' with balance ' + balance + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
                    continue
                }
            }

            BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)

            fees.push(tmp)
        }

        if (fees.length === 0) {
            const index = 0
            let fee = BlocksoftUtils.div(balance, gasLimit)
            if (fee) {
                const tmp = fee.split('.')
                if (tmp) {
                    fee = tmp[0]
                }
            }
            const tmp = {
                langMsg: 'eth_speed_slowest',
                gasPrice: fee.toString(),
                gasLimit: gasLimit,
                feeForTx: balance,
                needSpeed: gasPrice.price[index].toString(),
                showSmallFeeNotice: true
            }
            BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' corrected for balance ' + balance + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            if (tmp.gasPrice > 0) {
                fees.push(tmp)
            } else {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }

        if (fees.length < 3) {
            fees[fees.length - 1].showSmallFeeNotice = true
        }

        return fees
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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        let balance = '0'
        try {
            balance = await this._web3.eth.getBalance(data.addressFrom)
        } catch (e) {
            this.checkError(e, data)
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        // noinspection EqualityComparisonWithCoercionJS
        if (balance.toString() === '0') {
            return 0
        }
        let res = 0
        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined' && data.feeForTx.feeForTx.toString() !== '0') {
            res = BlocksoftUtils.diff(balance, data.feeForTx.feeForTx)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance with fee 1.0', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
        }

        if (res < 0) {
            const fees = await this.getFeeRate(data)
            data.feeForTx = fees[2]
            res = BlocksoftUtils.diff(balance, data.feeForTx.feeForTx)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance with fee 1.1', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
            if (res < 0) {
                data.feeForTx = fees[1]
                res = BlocksoftUtils.diff(balance, data.feeForTx.feeForTx)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance with fee 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
            }
            if (res < 0) {
                res = BlocksoftUtils.diff(balance, data.feeForTx.feeForTx)
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance with fee 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' = ' + res)
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
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx resend started ' + txHash)
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx started')
        }

        let finalGasPrice = 0
        let finalGasLimit = 0

        if (typeof data.feeForTx !== 'undefined') {
            finalGasPrice = data.feeForTx.gasPrice * 1
            finalGasLimit = Math.ceil(data.feeForTx.gasLimit * 1)
        }

        let balance = '0'
        if (!txHash && (forceCheckBalance || this._checkBalance === true || finalGasPrice === 0 || finalGasLimit === null || finalGasLimit === 0 || finalGasLimit === null)) {
            // check usual
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

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx check balance 1.0 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
                if (res < 0) {
                    if (typeof data.feeForTx.isCustomFee !== 'undefined' && data.feeForTx.isCustomFee) {
                        throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                    }
                } else {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx check selected fee 1.0 ', data.feeForTx)
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
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx check balance 1.1 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
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
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx check balance 1.2 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
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
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx check balance 1.3 ', data.addressFrom + ' => ' + balance + ' - ' + data.feeForTx.feeForTx + ' - ' + data.amount + ' = ' + res)
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


        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx feeForTx', { d: data.feeForTx, finalGasPrice, finalGasLimit })
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
                let nonce = data.jsonData.nonce || false
                if (!nonce) {
                    try {
                        const ethProvider = await (new BlocksoftDispatcher()).getScannerProcessor({ currencyCode: 'ETH' })
                        const scannedTx = await ethProvider.getTransactionBlockchain('0x0530bfddd4dbceb377c9484a3e03c3b306b3855101bdea3a557cc35d4691d2f2')
                        if (scannedTx) {
                            nonce = scannedTx.nonce
                        }
                    } catch (e) {
                        BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthTransferProcessor.sent rbf not loaded nonce for ' + txHash + ' ' + e.message)
                        throw new Error('System error: not loaded nonce for ' + txHash)
                    }
                    if (!nonce) {
                        BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthTransferProcessor.sent rbf no nonce for ' + txHash)
                        throw new Error('System error: no nonce for ' + txHash)
                    }
                }
                tx.nonce = nonce
                result = await sender.innerSendTx(tx, data)
                result.transactionJson = { nonce }
            } else {
                result = await sender.send(tx, data)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent ' + data.addressFrom + ' done with nonce ' + result.nonce)
        } catch (e) {
            delete (data.privateKey)
            if (e.message.indexOf('underpriced') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient funds') !== -1) {
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
