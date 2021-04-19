/**
 * @author Ksu
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessor from '../eth/EthTransferProcessor'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


export default class EtcTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        additionalData.gasPrice = BlocksoftExternalSettings.getStatic('ETC_PRICE')
        additionalData.gasPriceTitle = 'speed_blocks_2'
        return super.getFeeRate(data, privateData, additionalData)
    }
}
