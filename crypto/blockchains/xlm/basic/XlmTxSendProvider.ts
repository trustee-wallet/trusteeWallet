/**
 * @version 0.20
 * https://developers.stellar.org/docs/tutorials/send-and-receive-payments/
 * https://www.stellar.org/developers/horizon/reference/endpoints/transactions-create.html
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'

import { XrpTxUtils } from '../../xrp/basic/XrpTxUtils'

import config from '../../../../app/config/config'

const StellarSdk = require('stellar-sdk')


const CACHE_VALID_TIME = 600000 // 10 minute
let CACHE_FEES_TIME = 0
let CACHE_FEES_VALUE = 0

const TX_TIMEOUT = 30

export class XlmTxSendProvider {

    private readonly _api: any
    private readonly _server: any

    constructor() {
        this._server = BlocksoftExternalSettings.getStatic('XLM_SERVER')
        this._api = new StellarSdk.Server(this._server)
        CACHE_FEES_VALUE = BlocksoftExternalSettings.getStatic('XLM_SERVER_PRICE')
    }

    async getFee() {
        const force = BlocksoftExternalSettings.getStatic('XLM_SERVER_PRICE_FORCE')
        if (force * 1 > 1) {
            return force
        }

        const now = new Date().getTime()
        if (now - CACHE_FEES_TIME <= CACHE_VALID_TIME) {
            return CACHE_FEES_VALUE
        }

        BlocksoftCryptoLog.log('XlmSendProvider.getFee link ' + this._server)
        let res = CACHE_FEES_VALUE
        try {
            res = await this._api.fetchBaseFee()
            if (res * 1 > 0) {
                CACHE_FEES_VALUE = res * 1
                CACHE_FEES_TIME = now
            }
        } catch (e) {
            BlocksoftCryptoLog.log('XlmSendProvider.getFee error ' + e.message + ' link ' + this._server)
            res = CACHE_FEES_VALUE
        }
        return res
    }

    async getPrepared(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData, type = 'usual') {
        const account = await this._api.loadAccount(data.addressFrom)

        let transaction
        try {
            let operation
            if (type === 'create_account') {
                // https://stellar.stackexchange.com/questions/2144/create-multiple-trustlines-upon-account-creation
                operation = StellarSdk.Operation.createAccount({
                    destination: data.addressTo,
                    startingBalance: XrpTxUtils.amountPrep(data.amount)
                })
            } else {
                operation = StellarSdk.Operation.payment({
                    destination: data.addressTo,
                    asset: StellarSdk.Asset.native(),
                    amount: XrpTxUtils.amountPrep(data.amount)
                })
            }

            if (typeof data.memo !== 'undefined' && data.memo && data.memo.toString().trim().length > 0) {
                transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: uiData.selectedFee.blockchainData,
                    networkPassphrase: StellarSdk.Networks.PUBLIC
                }).addOperation(operation).addMemo(StellarSdk.Memo.text(data.memo)).setTimeout(TX_TIMEOUT).build()
            } else {
                transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: uiData.selectedFee.blockchainData,
                    networkPassphrase: StellarSdk.Networks.PUBLIC
                }).addOperation(operation).setTimeout(TX_TIMEOUT).build()
            }
        } catch (e) {
            await BlocksoftCryptoLog.log('XlmTxSendProvider builder create error ' + e.message)
            throw e
        }

        try {
            transaction.sign(StellarSdk.Keypair.fromSecret(privateData.privateKey))
        } catch (e) {
            await BlocksoftCryptoLog.log('XlmTxSendProvider sign error ' + e.message)
            throw e
        }
        return transaction
    }

    async sendRaw(raw: string) {
        let result = false
        const link = BlocksoftExternalSettings.getStatic('XLM_SEND_LINK')
        BlocksoftCryptoLog.log('XlmSendProvider.sendRaw ' + link + ' raw ' + raw)
        try {
            // console.log(`curl -X POST -F "tx=${raw}" "https://horizon.stellar.org/transactions"`)

            const formData = new FormData()
            formData.append('tx', raw)

            const response = await fetch(link, {
                method: 'POST',
                credentials: 'same-origin',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                body: formData
            })
            result = await response.json()
            if (result && typeof result.extras !== 'undefined' && typeof result.extras.result_codes !== 'undefined') {
                if (config.debug.cryptoErrors) {
                    console.log('XlmTransferProcessor.sendTx result.extras.result_codes ' + JSON.stringify(result.extras.result_codes))
                }
                await BlocksoftCryptoLog.log('XlmTransferProcessor.sendTx result.extras.result_codes ' + JSON.stringify(result.extras.result_codes))

                if (typeof result.extras.result_codes.operations !== 'undefined') {
                    throw new Error(result.extras.result_codes.operations[0] + ' ' + raw)
                }
                if (typeof result.extras.result_codes.transaction !== 'undefined') {
                    throw new Error(result.extras.result_codes.transaction + ' ' + raw)
                }
            }
            if (typeof result.status !== 'undefined') {
                if (result.status === 406 || result.status === 400 || result.status === 504) {
                    throw new Error(result.title)
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XlmTransferProcessor.sendTx error ' + e.message + ' link ' + link)
            }
            await BlocksoftCryptoLog.log('XlmTransferProcessor.sendTx error ' + e.message + ' link ' + link)
            if (e.message.indexOf('status code 406') !== -1 || e.message.indexOf('status code 400') !== -1 || e.message.indexOf('status code 504') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
            } else if (e.message.indexOf('tx_insufficient_fee') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        await BlocksoftCryptoLog.log('XlmTransferProcessor.sendTx result ', result)
        return result
    }
}
