/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessorErc20 from '../eth/EthTransferProcessorErc20'
import BnbSmartNetworkPrices from './basic/BnbSmartNetworkPrices'

export default class BnbSmartTransferProcessorErc20 extends EthTransferProcessorErc20 implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        additionalData.gasPrice = await BnbSmartNetworkPrices.getFees(this._mainCurrencyCode, this._etherscanApiPath)
        additionalData.gasPriceTitle = 'speed_blocks_2'
        const result = await super.getFeeRate(data, privateData, additionalData)
        result.shouldShowFees = true
        return result
    }

    async checkTransferHasError(data: BlocksoftBlockchainTypes.CheckTransferHasErrorData): Promise<BlocksoftBlockchainTypes.CheckTransferHasErrorResult> {
        // @ts-ignore
        const balance = data.addressFrom && data.addressFrom !== '' ? await this._web3.eth.getBalance(data.addressFrom) : 0
        if (balance > 0) {
            return { isOk: true }
        } else {
            const title = this._mainCurrencyCode === 'BNB' ? 'BNB Smart Chain' : this._mainCurrencyCode
            // @ts-ignore
            return { isOk: false, code: 'TOKEN', parentBlockchain: title, parentCurrency: title }
        }
    }

}
