/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDict from '../common/BlocksoftDict'
import BchTransferProcessor from './bch/BchTransferProcessor'
import BsvTransferProcessor from './bsv/BsvTransferProcessor'
import BtcTransferProcessor from './btc/BtcTransferProcessor'
import BtcLightTransferProcessor from './btc_light/BtcLightTransferProcessor'
import BtcTestTransferProcessor from './btc_test/BtcTestTransferProcessor'
import BtgTransferProcessor from './btg/BtgTransferProcessor'
import DogeTransferProcessor from './doge/DogeTransferProcessor'
import EthTransferProcessor from './eth/EthTransferProcessor'
import EthTransferProcessorErc20 from './eth/EthTransferProcessorErc20'
import LtcTransferProcessor from './ltc/LtcTransferProcessor'
import TrxTransferProcessor from './trx/TrxTransferProcessor'
import UsdtTransferProcessor from './usdt/UsdtTransferProcessor'
import XrpTransferProcessor from './xrp/XrpTransferProcessor'
import XvgTransferProcessor from './xvg/XvgTransferProcessor'


export default class BlocksoftTransferDispatcher {

    _settings = {}

    _getSettings(currencyCode) {
        if (typeof this._settings[currencyCode] === 'undefined') {
            this._settings[currencyCode] = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        }
        return this._settings[currencyCode]
    }


    /**
     * @param {string} currencyCode
     * @returns {BchTransferProcessor|BtcLightTransferProcessor|BtcTransferProcessor|UsdtTransferProcessor|XvgTransferProcessor|BtcTestTransferProcessor|EthTransferProcessorErc20|BtcSegwitTransferProcessor|BsvTransferProcessor|EthTransferProcessor|BtgTransferProcessor|TrxTransferProcessor|LtcTransferProcessor|DogeTransferProcessor|BtcSegwitCompatibleTransferProcessor}
     */
    getTransferProcessor(currencyCode) {
        let currencyDictSettings = this._getSettings(currencyCode)
        let transferProcessor = currencyCode
        if (typeof currencyDictSettings.transferProcessor !== 'undefined') {
            transferProcessor = currencyDictSettings.transferProcessor
        }
        switch (transferProcessor) {
            case 'BCH':
                return new BchTransferProcessor(currencyDictSettings)
            case 'BSV':
                return new BsvTransferProcessor(currencyDictSettings)
            case 'BTC': case 'BTC_SEGWIT': case 'BTC_SEGWIT_COMPATIBLE':
                return new BtcTransferProcessor(currencyDictSettings)
            case 'BTC_LIGHT':
                return new BtcLightTransferProcessor(currencyDictSettings)
            case 'BTC_TEST':
                return new BtcTestTransferProcessor(currencyDictSettings)
            case 'BTG':
                return new BtgTransferProcessor(currencyDictSettings)
            case 'DOGE':
                return new DogeTransferProcessor(currencyDictSettings)
            case 'ETH':
                return new EthTransferProcessor(currencyDictSettings)
            case 'ETH_ERC_20':
                return new EthTransferProcessorErc20(currencyDictSettings)
            case 'LTC':
                return new LtcTransferProcessor(currencyDictSettings)
            case 'TRX':
                return new TrxTransferProcessor(currencyDictSettings)
            case 'USDT':
                return new UsdtTransferProcessor(currencyDictSettings)
            case 'XRP':
                return new XrpTransferProcessor(currencyDictSettings)
            case 'XVG':
                return new XvgTransferProcessor(currencyDictSettings)
            default:
                throw new Error('Unknown transferProcessor ' + transferProcessor)
        }
    }
}
