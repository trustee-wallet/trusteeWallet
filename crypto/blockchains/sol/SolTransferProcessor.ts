/**
 * @version 0.43
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

// eslint-disable-next-line no-unused-vars
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js/src/index'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'


export default class SolTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: { network: string; currencyCode: string }

    constructor(settings: { network: string; currencyCode: string }) {
        this._settings = settings
    }

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return false
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -3,
            shouldShowFees: false
        } as BlocksoftBlockchainTypes.FeeRateResult

        const feeForTx = BlocksoftExternalSettings.getStatic('SOL_PRICE')
        result.fees = [
            {
                langMsg: 'xrp_speed_one',
                feeForTx,
                amountForTx: data.amount
            }
        ]
        result.selectedFeeIndex = 0


        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        const fees = await this.getFeeRate(data, privateData, additionalData)

        const amount = BlocksoftUtils.diff(balance, fees.fees[0].feeForTx).toString()

        return {
            ...fees,
            shouldShowFees: false,
            selectedTransferAllBalance: amount
        }
    }

    /**
     * @param data
     * @param privateData
     * @param uiData
     */
    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('SOL transaction required privateKey (derivedSeed)')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('SOL transaction required addressTo')
        }

        if (uiData && typeof uiData.uiErrorConfirmed !== 'undefined' &&
            (
                uiData.uiErrorConfirmed === 'UI_CONFIRM_ADDRESS_TO_EMPTY_BALANCE'
                || uiData.uiErrorConfirmed === 'UI_CONFIRM_DOUBLE_SEND'
            )
        ) {
            // do nothing
        } else {
            const balance = await (BlocksoftBalances.setCurrencyCode('SOL').setAddress(data.addressTo)).getBalance('SolSendTx')
            if (!balance || typeof balance.balance === 'undefined' || balance.balance === 0) {
                throw new Error('UI_CONFIRM_ADDRESS_TO_EMPTY_BALANCE')
            }
        }

        let tx: Transaction
        try {
            // @ts-ignore
            tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(data.addressFrom),
                    toPubkey: new PublicKey(data.addressTo),
                    lamports: data.amount * 1
                })
            )
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' error ' + e.message)
            throw new Error(e.message)
        }

        await SolUtils.signTransaction(tx, privateData.privateKey, data.addressFrom)

        // @ts-ignore
        const signedData = tx.serialize().toString('base64')
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, signedData)

        const result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            const sendRes = await SolUtils.sendTransaction(signedData)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, sendRes)
            if (typeof sendRes === 'undefined' || !sendRes || typeof sendRes === 'undefined') {
                throw new Error('SYSTEM_ERROR')
            }
            result.transactionHash = sendRes
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send error ' + e.message)
            throw e
        }
        return result
    }
}
