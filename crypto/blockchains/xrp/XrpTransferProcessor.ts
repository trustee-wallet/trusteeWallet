/**
 * @version 0.20
 * https://gist.github.com/WietseWind/19df307c3c68748543971242284ade4d
 *
 * https://xrpl.org/rippleapi-reference.html#preparepayment
 * https://xrpl.org/rippleapi-reference.html#sign
 * https://xrpl.org/rippleapi-reference.html#submit
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftDispatcher from '../BlocksoftDispatcher'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import { XrpTxSendProvider } from './basic/XrpTxSendProvider'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


const FEE_DECIMALS = 6

export default class XrpTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: { network: string; currencyCode: string }
    private _provider: XrpTxSendProvider
    private _inited : boolean = false

    constructor(settings: { network: string; currencyCode: string }) {
        this._settings = settings
    }

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }

    async checkTransferHasError(data: BlocksoftBlockchainTypes.CheckTransferHasErrorData): Promise<BlocksoftBlockchainTypes.CheckTransferHasErrorResult> {
        // @ts-ignore
        if (data.amount && data.amount * 1 > BlocksoftExternalSettings.getStatic('XRP_MIN')) {
            return { isOk: true }
        }
        /**
         * @type {XrpScannerProcessor}
         */
        const balanceProvider = BlocksoftDispatcher.getScannerProcessor(this._settings.currencyCode)
        const balanceRaw = await balanceProvider.getBalanceBlockchain(data.addressTo)
        if (balanceRaw && typeof balanceRaw.balance !== 'undefined' && balanceRaw.balance > BlocksoftExternalSettings.getStatic('XRP_MIN')) {
            return { isOk: true }
        } else {
            return { isOk: false, code: 'XRP', address: data.addressTo }
        }
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -1,
            shouldShowFees : false
        } as BlocksoftBlockchainTypes.FeeRateResult

        // @ts-ignore
        if (data.amount * 1 <= 0) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' skipped as zero amount')
            return result
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' started amount: ' + data.amount)


        let txJson = false
        try {
            if (!this._inited) {
                this._provider = new XrpTxSendProvider()
                this._inited = true
            }
            txJson = await this._provider.getPrepared(data)
        } catch (e) {
            if (e.message.indexOf('connect() timed out after') !== -1) {
                return false
            }
            if (e.message.indexOf('Account not found') !== -1) {
                return false
            }
            if (e.message.indexOf('Destination does not exist. Too little XRP sent to create it') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_DEST_XRP')
            }
            throw e
        }
        if (!txJson) {
            throw new Error('SERVER_RESPONSE_BAD_INTERNET')
        }
        // @ts-ignore
        const fee = BlocksoftUtils.toUnified(txJson.Fee, FEE_DECIMALS)

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' fee: ' + fee)
        result.fees = [
            {
                langMsg: 'xrp_speed_one',
                feeForTx: fee,
                amountForTx: data.amount,
                blockchainData: txJson
            }
        ]
        result.selectedFeeIndex = 0
        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        // noinspection EqualityComparisonWithCoercionJS
        if (BlocksoftUtils.diff(balance, BlocksoftExternalSettings.getStatic('XRP_MIN')) <= 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -1,
                fees: [],
                shouldShowFees : false,
                countedForBasicBalance: '0'
            }
        }


        const result = await this.getFeeRate(data, privateData, additionalData)
        // @ts-ignore
        if (!result || result.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                shouldShowFees : false,
                countedForBasicBalance: balance
            }
        }
        // @ts-ignore
        result.fees[result.selectedFeeIndex].amountForTx = BlocksoftUtils.diff(result.fees[result.selectedFeeIndex].amountForTx, BlocksoftExternalSettings.getStatic('XRP_MIN')).toString()
        return {
            ...result,
            shouldShowFees : false,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('XRP transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('XRP transaction required addressTo')
        }

        let txJson = false
        try {
            if (!this._inited) {
                this._provider = new XrpTxSendProvider()
                this._inited = true
            }
            txJson = await this._provider.getPrepared(data, false)
        } catch (e) {
            if (e.message.indexOf('connect() timed out after') !== -1) {
                throw new Error('SERVER_RESPONSE_BAD_INTERNET')
            }
            if (e.message.indexOf('Account not found') !== -1) {
                throw new Error('SERVER_RESPONSE_BAD_INTERNET')
            }
            if (e.message.indexOf('Destination does not exist. Too little XRP sent to create it') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_DEST_XRP')
            }
            throw e
        }


        // https://xrpl.org/rippleapi-reference.html#preparepayment
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.sendTx prepared', txJson)

        // https://xrpl.org/rippleapi-reference.html#sign
        if (typeof data.accountJson !== 'object') {
            try {
                const tmp = JSON.parse(data.accountJson)
                data.accountJson = tmp
            } catch (e) {
                BlocksoftCryptoLog.err(this._settings.currencyCode + ' XrpTransferProcessor.sendTx no accountJson ' + JSON.stringify(data.accountJson))
            }
        }
        if (typeof data.accountJson.publicKey === 'undefined') {
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' XrpTransferProcessor.sendTx no publicKey ' + JSON.stringify(data.accountJson))
            throw new Error('SERVER_RESPONSE_BAD_CODE')
        }

        if (typeof uiData !== 'undefined' && typeof uiData.selectedFee !== 'undefined'&& typeof uiData.selectedFee.rawOnly !== 'undefined' && uiData.selectedFee.rawOnly) {
            return { rawOnly: uiData.selectedFee.rawOnly, raw : this._provider.signTx(data, privateData, txJson)}
        }

        const result = await this._provider.sendTx(data, privateData, txJson)

        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v30_rippled_any_result' , {
            title: data.addressFrom + ' => ' + data.addressTo,
            txJson,
            result
        })
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.sendTx result', result)

        if (result.resultCode === 'tecNO_DST_INSUF_XRP') {
            throw new Error(result.resultMessage) // not enough - could be replaced by translated
        } else if (result.resultCode === 'tecUNFUNDED_PAYMENT') {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_XRP') // not enough to pay
        } else if (result.resultCode === 'tecNO_DST_INSUF_XRP') {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_DEST_XRP') // not enough to create account
        } else if (result.resultCode === 'tefBAD_AUTH') {
            throw new Error(result.resultMessage) // not valid key
        } else if (result.resultCode === 'tecDST_TAG_NEEDED') {
            throw new Error('SERVER_RESPONSE_TAG_NEEDED_XRP')
        }

        if (typeof result.tx_json === 'undefined' || typeof result.tx_json.hash === 'undefined') {
            throw new Error(result.resultMessage) // not enough
        }

        if (result.resultCode !== 'tesSUCCESS') {
            return { transactionHash: result.tx_json.hash, successMessage: result.resultMessage } // Held until escalated fee drops
        }

        return { transactionHash: result.tx_json.hash }
    }
}
