/**
 * @author Ksu
 * @version 0.20
 */
import { BlocksoftDictTypes } from '../common/BlocksoftDictTypes'
import { TransactionBuilder } from 'bitcoinjs-lib'

export namespace BlocksoftBlockchainTypes {

    export interface TransferProcessor {
        needPrivateForFee(): boolean

        sendTx(data: TransferData, privateData: TransferPrivateData, uiData: TransferUiData): Promise<SendTxResult>

        checkTransferHasError?(data: CheckTransferHasErrorData): Promise<CheckTransferHasErrorResult>

        checkSendAllModal?(data: { currencyCode: any }): boolean

        getTransferAllBalance(data: TransferData, privateData?: TransferPrivateData, additionalData?: TransferAdditionalData): Promise<TransferAllBalanceResult>

        getFeeRate(data: TransferData, privateData?: TransferPrivateData, additionalData?: TransferAdditionalData): Promise<FeeRateResult>

        sendRawTx?(data: DbAccount, rawTxHex: string, txRBF: any, logData: any): Promise<string>

        setMissingTx?(data: DbAccount, transaction: DbTransaction): Promise<boolean>

        canRBF?(data: BlocksoftBlockchainTypes.DbAccount, dbTransaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean
    }

    export interface UnspentsProvider {
        getUnspents(address: string): Promise<UnspentTx[]>

        getTx?(tx: string, address: string, allUnspents: BlocksoftBlockchainTypes.UnspentTx[], walletHash: string): Promise<UnspentTx[]>

        _isMyAddress?(voutAddress: string, address: string, walletHash: string): string
    }

    export interface SendProvider {
        sendTx(hex: string, subtitle: string, txRBF: any, logData: any): Promise<{ transactionHash: string, transactionJson: any, logData?: any }>
    }

    export interface NetworkPrices {
        getNetworkPrices(currencyCode: string): Promise<{ 'speed_blocks_2': number, 'speed_blocks_6': number, 'speed_blocks_12': number }>
    }

    export interface TxInputsOutputs {
        getInputsOutputs(data: BlocksoftBlockchainTypes.TransferData,
                         unspents: BlocksoftBlockchainTypes.UnspentTx[],
                         feeToCount: { feeForByte?: string, feeForAll?: string, autoFeeLimitReadable?: string | number },
                         additionalData: BlocksoftBlockchainTypes.TransferAdditionalData,
                         subtitle: string)
            : Promise<BlocksoftBlockchainTypes.PreparedInputsOutputsTx>
    }

    export interface TxBuilder {
        getRawTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, preparedInputsOutputs: BlocksoftBlockchainTypes.PreparedInputsOutputsTx):
            Promise<{
                rawTxHex: string,
                nSequence: number,
                txAllowReplaceByFee: boolean,
                preparedInputsOutputs: BlocksoftBlockchainTypes.PreparedInputsOutputsTx
            }>

        _getRawTxValidateKeyPair(privateData: BlocksoftBlockchainTypes.TransferPrivateData, data: BlocksoftBlockchainTypes.TransferData): void

        _getRawTxAddInput(txb: TransactionBuilder, i: number, input: UnspentTx, nSequence: number): Promise<void>

        _getRawTxSign(txb: TransactionBuilder, i: number, input: UnspentTx): Promise<void>

        _getRawTxAddOutput(txb: TransactionBuilder, output: OutputTx): void
    }

    export interface Fee {
        langMsg: string,
        gasPrice?: string,
        gasLimit?: string,
        needSpeed?: string,
        feeForByte?: string,
        feeForTx: string,
        nonceForTx?: number | string,
        amountForTx: string,
        addressToTx?: string,
        isCustomFee?: boolean,
        showNonce?: boolean,
        feeForTxBasicAmount?: number,
        feeForTxBasicSymbol?: string,
        feeForTxCurrencyAmount?: number,
        feeForTxDelegated?: number,
        blockchainData?: any
        rawOnly?: boolean,
        bseOrderId ?: string
    }

    export interface CheckTransferHasErrorData {
        currencyCode: BlocksoftDictTypes.Code,
        walletHash: string,
        addressTo: string,
        addressFrom: string,
        amount: string
    }

    export interface CheckTransferHasErrorResult {
        isOk: boolean,
        code?: 'TOKEN' | 'XRP' | 'XLM',
        parentBlockchain?: 'Ethereum' | 'Bitcoin' | 'Binance',
        parentCurrency?: 'ETH' | 'BTC' | 'BNB',
        address?: string
    }

    export interface TransferData {
        currencyCode: BlocksoftDictTypes.Code,
        walletHash: string,
        derivationPath: string,
        addressFrom: string,
        addressTo: string,
        amount: string,
        useOnlyConfirmed: boolean,
        allowReplaceByFee: boolean,
        useLegacy: number,
        isHd: boolean,

        accountBalanceRaw: string,
        isTransferAll: boolean,

        memo?: string,
        transactionReplaceByFee?: string,
        transactionSpeedUp?: string,
        transactionRemoveByFee?: string,

        blockchainData?: string,
        dexOrderData?:string,
        contractCallData?: string,

        accountJson?: any,
        transactionJson?: any
    }

    export interface TransferPrivateData {
        privateKey: string
        addedData?: any
    }

    export interface TransferUiData {
        uiErrorConfirmed: boolean,
        selectedFee: Fee
    }

    export interface TransferAdditionalData {
        mnemonic?: string,
        prices?: { 'speed_blocks_2': string, 'speed_blocks_6': string, 'speed_blocks_12': string },
        feeForByte?: string,
        gasLimit?: number,
        gasPrice?: number,
        gasPriceTitle?: 'speed_blocks_2',
        nonceForTx?: number,
        isCustomFee?: boolean,
        balance?: string,
        unspents?: []
    }

    export interface TransferAllBalanceResult {
        additionalData?: { unspents: any[] }
        selectedTransferAllBalance: string,
        selectedFeeIndex: number,
        countedForBasicBalance: string,
        fees: Fee[],
        shouldShowFees?: boolean,
        showSmallFeeNotice?: number,
        countedTime?: number
    }

    export interface FeeRateResult {
        additionalData: { unspents: any[] }
        countedForBasicBalance: string,
        selectedFeeIndex: number,
        fees: Fee[],
        shouldShowFees?: boolean,

        showBigGasNotice?: number,
        showSmallFeeNotice?: number,

        showLongQueryNotice?: number,
        showLongQueryNoticeTxs?: any,

        showBlockedBalanceNotice?: number,
        showBlockedBalanceFree?: number | any,
        countedTime: number
    }

    export interface SendTxResult {
        transactionHash: string,
        transactionJson?: {
            nonce?: string,
            gasPrice?: number,
            nSequence?: string,
            txAllowReplaceByFee?: boolean
            feeForByte?: string
            secretTxKey?: string
        },

        amountForTx?: string,
        addressTo?: string,
        blockHash?: string,

        transactionFee?: string,
        transactionFeeCurrencyCode?: string
        transactionStatus?: string
        transactionTimestamp?: string,
        successMessage?: string
    }

    export interface CurrencySettings {
        network: any;
        currencyCode: string;
        decimals: any
    }

    export interface BuilderSettings {
        minOutputDustReadable: number,
        minChangeDustReadable: number,
        feeMaxForByteSatoshi: number,
        feeMaxAutoReadable2: number,
        feeMaxAutoReadable6: number,
        feeMaxAutoReadable12: number,
        changeTogether: boolean,
        minRbfStepSatoshi?: number,
        minSpeedUpMulti?: number,
        feeMinTotalReadable?: number
    }

    export interface UnspentTx {
        isRequired: boolean,
        derivationPath?: string
        address?: string,
        txid: string,
        vout: number,
        value: string,
        height: number,
        confirmations: number
    }

    export interface OutputTx {
        isChange?: boolean,
        isUsdt?: boolean,
        tokenAmount?: string,
        logType?: string,
        to: string,
        amount: string
    }

    export interface PreparedInputsOutputsTx {
        inputs: BlocksoftBlockchainTypes.UnspentTx[],
        outputs: BlocksoftBlockchainTypes.OutputTx[],
        multiAddress: [],
        msg: string,
        countedFor?: string
    }

    export interface EthTx {
        from: string,
        to: string,
        gasPrice: number,
        gas: number,
        value: string,
        nonce?: number,
        data?: string
    }

    export interface DbAccount {
        currencyCode: BlocksoftDictTypes.Code,
        walletHash: string,
        address: string,
    }

    export interface DbTransaction {
        currencyCode: BlocksoftDictTypes.Code,
        transactionHash: string,
        transactionDirection: string,
        transactionStatus: string,
        addressTo: string,
        transactionJson?: {
            delegatedNonce?: string,
            nonce?: string,
            gasPrice?: number
        }
    }
}
