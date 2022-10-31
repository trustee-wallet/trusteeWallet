/**
 * @author Ksu
 * @version 0.43
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import EthTransferProcessor from '@crypto/blockchains/eth/EthTransferProcessor'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'


export default class MetisTransferProcessor extends EthTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        if (typeof additionalData.gasPrice === 'undefined' || !additionalData.gasPrice) {
            additionalData.gasPrice = BlocksoftExternalSettings.getStatic(this._mainCurrencyCode + '_PRICE')
            additionalData.gasPriceTitle = 'speed_blocks_2'
        }

        let value = 0
        try {
            if (data.amount.indexOf('0x') === 0) {
                value = data.amount
            } else {
                value = '0x' + BlocksoftUtils.decimalToHex(data.amount)
            }
        } catch (e) {
            throw new Error(e.message + ' with data.amount ' + data.amount)
        }
        const params = {
            'jsonrpc': '2.0',
            'method': 'eth_estimateGas',
            'params': [
                {
                    'from': data.addressFrom,
                    'to': data.addressTo,
                    'value': value,
                    'data': '0x'
                }
            ],
            'id': 1
        }
        const tmp = await BlocksoftAxios.post( BlocksoftExternalSettings.getStatic('METIS_SERVER'), params)

        if (typeof tmp !== 'undefined' && typeof tmp.data !== 'undefined') {
            if (typeof tmp.data.result !== 'undefined') {
                additionalData.gasLimit = BlocksoftUtils.hexToDecimalWalletConnect(tmp.data.result)
            } else  if (typeof tmp.data.error !== 'undefined') {
                throw new Error(tmp.data.error.message)
            }
        }
        return super.getFeeRate(data, privateData, additionalData)
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean {
        return false
    }
}
