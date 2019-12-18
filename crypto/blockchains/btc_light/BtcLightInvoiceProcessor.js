class BtcLightInvoiceProcessor {
    constructor(settings) {
        this.provider = require('./providers/BtcLightProvider').init(settings)
    }

    /**
     * @param {string} data.currencyCode
     * @param {string} data.address
     * @param {string} data.amount
     * @param {string} data.memo
     * @param {string} data.jsonData
     */
    async createInvoice(data) {
        await this.provider.setLoginByAddressORJsonData(data.address, data.jsonData)
        let result = await this.provider.createInvoice(data.amount, data.memo)
        return {hash : result.payment_request}
    }

    /**
     * @param {string} data.currencyCode
     * @param {string} data.address
     * @param {string} data.amount
     * @param {string} data.memo
     * @param {string} data.jsonData
     */
    async checkInvoice(hash, data) {
        await this.provider.setLoginByAddressORJsonData(data.address, data.jsonData)
        let invoice = await this.provider.checkInvoice(hash)

        if (typeof invoice.error != 'undefined') {
            if (invoice.error) {
                let e = new Error(invoice.message)
                throw e
            }
        }
        let now = new Date().getTime()
        let block_time = invoice.timestamp * 1000
        let timed = (now - block_time)/1000
        let could_pay = false
        if (timed < invoice.expiry) {
            could_pay = true
        }
        return {
            amount : invoice.num_satoshis,
            created : block_time,
            memo : invoice.description,
            timed,
            could_pay
        }
    }
}

module.exports.init = function(settings) {
    return new BtcLightInvoiceProcessor(settings)
}
