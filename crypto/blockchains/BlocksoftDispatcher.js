/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDict from '../common/BlocksoftDict'

import BchAddressProcessor from './bch/BchAddressProcessor'
import BchScannerProcessor from './bch/BchScannerProcessor'

import BsvScannerProcessor from './bsv/BsvScannerProcessor'

import BtcAddressProcessor from './btc/address/BtcAddressProcessor'
import BtcScannerProcessor from './btc/BtcScannerProcessor'

import BtcSegwitCompatibleAddressProcessor from './btc/address/BtcSegwitCompatibleAddressProcessor'
import BtcSegwitAddressProcessor from './btc/address/BtcSegwitAddressProcessor'

import BtcLightAddressProcessor from './btc_light/BtcLightAddressProcessor'
import BtcLightScannerProcessor from './btc_light/BtcLightScannerProcessor'
import BtcLightInvoiceProcessor from './btc_light/BtcLightInvoiceProcessor'

import BtcTestScannerProcessor from './btc_test/BtcTestScannerProcessor'

import BtgScannerProcessor from './btg/BtgScannerProcessor'

import DogeScannerProcessor from './doge/DogeScannerProcessor'

import EthAddressProcessor from './eth/EthAddressProcessor'
import EthScannerProcessor from './eth/EthScannerProcessor'
import EthScannerProcessorErc20 from './eth/EthScannerProcessorErc20'
import EthScannerProcessorUAX from './eth/EthScannerProcessorUAX'
import EthScannerProcessorSoul from './eth/forks/EthScannerProcessorSoul'
import EthTokenProcessorErc20 from './eth/EthTokenProcessorErc20'

import LtcScannerProcessor from './ltc/LtcScannerProcessor'

import TrxAddressProcessor from './trx/TrxAddressProcessor'
import TrxScannerProcessor from './trx/TrxScannerProcessor'
import TrxTokenProcessor from './trx/TrxTokenProcessor'

import UsdtScannerProcessor from './usdt/UsdtScannerProcessor'

import XrpAddressProcessor from './xrp/XrpAddressProcessor'
import XrpScannerProcessor from './xrp/XrpScannerProcessor'

import XvgScannerProcessor from './xvg/XvgScannerProcessor'

import XmrAddressProcessor from './xmr/XmrAddressProcessor'
import XmrScannerProcessor from './xmr/XmrScannerProcessor'
import XmrSecretsProcessor from './xmr/XmrSecretsProcessor'

export default class BlocksoftDispatcher {

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
        const currencyDictSettings = this._getSettings(currencyCode)
        return this.innerGetAddressProcessor(currencyDictSettings)
    }

    /**
     * @param {Object} currencyDictSettings
     * @return {EthAddressProcessor|BtcAddressProcessor|BtcLightAddressProcessor|TrxAddressProcessor}
     */
    innerGetAddressProcessor(currencyDictSettings) {
        switch (currencyDictSettings.addressProcessor) {
            case 'BCH':
                return new BchAddressProcessor(currencyDictSettings)
            case 'BTC':
                return new BtcAddressProcessor(currencyDictSettings)
            case 'BTC_SEGWIT':
                return new BtcSegwitAddressProcessor(currencyDictSettings)
            case 'BTC_SEGWIT_COMPATIBLE':
                return new BtcSegwitCompatibleAddressProcessor(currencyDictSettings)
            case 'BTC_LIGHT' :
                return new BtcLightAddressProcessor()
            case 'ETH':
                return new EthAddressProcessor(currencyDictSettings)
            case 'TRX':
                return new TrxAddressProcessor()
            case 'XRP':
                return new XrpAddressProcessor()
            case 'XMR':
                return new XmrAddressProcessor()
            default:
                throw new Error('Unknown addressProcessor ' + currencyDictSettings.addressProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @returns {BsvScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor|EthScannerProcessorErc20|BchScannerProcessor|LtcScannerProcessor|XvgScannerProcessor|BtcTestScannerProcessor|DogeScannerProcessor|EthScannerProcessorSoul|EthScannerProcessor|BtgScannerProcessor|TrxScannerProcessor|BtcLightScannerProcessor}
     */
    getScannerProcessor(currencyCode) {
        const currencyDictSettings = this._getSettings(currencyCode)
        switch (currencyDictSettings.scannerProcessor) {
            case 'BCH':
                return new BchScannerProcessor(currencyDictSettings)
            case 'BSV':
                return new BsvScannerProcessor(currencyDictSettings)
            case 'BTC': case 'BTC_SEGWIT': case 'BTC_SEGWIT_COMPATIBLE':
                return new BtcScannerProcessor(currencyDictSettings)
            case 'BTC_LIGHT' :
                return new BtcLightScannerProcessor(currencyDictSettings)
            case 'BTC_TEST':
                return new BtcTestScannerProcessor(currencyDictSettings)
            case 'BTG':
                return new BtgScannerProcessor(currencyDictSettings)
            case 'DOGE':
                return new DogeScannerProcessor(currencyDictSettings)
            case 'ETH':
                return new EthScannerProcessor(currencyDictSettings)
            case 'ETH_ERC_20':
                return new EthScannerProcessorErc20(currencyDictSettings)
            case 'ETH_UAX':
                return new EthScannerProcessorUAX(currencyDictSettings)
            case 'ETH_SOUL':
                return new EthScannerProcessorSoul(currencyDictSettings)
            case 'LTC':
                return new LtcScannerProcessor(currencyDictSettings)
            case 'TRX':
                return new TrxScannerProcessor(currencyDictSettings)
            case 'USDT':
                return new UsdtScannerProcessor(currencyDictSettings)
            case 'XRP':
                return new XrpScannerProcessor(currencyDictSettings)
            case 'XVG':
                return new XvgScannerProcessor(currencyDictSettings)
            case 'XMR':
                return new XmrScannerProcessor(currencyDictSettings)
            default:
                throw new Error('Unknown scannerProcessor ' + currencyDictSettings.scannerProcessor)
        }
    }

    /**
     * @param tokenType
     * @returns {TrxTokenProcessor|EthTokenProcessorErc20}
     */
    getTokenProcessor(tokenType) {
        switch (tokenType) {
            case 'ETH_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet' })
            case 'TRX':
                return new TrxTokenProcessor()
            default:
                throw new Error('Unknown tokenProcessor ' + tokenType)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {BtcLightInvoiceProcessor}
     */
    getInvoiceProcessor(currencyCode) {
        const currencyDictSettings = this._getSettings(currencyCode)
        if (currencyDictSettings.currencyCode !== 'BTC_LIGHT') {
            throw new Error('Unknown invoiceProcessor ' + currencyDictSettings.currencyCode)
        }
        return new BtcLightInvoiceProcessor()
    }

    /**
     * @param {string} currencyCode
     * @return {XmrSecretsProcessor}
     */
    getSecretsProcessor(currencyCode) {
        const currencyDictSettings = this._getSettings(currencyCode)
        if (currencyDictSettings.currencyCode !== 'XMR') {
            throw new Error('Unknown invoiceProcessor ' + currencyDictSettings.currencyCode)
        }
        return new XmrSecretsProcessor()
    }
}
