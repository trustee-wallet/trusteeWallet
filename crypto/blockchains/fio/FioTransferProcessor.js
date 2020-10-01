/**
 * @version 0.11
 */

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
        return false
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
        return 0
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
        return { hash: "rawTxHash" }
    }
}
