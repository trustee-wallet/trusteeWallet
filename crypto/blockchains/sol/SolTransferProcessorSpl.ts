/**
 * @version 0.52
 */

// eslint-disable-next-line no-unused-vars
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'

import { PublicKey, TransactionInstruction, Transaction } from '@solana/web3.js/src/index'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'
import SolTransferProcessor from '@crypto/blockchains/sol/SolTransferProcessor'
import SolInstructions from '@crypto/blockchains/sol/ext/SolInstructions'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


export default class SolTransferProcessorSpl extends SolTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: {} = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -3,
            shouldShowFees: false
        } as BlocksoftBlockchainTypes.FeeRateResult


        const destinationAssociatedTokenAddress = await SolUtils.findAssociatedTokenAddress(
            data.addressTo,
            this._settings.tokenAddress
        )
        const destinationAccountInfo = await SolUtils.getAccountInfo(destinationAssociatedTokenAddress)
        let feeForTx = BlocksoftExternalSettings.getStatic('SOL_PRICE')  // ◎0.000005
        if (
            destinationAccountInfo && typeof destinationAccountInfo.owner !== 'undefined' && destinationAccountInfo.owner === SolUtils.getTokenProgramID()
        ) {
            // do nothing
        } else {
            // will create new account
            feeForTx = BlocksoftExternalSettings.getStatic('SOL_PRICE_NEW_SPL')  // // ◎0.00203928 + 0.000005 = 0.00204428
        }

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
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        const fees = await this.getFeeRate(data, privateData, additionalData)

        return {
            ...fees,
            shouldShowFees: false,
            selectedTransferAllBalance: balance
        }
    }

    /**
     * @param data
     * @param privateData
     * @param uiData
     */
    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('SPL transaction required privateKey (derivedSeed)')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('SPL transaction required addressTo')
        }

        const sourceAssociatedTokenAddress = await SolUtils.findAssociatedTokenAddress(
            data.addressFrom,
            this._settings.tokenAddress
        )
        const sourceAccountInfo = await SolUtils.getAccountInfo(sourceAssociatedTokenAddress)
        if (!sourceAccountInfo || typeof sourceAccountInfo.lamports === 'undefined' || sourceAccountInfo.lamports * 1 === 0) {
            throw new Error('Cannot send from address with zero SOL balance')
        }



        const tx = new Transaction()
        let txData = false
        let destinationAccountInfo = await SolUtils.getAccountInfo(data.addressTo)
        if (
            destinationAccountInfo && typeof destinationAccountInfo.owner !== 'undefined' && destinationAccountInfo.owner === SolUtils.getTokenProgramID()
        ) {
            txData = {
                mint: this._settings.tokenAddress,
                decimals: this._settings.decimals,
                to: data.addressTo,
                amount: data.amount
            }
        } else {

            if (!destinationAccountInfo || typeof destinationAccountInfo.lamports === 'undefined' || destinationAccountInfo.lamports * 1 === 0) {
                throw new Error('SERVER_RESPONSE_RECEIVER_EMPTY_BALANCE')
            }

            const destinationAssociatedTokenAddress = await SolUtils.findAssociatedTokenAddress(
                data.addressTo,
                this._settings.tokenAddress
            )
            destinationAccountInfo = await SolUtils.getAccountInfo(destinationAssociatedTokenAddress)
            if (
                destinationAccountInfo && typeof destinationAccountInfo.owner !== 'undefined' && destinationAccountInfo.owner === SolUtils.getTokenProgramID()
            ) {
                // do nothing
            } else {
                const tmp1 = new TransactionInstruction({
                    keys: [{ pubkey: new PublicKey(data.addressTo), isSigner: false, isWritable: false }],
                    data: SolInstructions.encodeOwnerValidationInstruction({ account: new PublicKey('11111111111111111111111111111111') }),
                    programId: SolUtils.getOwnerValidationProgramId()
                })
                tx.add(tmp1)

                const keys = [
                    { pubkey: new PublicKey(data.addressFrom), isSigner: true, isWritable: true },
                    { pubkey: new PublicKey(destinationAssociatedTokenAddress), isSigner: false, isWritable: true },
                    { pubkey: new PublicKey(data.addressTo), isSigner: false, isWritable: false },
                    { pubkey: new PublicKey(this._settings.tokenAddress), isSigner: false, isWritable: false },
                    { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
                    { pubkey: new PublicKey(SolUtils.getTokenProgramID()), isSigner: false, isWritable: false },
                    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }
                ]
                const tmp2 = new TransactionInstruction({
                    keys,
                    programId: SolUtils.getAssociatedTokenProgramId(),
                    data: Buffer.from([])
                })
                tx.add(tmp2)
                // add owner
            }
            txData = {
                mint: this._settings.tokenAddress,
                decimals: this._settings.decimals,
                to: destinationAssociatedTokenAddress,
                amount: data.amount
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, txData)


        try {
            // https://github.com/project-serum/spl-token-wallet/blob/eda316d30bb7be4250dc622e41b6fda6f54ca7d8/src/utils/tokens/instructions.js#L99
            const keys = [
                { pubkey: new PublicKey(sourceAssociatedTokenAddress), isSigner: false, isWritable: true },
                { pubkey: new PublicKey(txData.mint), isSigner: false, isWritable: false },
                { pubkey: new PublicKey(txData.to), isSigner: false, isWritable: true },
                { pubkey: new PublicKey(data.addressFrom), isSigner: true, isWritable: false }
            ]
            tx.add(new TransactionInstruction({
                keys,
                data: SolInstructions.encodeTokenInstructionData({
                    transferChecked: { amount: txData.amount, decimals: txData.decimals }
                }),
                programId: SolUtils.getTokenProgramID()
            }))

        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' error ' + e.message)
            throw new Error(e.message)
        }

        await SolUtils.signTransaction(tx, privateData.privateKey, data.addressFrom)

        // @ts-ignore
        const signedData = tx.serialize().toString('base64')
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, signedData)


        const result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            const sendRes = await SolUtils.sendTransaction(signedData)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, sendRes)
            if (typeof sendRes === 'undefined' || !sendRes || typeof sendRes === 'undefined') {
                throw new Error('SYSTEM_ERROR')
            }
            result.transactionHash = sendRes
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTransferProcessorSpl.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send error ' + e.message)
            throw e
        }
        return result
    }
}
