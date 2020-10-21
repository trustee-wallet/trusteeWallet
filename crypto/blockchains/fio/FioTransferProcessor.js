/**
 * @version 0.11
 */
import { getFioSdk } from './FioSdkWrapper'
import { getFioBalance, transferTokens } from './FioUtils'

export default class FioTransferProcessor {

    constructor(settings) {
        this._settings = settings
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        return false
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.addressForChange
     * @param {string|int} data.amount
     * @param {number|boolean} additionalData.isPrecount
     * @param {number|boolean} additionalData.estimatedGas
     * @returns {Promise<boolean>}
     */
    async getFeeRate(data, additionalData) {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        return [
            {
                langMsg: 'xrp_speed_one',
                feeForTx: fee
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
     * @param {string} data.memo
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        const balance = await getFioBalance(data.addressFrom)

        return balance > 0 && balance > fee ? balance - fee : 0
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.data
     * @param {string} data.memo
     * @param {string} data.privateKey
     * @param {*} data.feeForTx
     * @param {BigInteger} data.feeForTx.estMinNetworkFee
     * @param {string} data.feeForTx.feeForTx
     * @param {string} data.feeForTx.langMsg
     * @param {string} data.feeForTx.simplePriority
     * @param {string} data.feeForTx.rawTxHex
     * @param {string} data.feeForTx.rawTxHash
     * @param {*} data.jsonData
     * @param {string} data.jsonData.publicSpendKey
     * @param {string} data.jsonData.publicViewKey
     */
    async sendTx(data) {
        const txId = await transferTokens(data.addressTo, data.amount)

        return { hash: txId }
    }
}
