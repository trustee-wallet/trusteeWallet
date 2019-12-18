import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import EthEstimateGas from './ext/EthEstimateGas'
import BlocksoftAxios from '../../common/BlocksoftAxios'

const Web3 = require('web3')

const MAGIC_TX_DIVIDER = BlocksoftUtils.toBigNumber(10)
const CACHE_VALID_TIME = 120000 // 2 minute
let CACHE_FEES = false
let CACHE_FEES_TIME = 0

class EthTxProcessor {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthTxProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthTxProcessor requires settings.network')
        }
        BlocksoftCryptoLog.log('EthTxProcessor init started', settings.currencyCode)
        this._estimateFeeApiPath = 'https://ethgasstation.info/json/ethgasAPI.json'
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            case 'kovan' :
            case 'rinkeby' :
            case 'goerli' :
                this._link = `https://${settings.network}.infura.io/v3/478e48mushyfgsdfryumlrynh`
                // noinspection JSUnresolvedVariable
                this._web3 = new Web3(new Web3.providers.HttpProvider(this._link))
                break
            default:
                throw new Error('while retrieving Ethereum tx - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", rinkeby". Got : ' + settings.network)
        }
        BlocksoftCryptoLog.log('EthTxProcessor inited')
    }

    async getNetworkPrices() {
        const now = new Date().getTime()
        const link = this._estimateFeeApiPath
        if (CACHE_FEES && now - CACHE_FEES_TIME < CACHE_VALID_TIME) {
            BlocksoftCryptoLog.log('EthTxProcessor._getNetworkPrices used cache')
            return CACHE_FEES
        }
        BlocksoftCryptoLog.log('EthTxProcessor._getNetworkPrices no cache')
        let tmp = false
        try {
            tmp = await BlocksoftAxios.get(link, true)
            CACHE_FEES = tmp.data
            CACHE_FEES_TIME = now
        } catch (e) {
            // use old if any
            BlocksoftCryptoLog.log('EthTxProcessor._getNetworkPrices error will be escaped', e)
        }
        let result = CACHE_FEES
        if (!CACHE_FEES) {
            result = { 'fast': 100.0, 'fastest': 150.0, 'safeLow': 13.0, 'average': 30.0, 'block_time': 13.35135135135135, 'blockNum': 8072518, 'speed': 0.6445718283457775, 'safeLowWait': 14.5, 'avgWait': 1.9, 'fastWait': 0.4, 'fastestWait': 0.4 }
        }

        return result
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @return {Promise<{feeForTx, langMsg, gasPrice, gasLimit}[]>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        /**
         * @param {*} gasPrice.fast
         * @param {*} gasPrice.safeLow
         * @param {*} gasPrice.average
         * @param {*} gasPrice.fast
         */
        let gasPrice = await this.getNetworkPrices()
        if (!gasPrice) {
            throw new Error('something wrong in fees ' + this._estimateFeeApiPath + ' ' + JSON.stringify(gasPrice))
        }
        if (!gasPrice.fast) {
            throw new Error('something wrong in fees ' + this._estimateFeeApiPath + ' no fast data in ' + JSON.stringify(gasPrice))
        }

        BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate started')


        let gasLimit = 0
        if (typeof alreadyEstimatedGas === 'undefined' || !alreadyEstimatedGas) {
            gasLimit = await EthEstimateGas(this._link, BlocksoftUtils.toWei(gasPrice.fast), data.addressFrom, data.addressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter
        } else {
            gasLimit = alreadyEstimatedGas
        }

        if (!gasLimit) {
            let e = new Error('invalid transaction (no gas limit)')
            e.code = 'ERROR_USER'
            throw e
        }

        let price_0 = gasPrice.safeLow
        let price_1 = gasPrice.average
        let price_2 = gasPrice.fast

        if (price_0 === price_1) {
            if (price_1 === price_2) {
                price_1 = Math.round(price_0 * 1.1)
                price_2 = Math.round(price_1 * 1.1)
            } else {
                price_1 = Math.round(price_0 * 1.1)
            }
        } else if (price_1 === price_2) {
            price_2 = Math.round(price_1 * 1.1)
        }
        if (price_1 > price_2) {
            let tmp = price_1
            price_1 = price_2
            price_2 = tmp
        }

        price_0 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_0, 'gwei')).div(MAGIC_TX_DIVIDER) // in gwei to wei + magic
        price_1 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_1, 'gwei')).div(MAGIC_TX_DIVIDER)
        price_2 = BlocksoftUtils.toBigNumber(BlocksoftUtils.toWei(price_2, 'gwei')).div(MAGIC_TX_DIVIDER)

        let gasLimitBN = BlocksoftUtils.toBigNumber(gasLimit)

        BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate prefinished')

        return [
            {
                langMsg: 'eth_speed_slow',
                gasPrice:  price_0.toString(), // in gwei
                gasLimit: gasLimit, // in wei
                feeForTx:  price_0.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_medium',
                gasPrice: price_1.toString(),
                gasLimit: gasLimit,
                feeForTx:  price_1.mul(gasLimitBN).toString()
            },
            {
                langMsg: 'eth_speed_fast',
                gasPrice: price_2.toString(),
                gasLimit: gasLimit,
                feeForTx: price_2.mul(gasLimitBN).toString()
            }
        ]
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
     */
    async sendTx(data) {
        if (typeof data.feeForTx === 'undefined') {
            throw new Error('ETH transaction requires feeForTx')
        }
        if (typeof data.feeForTx.gasPrice === 'undefined') {
            throw new Error('ETH transaction requires feeForTx.gasPrice')
        }
        if (data.feeForTx.gasPrice < 1) {
            throw new Error('ETH transaction requires feeForTx.gasPrice')
        }
        if (typeof data.feeForTx.gasLimit === 'undefined') {
            throw new Error('ETH transaction requires feeForTx.gasLimit')
        }
        if (data.feeForTx.gasLimit < 1) {
            throw new Error('ETH transaction requires feeForTx.gasLimit')
        }
        if (data.feeForTx.feeForTx < 1) {
            throw new Error('ETH transaction requires feeForTx.feeForTx')
        }
        if (typeof data.privateKey === 'undefined') {
            throw new Error('ETH transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('ETH transaction required addressTo')
        }

        BlocksoftCryptoLog.log('EthTxProcessor.sendTx started')

        let result

        let tx = {
            from: data.addressFrom,
            to: data.addressTo,
            gasPrice: data.feeForTx.gasPrice * 1,
            gas: data.feeForTx.gasLimit * 1,
            value: data.amount
        }
        if (typeof data.data !== 'undefined') {
            tx.data = data.data //actual value for erc20 etc
        }

        try {
            result = await this._innerSendTx(tx, data)
        } catch (e) {
            if (e.message.indexOf('replacement transaction underpriced') !== -1 || e.message.indexOf('known transaction') !== -1) {
                BlocksoftCryptoLog.log('EthTxProcessor._innerSendTx will CHANGE_NONCE', e.message)
                result = 'CHANGE_NONCE'
            } else {
                delete (data.privateKey)
                throw e
            }
        }
        if (result === 'CHANGE_NONCE') {
            try {
                tx.nonce = await this._getTxCount(data.addressFrom) + 1
                result = await this._innerSendTx(tx, data)
            } catch (e) {
                if (e.message.indexOf('replacement transaction underpriced') !== -1 || e.message.indexOf('known transaction') !== -1) {
                    BlocksoftCryptoLog.log('EthTxProcessor._innerSendTx will CHANGE_NONCE', e.message)
                    result = 'CHANGE_NONCE2'
                } else {
                    delete (data.privateKey)
                    throw e
                }
            }
        }

        if (result === 'CHANGE_NONCE2') {
            try {
                tx.nonce = tx.nonce + 10
                result = await this._innerSendTx(tx, data)
            } catch (e) {
                delete (data.privateKey)
                throw e
            }
        }

        return result
    }

    async _getTxCount(address) {
        let _this = this
        return new Promise((resolve) => {
            // noinspection JSUnresolvedVariable
            _this._web3.eth.getTransactionCount(address).then(resolve)
        })
    }


    async _innerSendTx(tx, data) {
        BlocksoftCryptoLog.log('EthTxProcessor._innerSendTx tx', tx)
        // noinspection JSUnresolvedVariable
        if (data.privateKey.substr(0,2) !== '0x') {
            data.privateKey = '0x' + data.privateKey
        }
        let signData = await this._web3.eth.accounts.signTransaction(tx, data.privateKey)
        BlocksoftCryptoLog.log('EthTxProcessor._innerSendTx signed', tx)

        return new Promise((resolve, reject) => {
            BlocksoftCryptoLog.log('EthTxProcessor.sendTx promise started')
            // noinspection JSUnresolvedVariable
            return this._web3.eth.sendSignedTransaction(signData.rawTransaction)
                .on('transactionHash', (hash) => {
                    resolve({ hash })
                })
                .on('error', (e) => {
                    e.data = tx
                    reject(e)
                })
        })
    }


}

module.exports.EthTxProcessor = EthTxProcessor

module.exports.init = function(settings) {
    return new EthTxProcessor(settings)
}
