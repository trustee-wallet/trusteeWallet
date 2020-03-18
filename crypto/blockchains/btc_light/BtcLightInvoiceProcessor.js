/**
 * @version 0.5
 */
import BtcLightProvider from './providers/BtcLightProvider'

export default class BtcLightInvoiceProcessor {

    /**
     * @param {string} data.currencyCode
     * @param {string} data.address
     * @param {string} data.amount
     * @param {string} data.memo
     * @param {string} data.jsonData
     */
    async createInvoice(data) {
        await BtcLightProvider.setLoginByAddressORJsonData(data.address, data.jsonData)
        const result = await BtcLightProvider.createInvoice(data.amount, data.memo)
        return { hash: result.payment_request }
    }

    /**
     * @param {string} hash
     * @param {Object} data
     * @param {string} data.currencyCode
     * @param {string} data.address
     * @param {string} data.amount
     * @param {string} data.memo
     * @param {string} data.jsonData
     * @returns {Promise<{amount: *, timed: number, created: *, couldPay: boolean, memo: *}>}
     */
    async checkInvoice(hash, data) {
        await BtcLightProvider.setLoginByAddressORJsonData(data.address, data.jsonData)
        const invoice = await BtcLightProvider.checkInvoice(hash)

        if (typeof invoice.error !== 'undefined') {
            if (invoice.error) {
                throw new Error(invoice.message)
            }
        }
        const now = new Date().getTime()
        const blockTime = invoice.timestamp * 1000
        const timed = (now - blockTime) / 1000
        let couldPay = false
        if (timed < invoice.expiry) {
            couldPay = true
        }
        return {
            amount: invoice.num_satoshis,
            created: blockTime,
            memo: invoice.description,
            timed,
            couldPay
        }
    }
}
