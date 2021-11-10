/**
 * @author Ksu
 * @version 0.43
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import EthTransferProcessor from '@crypto/blockchains/eth/EthTransferProcessor'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


export default class EtcTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        if (typeof additionalData.gasPrice  === 'undefined' || !additionalData.gasPrice) {
            additionalData.gasPrice = BlocksoftExternalSettings.getStatic(this._mainCurrencyCode + '_PRICE')
            additionalData.gasPriceTitle = 'speed_blocks_2'
        }
        return super.getFeeRate(data, privateData, additionalData)
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean {
        return false
    }
}
