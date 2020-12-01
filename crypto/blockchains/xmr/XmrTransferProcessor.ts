/**
 * @version 0.20
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import MoneroUtilsParser from './ext/MoneroUtilsParser'
import XmrSendProvider from './providers/XmrSendProvider'
import XmrUnspentsProvider from './providers/XmrUnspentsProvider'

import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import config from '../../../app/config/config'

export default class XmrTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private sendProvider: XmrSendProvider
    private unspentsProvider: XmrUnspentsProvider
    private _settings: any

    constructor(settings: any) {
        this._settings = settings
        this.sendProvider = new XmrSendProvider(settings)
        this.unspentsProvider = new XmrUnspentsProvider(settings)
    }

    needPrivateForFee(): boolean {
        return true
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return true
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -1
        } as BlocksoftBlockchainTypes.FeeRateResult

        // @ts-ignore
        if (data.amount * 1 <= 0) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' skipped as zero amount')
            return result
        }

        if (typeof data.accountJson === 'undefined' || !data.accountJson || typeof data.accountJson.publicSpendKey === 'undefined') {
            throw new Error('XmrTransferProcessor public spend key is required')
        }
        const keys = privateData.privateKey.split('_')
        const privSpendKey = keys[0]
        const privViewKey = keys[1]
        const pubSpendKey = data.accountJson.publicSpendKey

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' started amount: ' + data.amount)

        const apiClient = this.unspentsProvider

        let core = await MoneroUtilsParser.getCore()
        if (!core || typeof core === 'undefined') {
            core = await MoneroUtilsParser.getCore()
        }

        result.fees = []

        const logFees = []
        let noBalanceError = false
        for (let i = 1; i <= 4; i++) {
            try {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' start amount: ' + data.amount + ' fee ' + i)

                // @ts-ignore
                const fee = await core.async__send_funds({
                    is_sweeping: false,
                    payment_id_string: typeof data.memo !== 'undefined' && data.memo ? data.memo : undefined, // may be nil or undefined
                    sending_amount: data.amount, // sending amount
                    sending_all: data.isTransferAll,
                    from_address_string: data.addressFrom,
                    sec_viewKey_string: privViewKey,
                    sec_spendKey_string: privSpendKey,
                    pub_spendKey_string: pubSpendKey,
                    to_address_string: data.addressTo,
                    priority: i,
                    unlock_time: 0, // unlock_time
                    nettype: 0, // MAINNET
                    // @ts-ignore
                    get_unspent_outs_fn: async (req) => apiClient._getUnspents(req),
                    // @ts-ignore
                    get_random_outs_fn: async (req) => apiClient._getRandomOutputs(req)
                })

                if (typeof fee !== 'undefined' && fee && typeof fee.used_fee) {
                    const tmp = {
                        langMsg: 'xmr_speed_' + i,
                        feeForTx: fee.used_fee,
                        blockchainData: {
                            rawTxHex: fee.serialized_signed_tx,
                            rawTxHash: fee.tx_hash,
                            usingOuts: fee.using_outs,
                            simplePriority: i
                        }
                    } as BlocksoftBlockchainTypes.Fee

                    const logTmp = {
                        langMsg: 'xmr_speed_' + i,
                        feeForTx: fee.used_fee,
                        blockchainData: {
                            rawTxHash: fee.tx_hash,
                            usingOuts: fee.using_outs,
                            simplePriority: i
                        },
                        amountForTx: '?'
                    }
                    if (typeof fee.using_amount !== 'undefined') {
                        tmp.amountForTx = fee.using_amount
                        logTmp.amountForTx = fee.using_amount
                    } else {
                        tmp.amountForTx = data.amount
                        logTmp.amountForTx = data.amount
                    }
                    result.fees.push(tmp)
                    logFees.push(logTmp)
                }
            } catch (e) {
                if (e.message.indexOf('pendable balance too low') !== -1) {
                    // do nothing
                    noBalanceError = true
                    break
                } else {
                    if (config.debug.cryptoErrors) {
                        console.log('XmrTransferProcessor error ', e)
                    }
                    if (e.message.indexOf('An error occurred while getting decoy outputs') !== -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor error will go out bad decoy')
                        throw new Error('SERVER_RESPONSE_BAD_CODE')
                    } else if (e.message.indexOf('decode address') !== -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor error will go out')
                        throw new Error('SERVER_RESPONSE_BAD_DESTINATION')
                    } else {
                        BlocksoftCryptoLog.err(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' error fee ' + i + ': ' + e.message)
                        throw e
                    }
                }
            }
        }

        if (result.fees.length === 0 && noBalanceError) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' fee: ', logFees)

        if (result.fees.length < 3) {
            result.selectedFeeIndex = result.fees.length - 1
        } else {
            result.selectedFeeIndex = 2
        }
        return result
    }


    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: { estimatedGas?: number, gasPrice?: number[], balance?: string } = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        data.isTransferAll = true
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
        return {
            ...result,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx,
            shouldChangeBalance: true,
            countedForBasicBalance: balance
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('XMR transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('XMR transaction required addressTo')
        }

        if (typeof uiData.selectedFee === 'undefined') {
            throw new Error('XMR transaction required selectedFee')
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.sendTx started ' + data.addressFrom + '=>' + data.addressTo, uiData.selectedFee)

        const keys = privateData.privateKey.split('_')
        const privViewKey = keys[1]

        const send = await this.sendProvider.send({
            address: data.addressFrom,
            tx: uiData.selectedFee.blockchainData.rawTxHex,
            privViewKey,
            usingOuts: uiData.selectedFee.blockchainData.usingOuts,
            unspentsProvider: this.unspentsProvider
        })

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.sendTx result', send)

        if (send.status === 'OK') {
            return { transactionHash: uiData.selectedFee.blockchainData.rawTxHash }
        } else {
            throw new Error(this._settings.currencyCode + ' XmrTransferProcessor.sendTx status error ' + JSON.stringify(send))
        }
    }
}
