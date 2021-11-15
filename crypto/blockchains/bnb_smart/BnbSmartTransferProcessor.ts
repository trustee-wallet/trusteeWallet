/**
 * @author Ksu
 * @version 0.20
 * https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessor from '../eth/EthTransferProcessor'

import BnbSmartNetworkPrices from './basic/BnbSmartNetworkPrices'

export default class BnbSmartTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        if (typeof additionalData.gasPrice  === 'undefined' || !additionalData.gasPrice) {
            additionalData.gasPrice = await BnbSmartNetworkPrices.getFees(this._mainCurrencyCode, this._etherscanApiPath)
            additionalData.gasPriceTitle = 'speed_blocks_2'
        }
        return super.getFeeRate(data, privateData, additionalData)
    }
}
