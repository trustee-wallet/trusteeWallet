/**
 * @author Ksu
 * @version 0.20
 * https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import EthTransferProcessor from '../eth/EthTransferProcessor'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../common/BlocksoftAxios'

export default class BnbSmartTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    _useThisBalance: boolean = true

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return true
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        additionalData.gasPrice = BlocksoftExternalSettings.getStatic('BNB_SMART_PRICE')
        const res = await BlocksoftAxios.getWithoutBraking('https://api.bscscan.com/api?module=proxy&action=eth_gasPrice&apikey=YourApiKeyToken')
        if (res && typeof res.data !== 'undefined' && typeof res.data.result !== 'undefined') {
            const tmp = BlocksoftUtils.hexToDecimal(res.data.result)
            if (tmp * 1 > 0) {
                additionalData.gasPrice = tmp * 1
            }
        }
        return super.getFeeRate(data, privateData, additionalData)
    }
}
