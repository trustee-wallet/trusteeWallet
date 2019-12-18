
class DogeTxProcessor extends require('./BtcTxProcessor').BtcTxProcessor {

    async _getNetworkPrices(blocks) {
        if (blocks > 10) {
            return 2
        } else if (blocks > 5) {
            return 4
        } else {
            return 100
        }
    }
}


module.exports.init = function(settings) {
    return new DogeTxProcessor(settings)
}

