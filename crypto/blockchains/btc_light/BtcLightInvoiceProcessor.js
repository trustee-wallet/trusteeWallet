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
        let result = await BtcLightProvider.createInvoice(data.amount, data.memo)
        return { hash: result.payment_request }
    }

    /**
     * @param {string} data.currencyCode
     * @param {string} data.address
     * @param {string} data.amount
     * @param {string} data.memo
     * @param {string} data.jsonData
     */
    async checkInvoice(hash, data) {
        await BtcLightProvider.setLoginByAddressORJsonData(data.address, data.jsonData)
        let invoice = await BtcLightProvider.checkInvoice(hash)

        if (typeof invoice.error != 'undefined') {
            if (invoice.error) {
                throw new Error(invoice.message)
            }
        }
        let now = new Date().getTime()
        let block_time = invoice.timestamp * 1000
        let timed = (now - block_time) / 1000
        let could_pay = false
        if (timed < invoice.expiry) {
            could_pay = true
        }
        return {
            amount: invoice.num_satoshis,
            created: block_time,
            memo: invoice.description,
            timed,
            could_pay
        }
    }
}
