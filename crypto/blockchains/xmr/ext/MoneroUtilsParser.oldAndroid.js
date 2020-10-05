/**
 * @author Ksu
 * @version 0.11
 * for old androids
 */

export default {

    checkDestination(value) {
        return false
    },

    async getCore() {
        return false
    },

    async getCoreWasm() {
        return false
    },

    async parseAddressInfo(address, data, privViewKey, pubSpendKey, privSpendKey) {
        return false
    },

    async parseAddressTransactions(address, data, privViewKey, pubSpendKey, privSpendKey) {
        return false
    }
}
