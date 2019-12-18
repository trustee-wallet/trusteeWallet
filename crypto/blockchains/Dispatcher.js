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
        return this.innerGetAddressProcessor(currencyDictSettings)
    }

    /**
     * @param {Object} currencyDictSettings
     * @return {EthAddressProcessor|BtcAddressProcessor}
     */
    innerGetAddressProcessor(currencyDictSettings) {
        switch (currencyDictSettings.addressProcessor) {
            case 'ETH':
                return require('./eth/EthAddressProcessor').init(currencyDictSettings)
            case 'TRX':
                return require('./trx/TrxAddressProcessor').init(currencyDictSettings)
            case 'BTC':
                return require('./btc/BtcAddressProcessor').init(currencyDictSettings)
            case 'BTC_LIGHT':
                return require('./btc_light/BtcLightAddressProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown addressProcessor ' + currencyDictSettings.addressProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor|DogeScannerProcessor|TrxScannerProcessor}
     */
    getScannerProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.scannerProcessor) {
            case 'ETH':
                return require('./eth/EthScannerProcessor').init(currencyDictSettings)
            case 'ETH_ERC_20':
                return require('./eth/EthScannerProcessorErc20').init(currencyDictSettings)
            case 'ETH_SOUL':
                return require('./eth/EthScannerProcessorSoul').init(currencyDictSettings)
            case 'TRX':
                return require('./trx/TrxScannerProcessor').init(currencyDictSettings)
            case 'BTC': case 'LTC':
                return require('./btc/BtcScannerProcessor').init(currencyDictSettings)
            case 'BTC_LIGHT':
                return require('./btc_light/BtcLightScannerProcessor').init(currencyDictSettings)
            case 'DOGE':
                return require('./btc/DogeScannerProcessor').init(currencyDictSettings)
            case 'XVG':
                return require('./btc/XvgScannerProcessor').init(currencyDictSettings)
            case 'USDT':
                return require('./btc/UsdtScannerProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown scannerProcessor ' + currencyDictSettings.scannerProcessor)
        }
    }

    getTokenProcessor(tokenType) {
        switch (tokenType) {
            case 'ETH_ERC_20':
                return require('./eth/EthTokenProcessorErc20').init({network : 'mainnet'})
            case 'TRX':
                return require('./trx/TrxTokenProcessor').init()
            default:
                throw new Error('Unknown tokenProcessor ' + tokenType)
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
            case 'TRX':
                return require('./trx/TrxTxProcessor').init(currencyDictSettings)
            case 'BTC':
                return require('./btc/BtcTxProcessor').init(currencyDictSettings)
            case 'LTC':
                return require('./btc/LtcTxProcessor').init(currencyDictSettings)
            case 'BTC_LIGHT':
                return require('./btc_light/BtcLightTxProcessor').init(currencyDictSettings)
            case 'DOGE':
                return require('./btc/DogeTxProcessor').init(currencyDictSettings)
            case 'XVG':
                return require('./btc/XvgTxProcessor').init(currencyDictSettings)
            case 'USDT':
                return require('./btc/UsdtTxProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown txProcessor ' + currencyDictSettings.txProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {BtcLightInvoiceProcessor}
     */
    getInvoiceProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.txProcessor) {
            case 'BTC_LIGHT':
                return require('./btc_light/BtcLightInvoiceProcessor').init(currencyDictSettings)
            default:
                throw new Error('Unknown txProcessor ' + currencyDictSettings.txProcessor)
        }
    }
}

module.exports.init = function() {
    return new Dispatcher()
}
