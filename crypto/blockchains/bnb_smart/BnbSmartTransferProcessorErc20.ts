/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessorErc20 from '../eth/EthTransferProcessorErc20'
import BnbSmartNetworkPrices from './basic/BnbSmartNetworkPrices'

export default class BnbSmartTransferProcessorErc20 extends EthTransferProcessorErc20 implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        additionalData.gasPrice = await BnbSmartNetworkPrices.getFees()
        additionalData.gasPriceTitle = 'speed_blocks_2'
        return super.getFeeRate(data, privateData, additionalData)
    }
}
