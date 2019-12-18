
class XvgTxProcessor extends require('./BtcTxProcessor').BtcTxProcessor {

    _initProviders(settings) {
        this.unspentsProvider = require('./providers/XvgTxUnspentsProvider').init(settings)
        this.sendProvider = require('./providers/BtcTxSendProvider').init(settings)
    }

    // https://api.vergecurrency.network/node/api/XVG/mainnet/fee/22 0.4 all
    async _getNetworkPrices(blocks) {
        if (blocks > 10) {
            return 300
        } else if (blocks > 5) {
            return 600
        } else {
            return 700
        }
    }
}


module.exports.init = function(settings) {
    return new XvgTxProcessor(settings)
}

