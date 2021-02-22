/**
 * @version 0.20
 * https://docs.binance.org/smart-chain/developer/create-wallet.html
 * https://docs.binance.org/guides/concepts/encoding/amino-example.html#transfer
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import { BnbTxSendProvider } from './basic/BnbTxSendProvider'
import BlocksoftUtils from '../../common/BlocksoftUtils'

export default class BnbTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: { network: string; currencyCode: string }
    private _provider: BnbTxSendProvider

    constructor(settings: { network: string; currencyCode: string }) {
        this._settings = settings
        this._provider = new BnbTxSendProvider()
    }

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: 0,
            fees : [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx: '0.000375',
                    amountForTx: data.amount
                }
            ]
        } as BlocksoftBlockchainTypes.FeeRateResult
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {

        const balance = data.amount
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        const result = await this.getFeeRate(data, privateData, additionalData)
        // @ts-ignore
        if (!result || result.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                countedForBasicBalance: balance
            }
        }
        // @ts-ignore
        const newAmount = BlocksoftUtils.diff(result.fees[result.selectedFeeIndex].amountForTx, result.fees[result.selectedFeeIndex].feeForTx).toString()
        if (newAmount*1 < 0) {
            throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
        }
        result.fees[result.selectedFeeIndex].amountForTx = newAmount
        const tmp = {
            ...result,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx,
            shouldChangeBalance: true
        }
        // console.log('tmp', JSON.stringify(tmp))
        return tmp
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('BNB transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('BNB transaction required addressTo')
        }

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx start')

        const transaction = await this._provider.getPrepared(data, privateData, uiData)

        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx tx', transaction)


        const raw = this._provider.serializeTx(transaction)
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx raw', raw)

        // [{"code": 0, "hash": "1C27B1BBCC3DE3BFDA9639BDB17DB5AD199CA689ACD2872F9DEEF3AF56942622", "log": "", "ok": true}]
        const result = await this._provider.sendRaw(raw)
        if (typeof result.message !== 'undefined') {
            if (result.message.indexOf('insufficient fund') !== -1) {
                throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            } else {
                throw new Error(result.message)
            }
        }
        if (typeof result[0] === 'undefined' || typeof result[0].hash === 'undefined' || typeof result[0].ok === 'undefined' || !result[0].ok || !result[0].hash) {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx result', result)
            MarketingEvent.logOnlyRealTime('v20_bnb_no_result ' + data.addressFrom + ' => ' + data.addressTo, {
                result,
                raw
            })
            throw new Error('SERVER_RESPONSE_NO_RESPONSE')
        }

        MarketingEvent.logOnlyRealTime('v20_bnb_success_result ' + data.addressFrom + ' => ' + data.addressTo + ' ' + result[0].hash, {
            result
        })
        return { transactionHash: result[0].hash }

    }
}
