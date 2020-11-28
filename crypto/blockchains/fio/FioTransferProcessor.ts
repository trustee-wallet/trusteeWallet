/**
 * @version 0.20
 */
import { getFioSdk } from './FioSdkWrapper'
import { getFioBalance, transferTokens } from './FioUtils'
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import TrxTronscanProvider from '../trx/basic/TrxTronscanProvider'
import TrxTrongridProvider from '../trx/basic/TrxTrongridProvider'
import BlocksoftUtils from '../../common/BlocksoftUtils'

export default class FioTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: any

    constructor(settings: any) {
        this._settings = settings
    }

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: 0,
            fees : [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx:  fee,
                    amountForTx: data.amount
                }
            ]
        } as BlocksoftBlockchainTypes.FeeRateResult
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: any = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        const balance = await getFioBalance(data.addressFrom)
        if (balance === 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -1,
                fees: [],
                countedForBasicBalance: '0'
            }
        }

        const diff = BlocksoftUtils.diff(balance, fee)
        if (diff*1 < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                countedForBasicBalance: '0'
            }
        }

        const result: BlocksoftBlockchainTypes.TransferAllBalanceResult = {
            selectedFeeIndex: 0,
            fees : [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx:  fee,
                    amountForTx: diff
                }
            ],
            selectedTransferAllBalance: diff,
            shouldChangeBalance: false
        } as BlocksoftBlockchainTypes.TransferAllBalanceResult
        return result
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        const txId = await transferTokens(data.addressTo, data.amount)
        return { transactionHash: txId, transactionJson : {} }
    }
}
