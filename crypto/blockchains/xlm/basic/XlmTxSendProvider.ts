/**
 * @version 0.20
 * https://developers.stellar.org/docs/tutorials/send-and-receive-payments/
 * https://www.stellar.org/developers/horizon/reference/endpoints/transactions-create.html
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'

import { XrpTxUtils } from '../../xrp/basic/XrpTxUtils'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'
import config from '../../../../app/config/config'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

const StellarSdk = require('stellar-sdk')

export class XlmTxSendProvider {

    private readonly _api: any
    private readonly _server: any

    constructor() {
        this._server = BlocksoftExternalSettings.getStatic('XLM_SERVER')
        this._api = new StellarSdk.Server(this._server)
    }

    async getFee() {
        return this._api.fetchBaseFee()
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
                }).addOperation(operation).addMemo(StellarSdk.Memo.text(data.memo)).setTimeout(30).build()
            } else {
                transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: uiData.selectedFee.blockchainData,
                    networkPassphrase: StellarSdk.Networks.PUBLIC
                }).addOperation(operation).setTimeout(30).build()
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
        try {
            // console.log(`curl -X POST -F "tx=${raw}" "https://horizon.stellar.org/transactions"`)

            const formData = new FormData()
            formData.append('tx', raw)

            const response = await fetch(this._server + '/transactions', {
                method: 'POST',
                credentials: 'same-origin',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                body: formData
            })
            result = await response.json()
            if (result && typeof result.extras !== 'undefined' && typeof result.extras.result_codes !== 'undefined' && typeof result.extras.result_codes.operations !== 'undefined') {
                throw new Error(result.extras.result_codes.operations[0])
            }
            if (typeof result.status !== 'undefined') {
                if (result.status === 406 || result.status === 400 || result.status === 504) {
                    throw new Error(result.title)
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XlmTransferProcessor.sendTx error ', e)
            }
            await BlocksoftCryptoLog.log('XlmTransferProcessor.sendTx error ' + e.message)
            throw e
        }
        await BlocksoftCryptoLog.log('XlmTransferProcessor.sendTx result ', result)
        return result
    }
}
