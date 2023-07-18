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
import BnbNetworkPrices from './basic/BnbNetworkPrices'

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

        const fees = await BnbNetworkPrices.getFees()
        const feeForTx = BlocksoftUtils.toUnified(fees.send.fee, 8)
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: 0,
            shouldShowFees : false,
            fees : [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx,
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
            shouldShowFees : false,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx
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

        let transaction
        try {
            transaction = await this._provider.getPrepared(data, privateData, uiData)
        } catch (e) {
            throw new Error(e.message + ' in BNB getPrepared')
        }
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx tx', transaction)


        let raw
        try {
            raw = this._provider.serializeTx(transaction)
        } catch (e) {
            throw new Error(e.message + ' in BNB serializeTx')
        }
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx raw', raw)
        if (typeof uiData !== 'undefined' && typeof uiData.selectedFee !== 'undefined' && typeof uiData.selectedFee.rawOnly !== 'undefined' && uiData.selectedFee.rawOnly) {
            return { rawOnly: uiData.selectedFee.rawOnly, raw }
        }

        let result
        try {
            result = await this._provider.sendRaw(raw)
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                throw new Error(e.message + ' in BNB sendRaw1')
            } else {
                throw e
            }
        }
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx result', result)

        try {
            if (typeof result.message !== 'undefined') {
                if (result.message.indexOf('insufficient fund') !== -1 || result.message.indexOf('BNB <') !== -1) {
                    throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                } else {
                    throw new Error(result.message)
                }
            }
            if (typeof result[0] === 'undefined' || typeof result[0].hash === 'undefined' || typeof result[0].ok === 'undefined' || !result[0].ok || !result[0].hash) {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BnbTransferProcessor.sendTx result', result)
                MarketingEvent.logOnlyRealTime('v30_bnb_no_result', {
                    title : data.addressFrom + ' => ' + data.addressTo,
                    result,
                    raw
                })
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            }

            MarketingEvent.logOnlyRealTime('v30_bnb_success_result', {
                title: data.addressFrom + ' => ' + data.addressTo,
                result
            })
            return { transactionHash: result[0].hash }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
                throw new Error(e.message + ' in BNB sendRaw1 parse result')
            } else {
                throw e
            }
        }
    }
}
