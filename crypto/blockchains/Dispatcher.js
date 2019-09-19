import BlocksoftDict from '../common/BlocksoftDict'

class Dispatcher {

    _settings = {}
    
    _getSettings(currencyCode) {
        if (typeof this._settings[currencyCode] === 'undefined') {
            this._settings[currencyCode] = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        }
        return this._settings[currencyCode]
    }

    /**
     * @param {string} currencyCode
     * @return {EthAddressProcessor|BtcAddressProcessor}
     */
    getAddressProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.addressProcessor) {
            case 'ETH':
                return require('./eth/EthAddressProcessor').init(currencyDictSettings)
            case 'BTC':
                return require('./btc/BtcAddressProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown addressProcessor ' + currencyDictSettings.addressProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
     */
    getScannerProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.scannerProcessor) {
            case 'ETH':
                return require('./eth/EthScannerProcessor').init(currencyDictSettings)
            case 'ETH_ERC_20':
                return require('./eth/EthScannerProcessorErc20').init(currencyDictSettings)
            case 'BTC': case 'LTC':
                return require('./btc/BtcScannerProcessor').init(currencyDictSettings)
            case 'USDT':
                return require('./btc/UsdtScannerProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown scannerProcessor ' + currencyDictSettings.scannerProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {EthTxProcessor|BtcTxProcessor|UsdtTxProcessor}
     */
    getTxProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.txProcessor) {
            case 'ETH':
                return require('./eth/EthTxProcessor').init(currencyDictSettings)
            case 'ETH_ERC_20':
                return require('./eth/EthTxProcessorErc20').init(currencyDictSettings)
            case 'BTC':
                return require('./btc/BtcTxProcessor').init(currencyDictSettings)
            case 'LTC':
                return require('./btc/LtcTxProcessor').init(currencyDictSettings)
            case 'USDT':
                return require('./btc/UsdtTxProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown txProcessor ' + currencyDictSettings.txProcessor)
        }
    }
}

module.exports.init = function() {
    return new Dispatcher()
}
