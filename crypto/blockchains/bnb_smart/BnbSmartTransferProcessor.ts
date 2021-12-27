/**
 * @author Ksu
 * @version 0.20
 * https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessor from '../eth/EthTransferProcessor'

import BnbSmartNetworkPrices from './basic/BnbSmartNetworkPrices'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

export default class BnbSmartTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        if (typeof additionalData.gasPrice  === 'undefined' || !additionalData.gasPrice) {
            let defaultFee = BlocksoftExternalSettings.getStatic(this._mainCurrencyCode + '_PRICE')
            if (typeof defaultFee === 'undefined' || !defaultFee) {
                defaultFee = 5000000000
            }
            if (!this._etherscanApiPathForFee) {
                additionalData.gasPrice = defaultFee
                additionalData.gasPriceTitle = 'speed_blocks_2'
            } else {
                additionalData.gasPrice = await BnbSmartNetworkPrices.getFees(this._mainCurrencyCode, this._etherscanApiPathForFee, defaultFee, 'BnbSmartTransferProcessor.getFeeRate')
                additionalData.gasPriceTitle = 'speed_blocks_2'
            }
        }
        return super.getFeeRate(data, privateData, additionalData)
    }
}
