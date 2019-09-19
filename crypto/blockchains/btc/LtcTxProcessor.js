
class LtcTxProcessor extends require('./BtcTxProcessor').BtcTxProcessor {

    async _getNetworkPrices(blocks) {
        if (blocks > 10) {
            return 1
        } else if (blocks > 5) {
            return 2
        } else {
            return 100
        }
    }
}


module.exports.init = function(settings) {
    return new LtcTxProcessor(settings)
}

