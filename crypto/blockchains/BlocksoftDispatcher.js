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

import BtcTestScannerProcessor from './btc_test/BtcTestScannerProcessor'

import BtgScannerProcessor from './btg/BtgScannerProcessor'

import DogeScannerProcessor from './doge/DogeScannerProcessor'

import EthAddressProcessor from './eth/EthAddressProcessor'
import EthScannerProcessor from './eth/EthScannerProcessor'
import EthScannerProcessorErc20 from './eth/EthScannerProcessorErc20'
import EthScannerProcessorSoul from './eth/forks/EthScannerProcessorSoul'
import EthTokenProcessorErc20 from './eth/EthTokenProcessorErc20'

import LtcScannerProcessor from './ltc/LtcScannerProcessor'

import TrxAddressProcessor from './trx/TrxAddressProcessor'
import TrxScannerProcessor from './trx/TrxScannerProcessor'
import TrxTokenProcessor from './trx/TrxTokenProcessor'

import UsdtScannerProcessor from './usdt/UsdtScannerProcessor'

import XrpAddressProcessor from './xrp/XrpAddressProcessor'
import XrpScannerProcessor from './xrp/XrpScannerProcessor'

import XlmAddressProcessor from './xlm/XlmAddressProcessor'
import XlmScannerProcessor from './xlm/XlmScannerProcessor'

import XvgScannerProcessor from './xvg/XvgScannerProcessor'

import XmrAddressProcessor from './xmr/XmrAddressProcessor'
import XmrScannerProcessor from './xmr/XmrScannerProcessor'
import XmrSecretsProcessor from './xmr/XmrSecretsProcessor'
import FioAddressProcessor from './fio/FioAddressProcessor'
import FioScannerProcessor from './fio/FioScannerProcessor'


import BnbAddressProcessor from './bnb/BnbAddressProcessor'
import BnbScannerProcessor from './bnb/BnbScannerProcessor'
import VetScannerProcessor from '@crypto/blockchains/vet/VetScannerProcessor'

import SolAddressProcessor from '@crypto/blockchains/sol/SolAddressProcessor'
import SolScannerProcessor from '@crypto/blockchains/sol/SolScannerProcessor'

import WavesAddressProcessor from '@crypto/blockchains/waves/WavesAddressProcessor'
import WavesScannerProcessor from '@crypto/blockchains/waves/WavesScannerProcessor'

import SolScannerProcessorSpl from '@crypto/blockchains/sol/SolScannerProcessorSpl'
import SolTokenProcessor from '@crypto/blockchains/sol/SolTokenProcessor'
import EthTokenProcessorNft from '@crypto/blockchains/eth/EthTokenProcessorNft'
import AshAddressProcessor from '@crypto/blockchains/ash/AshAddressProcessor'

import MetisScannerProcessor from '@crypto/blockchains/metis/MetisScannerProcessor'
import OneScannerProcessor from '@crypto/blockchains/one/OneScannerProcessor'
import OneScannerProcessorErc20 from '@crypto/blockchains/one/OneScannerProcessorErc20'

import WavesScannerProcessorErc20 from '@crypto/blockchains/waves/WavesScannerProcessorErc20'

class BlocksoftDispatcher {

    /**
     * @param {string} currencyCode
     * @return {EthAddressProcessor|BtcAddressProcessor}
     */
    getAddressProcessor(currencyCode) {
        const currencyDictSettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        return this.innerGetAddressProcessor(currencyDictSettings)
    }

    /**
     * @param {Object} currencyDictSettings
     * @return {EthAddressProcessor|BtcAddressProcessor|TrxAddressProcessor}
     */
    innerGetAddressProcessor(currencyDictSettings) {
        switch (currencyDictSettings.addressProcessor) {
            case 'BCH':
                return new BchAddressProcessor(currencyDictSettings)
            case 'BTC':
                return new BtcAddressProcessor(currencyDictSettings)
            case 'BTC_SEGWIT': case 'LTC_SEGWIT':
                return new BtcSegwitAddressProcessor(currencyDictSettings)
            case 'BTC_SEGWIT_COMPATIBLE':
                return new BtcSegwitCompatibleAddressProcessor(currencyDictSettings)
            case 'ETH':
                return new EthAddressProcessor(currencyDictSettings)
            case 'TRX':
                return new TrxAddressProcessor()
            case 'XRP':
                return new XrpAddressProcessor()
            case 'XLM':
                return new XlmAddressProcessor()
            case 'XMR':
                return new XmrAddressProcessor()
            case 'FIO':
                return new FioAddressProcessor()
            case 'BNB':
                return new BnbAddressProcessor()
            case 'SOL':
                return new SolAddressProcessor()
            case 'WAVES':
                return new WavesAddressProcessor()
            case 'ASH' :
                return new AshAddressProcessor()
            default:
                throw new Error('Unknown addressProcessor ' + currencyDictSettings.addressProcessor)
        }
    }

    /**
     * @param {string} currencyCode
     * @returns {BsvScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor|EthScannerProcessorErc20|BchScannerProcessor|LtcScannerProcessor|XvgScannerProcessor|BtcTestScannerProcessor|DogeScannerProcessor|EthScannerProcessorSoul|EthScannerProcessor|BtgScannerProcessor|TrxScannerProcessor}
     */
    getScannerProcessor(currencyCode) {
        const currencyDictSettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        switch (currencyDictSettings.scannerProcessor) {
            case 'BCH':
                return new BchScannerProcessor(currencyDictSettings)
            case 'BSV':
                return new BsvScannerProcessor(currencyDictSettings)
            case 'BTC': case 'BTC_SEGWIT': case 'BTC_SEGWIT_COMPATIBLE':
                return new BtcScannerProcessor(currencyDictSettings)
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
            case 'XLM':
                return new XlmScannerProcessor(currencyDictSettings)
            case 'XVG':
                return new XvgScannerProcessor(currencyDictSettings)
            case 'XMR':
                return new XmrScannerProcessor(currencyDictSettings)
            case 'FIO':
                return new FioScannerProcessor(currencyDictSettings)
            case 'BNB':
                return new BnbScannerProcessor(currencyDictSettings)
            case 'VET':
                return new VetScannerProcessor(currencyDictSettings)
            case 'SOL':
                return new SolScannerProcessor(currencyDictSettings)
            case 'SOL_SPL':
                return new SolScannerProcessorSpl(currencyDictSettings)
            case 'WAVES':
                return new WavesScannerProcessor(currencyDictSettings)
            case 'METIS':
                return new MetisScannerProcessor(currencyDictSettings)
            case 'ONE':
                return new OneScannerProcessor(currencyDictSettings)
            case 'ONE_ERC_20':
                return new OneScannerProcessorErc20(currencyDictSettings)
            case 'WAVES_ERC_20':
                return new WavesScannerProcessorErc20(currencyDictSettings)
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
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain: 'ETHEREUM' })
            case 'BNB_SMART_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'BNB' })
            case 'MATIC_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'MATIC' })
            case 'FTM_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'FTM' })
            case 'VLX_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'VLX' })
            case 'ONE_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'ONE' })
            case 'METIS_ERC_20':
                return new EthTokenProcessorErc20({ network: 'mainnet', tokenBlockchain : 'METIS' })
            case 'TRX':
                return new TrxTokenProcessor()
            case 'SOL':
                return new SolTokenProcessor()
            default:
                throw new Error('Unknown tokenProcessor ' + tokenType)
        }
    }

    /**
     * @param tokenBlockchainCode
     * @returns {EthTokenProcessorNft}
     */
    getTokenNftsProcessor(tokenBlockchainCode) {
        switch (tokenBlockchainCode) {
            case 'ETH': case 'NFT_ETH':
                return new EthTokenProcessorNft({ network: 'mainnet', tokenBlockchain: 'ETHEREUM', tokenBlockchainCode : 'ETH' })
            case 'ETH_RINKEBY': case 'NFT_RINKEBY':
                return new EthTokenProcessorNft({ network: 'rinkeby', tokenBlockchain: 'RINKEBY', tokenBlockchainCode : 'ETH_RINKEBY' })
            case 'MATIC': case 'NFT_MATIC':
                return new EthTokenProcessorNft({ network: 'mainnet', tokenBlockchain : 'MATIC', tokenBlockchainCode : 'MATIC' })
            case 'BNB': case 'NFT_BNB':
                return new EthTokenProcessorNft({ network: 'mainnet', tokenBlockchain : 'BNB', tokenBlockchainCode : 'BNB' })
            case 'ONE': case 'NFT_ONE':
                return new EthTokenProcessorNft({ network: 'mainnet', tokenBlockchain : 'ONE', tokenBlockchainCode : 'ONE' })
            case 'ETH_ROPSTEN': case 'NFT_ROPSTEN':
                return new EthTokenProcessorNft({ network: 'ropsten', tokenBlockchain : 'ROPSTEN', tokenBlockchainCode : 'ETH_ROPSTEN' })
            default:
                throw new Error('Unknown NFT tokenProcessor ' + tokenBlockchainCode)
        }
    }

    /**
     * @param {string} currencyCode
     * @return {XmrSecretsProcessor}
     */
    getSecretsProcessor(currencyCode) {
        const currencyDictSettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        if (currencyDictSettings.currencyCode !== 'XMR') {
            throw new Error('Unknown secretsProcessor ' + currencyDictSettings.currencyCode)
        }
        return new XmrSecretsProcessor()
    }
}

const singleBlocksoftDispatcher = new BlocksoftDispatcher()
export default singleBlocksoftDispatcher
