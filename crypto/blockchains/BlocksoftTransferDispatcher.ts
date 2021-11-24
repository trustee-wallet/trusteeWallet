/**
 * @author Ksu
 * @version 0.20
 */
import BlocksoftDict from '../common/BlocksoftDict'
import { BlocksoftDictTypes } from '../common/BlocksoftDictTypes'

import BchTransferProcessor from './bch/BchTransferProcessor'
import BsvTransferProcessor from './bsv/BsvTransferProcessor'
import BtcTransferProcessor from './btc/BtcTransferProcessor'
import BtcTestTransferProcessor from './btc_test/BtcTestTransferProcessor'
import BtgTransferProcessor from './btg/BtgTransferProcessor'
import DogeTransferProcessor from './doge/DogeTransferProcessor'
import EthTransferProcessor from './eth/EthTransferProcessor'
import EthTransferProcessorErc20 from './eth/EthTransferProcessorErc20'
import LtcTransferProcessor from './ltc/LtcTransferProcessor'
import TrxTransferProcessor from './trx/TrxTransferProcessor'
import UsdtTransferProcessor from './usdt/UsdtTransferProcessor'
import XrpTransferProcessor from './xrp/XrpTransferProcessor'
import XlmTransferProcessor from './xlm/XlmTransferProcessor'
import XvgTransferProcessor from './xvg/XvgTransferProcessor'
import XmrTransferProcessor from './xmr/XmrTransferProcessor'
import FioTransferProcessor from './fio/FioTransferProcessor'
import BnbTransferProcessor from './bnb/BnbTransferProcessor'
import BnbSmartTransferProcessor from './bnb_smart/BnbSmartTransferProcessor'
import BnbSmartTransferProcessorErc20 from './bnb_smart/BnbSmartTransferProcessorErc20'
import EtcTransferProcessor from './etc/EtcTransferProcessor'
import VetTransferProcessor from '@crypto/blockchains/vet/VetTransferProcessor'
import SolTransferProcessor from '@crypto/blockchains/sol/SolTransferProcessor'
import SolTransferProcessorSpl from '@crypto/blockchains/sol/SolTransferProcessorSpl'
import WavesTransferProcessor from '@crypto/blockchains/waves/WavesTransferProcessor'
import MetisTransferProcessor from '@crypto/blockchains/metis/MetisTransferProcessor'

import { BlocksoftBlockchainTypes } from './BlocksoftBlockchainTypes'


export namespace BlocksoftTransferDispatcher {

    type BlocksoftTransferDispatcherDict = {
        [key in BlocksoftDictTypes.Code]: BlocksoftBlockchainTypes.TransferProcessor
    }

    const CACHE_PROCESSORS: BlocksoftTransferDispatcherDict = {} as BlocksoftTransferDispatcherDict

    export const getTransferProcessor = function(currencyCode: BlocksoftDictTypes.Code): BlocksoftBlockchainTypes.TransferProcessor {
        const currencyDictSettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        if (typeof CACHE_PROCESSORS[currencyCode] !== 'undefined') {
            return CACHE_PROCESSORS[currencyCode]
        }
        let transferProcessor = currencyCode
        if (typeof currencyDictSettings.transferProcessor !== 'undefined') {
            transferProcessor = currencyDictSettings.transferProcessor
        }
        switch (transferProcessor) {
            case 'BCH':
                CACHE_PROCESSORS[currencyCode] = new BchTransferProcessor(currencyDictSettings)
                break
            case 'BSV':
                CACHE_PROCESSORS[currencyCode] = new BsvTransferProcessor(currencyDictSettings)
                break
            case 'BTC':
                CACHE_PROCESSORS[currencyCode] = new BtcTransferProcessor(currencyDictSettings)
                break
            case 'BTC_TEST':
                CACHE_PROCESSORS[currencyCode] = new BtcTestTransferProcessor(currencyDictSettings)
                break
            case 'BTG':
                CACHE_PROCESSORS[currencyCode] = new BtgTransferProcessor(currencyDictSettings)
                break
            case 'DOGE':
                CACHE_PROCESSORS[currencyCode] = new DogeTransferProcessor(currencyDictSettings)
                break
            case 'ETH':
                CACHE_PROCESSORS[currencyCode] = new EthTransferProcessor(currencyDictSettings)
                break
            case 'ETH_ERC_20':
                CACHE_PROCESSORS[currencyCode] = new EthTransferProcessorErc20(currencyDictSettings)
                break
            case 'ETC':
                CACHE_PROCESSORS[currencyCode] = new EtcTransferProcessor(currencyDictSettings)
                break
            case 'BNB_SMART_20':
                CACHE_PROCESSORS[currencyCode] = new BnbSmartTransferProcessorErc20(currencyDictSettings)
                break
            case 'LTC':
                CACHE_PROCESSORS[currencyCode] = new LtcTransferProcessor(currencyDictSettings)
                break
            case 'TRX':
                CACHE_PROCESSORS[currencyCode] = new TrxTransferProcessor(currencyDictSettings)
                break
            case 'USDT':
                CACHE_PROCESSORS[currencyCode] = new UsdtTransferProcessor(currencyDictSettings)
                break
            case 'XRP':
                CACHE_PROCESSORS[currencyCode] = new XrpTransferProcessor(currencyDictSettings)
                break
            case 'XLM':
                CACHE_PROCESSORS[currencyCode] = new XlmTransferProcessor(currencyDictSettings)
                break
            case 'XVG':
                CACHE_PROCESSORS[currencyCode] = new XvgTransferProcessor(currencyDictSettings)
                break
            case 'XMR':
                CACHE_PROCESSORS[currencyCode] = new XmrTransferProcessor(currencyDictSettings)
                break
            case 'FIO':
                CACHE_PROCESSORS[currencyCode] = new FioTransferProcessor(currencyDictSettings)
                break
            case 'BNB':
                CACHE_PROCESSORS[currencyCode] = new BnbTransferProcessor(currencyDictSettings)
                break
            case 'BNB_SMART':
                CACHE_PROCESSORS[currencyCode] = new BnbSmartTransferProcessor(currencyDictSettings)
                break
            case 'VET':
                CACHE_PROCESSORS[currencyCode] = new VetTransferProcessor(currencyDictSettings)
                break
            case 'SOL':
                CACHE_PROCESSORS[currencyCode] = new SolTransferProcessor(currencyDictSettings)
                break
            case 'SOL_SPL':
                CACHE_PROCESSORS[currencyCode] = new SolTransferProcessorSpl(currencyDictSettings)
                break
            case 'METIS':
                CACHE_PROCESSORS[currencyCode] = new MetisTransferProcessor(currencyDictSettings)
                break
            case 'WAVES':
                CACHE_PROCESSORS[currencyCode] = new WavesTransferProcessor(currencyDictSettings)
                break
            default:
                throw new Error('Unknown transferProcessor ' + transferProcessor)
        }
        return CACHE_PROCESSORS[currencyCode]
    }
}
