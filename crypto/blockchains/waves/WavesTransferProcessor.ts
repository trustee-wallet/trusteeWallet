/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import config from '@app/config/config'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

//import { transfer, broadcast } from '@waves/waves-transactions/src/index'
import {
    addProof,
    chainIdFromRecipient,
    convertToPairs,
    fee,
    getSenderPublicKey,
    networkByte,
    normalizeAssetId
} from '@waves/waves-transactions/src/generic.ts'
import {validate} from '@waves/waves-transactions/src/validators'
import {txToProtoBytes} from '@waves/waves-transactions/src/proto-serialize.ts'
import {binary} from '@waves/marshall'
import {base58Encode, blake2b, signBytes} from '@waves/ts-lib-crypto'

const transfer = (paramsOrTx, seed) => {
    const type = 4 // TRANSACTION_TYPE.TRANSFER
    const version = paramsOrTx.version || 3 //DEFAULT_VERSIONS.TRANSFER
    const seedsAndIndexes = convertToPairs(seed)
    const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx)

    const tx = {
        type,
        version,
        senderPublicKey,
        assetId: normalizeAssetId(paramsOrTx.assetId),
        recipient: paramsOrTx.recipient,
        amount: paramsOrTx.amount * 1,
        attachment: paramsOrTx.attachment || '',
        fee: fee(paramsOrTx, 100000),
        feeAssetId: normalizeAssetId(paramsOrTx.feeAssetId),
        timestamp: paramsOrTx.timestamp || Date.now(),
        proofs: paramsOrTx.proofs || [],
        chainId: networkByte(paramsOrTx.chainId, chainIdFromRecipient(paramsOrTx.recipient)),
        id: '',
    }

    validate.transfer(tx)

    const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx)

    seedsAndIndexes.forEach(([s, i]) => addProof(tx, signBytes(s, bytes), i))
    tx.id = base58Encode(blake2b(bytes))

    return tx
}

export default class WavesTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: { network: string; currencyCode: string }

    private _tokenAddress: string

    private _mainCurrencyCode: string

    constructor(settings: { network: string; currencyCode: string }) {
        this._settings = settings
        this._tokenAddress = typeof settings.tokenAddress !== 'undefined' ? settings.tokenAddress : false

        this._mainCurrencyCode = 'WAVES'
        if (this._settings.currencyCode === 'ASH' || this._settings.currencyCode.indexOf('ASH_') === 0) {
            this._mainCurrencyCode = 'ASH'
        }
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

        result.fees = [
            {
                langMsg: 'xrp_speed_one',
                feeForTx: '100000',
                amountForTx: data.amount
            }
        ]
        result.selectedFeeIndex = 0


        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        const res = await this.getFeeRate(data, privateData, additionalData)
        let amount
        if (this._tokenAddress) {
            amount = balance
        } else {
            amount = BlocksoftUtils.diff(balance, '100000').toString()
            res.fees[0].amountForTx = amount
        }

        return {
            ...res,
            shouldShowFees: false,
            selectedTransferAllBalance: amount,
        }
    }

    /**
     * https://docs.waves.tech/en/building-apps/how-to/basic/transaction#sign-transaction-using-your-own-seed
     * @param data
     * @param privateData
     * @param uiData
     */
    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('WAVES transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('WAVES transaction required addressTo')
        }

        let addressTo = data.addressTo
        let apiPath
        if (this._mainCurrencyCode === 'ASH') {
            apiPath = await BlocksoftExternalSettings.get('ASH_SERVER')
            addressTo = addressTo.replace('Æx', '')
        } else {
            apiPath = await BlocksoftExternalSettings.get('WAVES_SERVER')
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx started ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount)

        let signedData = false
        try {
            const money = {
                recipient: addressTo,
                amount: data.amount
            }
            if (this._tokenAddress) {
                money.assetId = this._tokenAddress
            }
            signedData = transfer(money, { privateKey: privateData.privateKey })

        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' signedData error ' + e.message)
            throw new Error(e.message)
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' signedData', signedData)
        if (!signedData || typeof signedData.id === 'undefined' || !signedData.id) {
            throw new Error('SYSTEM_ERROR')
        }

        if (typeof uiData !== 'undefined' && typeof uiData.selectedFee !== 'undefined' && typeof uiData.selectedFee.rawOnly !== 'undefined' && uiData.selectedFee.rawOnly) {
            return { rawOnly: uiData.selectedFee.rawOnly, raw: JSON.stringify(signedData) }
        }

        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' will broadCast by POST ' + JSON.stringify(apiPath))

            const resp = await fetch(apiPath + '/transactions/broadcast', {
                method: 'POST',
                body: JSON.stringify(signedData),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            let ret = await resp.text()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send res ' + ret)
            try {
                let ret1 = JSON.parse(ret)
                if (typeof ret1.amount === 'undefined') {
                    throw new Error('no amount')
                }
            } catch (e1) {
                throw new Error(ret)
            }
            result.transactionHash = signedData.id
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send error ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send error ' + e.message)
            this.checkError(e, data, false)
        }
        return result
    }

    checkError(e, data, txRBF = false) {
        if (e.message.indexOf('waves balance to (at least) temporary negative state') !== -1) {
            throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
        } else {
            MarketingEvent.logOnlyRealTime('v30_' + this._settings.currencyCode + '_tx_error_' + this._settings.currencyCode, {
                title: data.addressFrom + ' => ' + data.addressTo,
                error: e.message
            })
            throw e
        }
    }
}
