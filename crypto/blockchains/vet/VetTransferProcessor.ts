/**
 * @version 0.20
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import { thorify } from 'thorify'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'

const Web3 = require('web3')
const abi = [
    {
        'constant': false,
        'inputs': [
            {
                'name': 'to',
                'type': 'address'
            },
            {
                'name': 'value',
                'type': 'uint256'
            }
        ],
        'name': 'transfer',
        'outputs': [
            {
                'name': 'ok',
                'type': 'bool'
            }
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    }
]
const tokenAddress = '0x0000000000000000000000000000456e65726779'

const API_PATH = 'https://sync-mainnet.vechain.org'

export default class VetTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {
    private _settings: { network: string; currencyCode: string }
    private _web3: any
    private _token: any

    constructor(settings: { network: string; currencyCode: string }) {
        this._settings = settings
        this._web3 = thorify(new Web3(), API_PATH)
        this._token = new this._web3.eth.Contract(abi, tokenAddress)
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

        if (this._settings.currencyCode === 'VET') {
            // @todo
            /*
            result.fees = [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx: '536300000000000000',
                    amountForTx: data.amount
                }
            ]
            result.selectedFeeIndex = 0
            */
        } else {
            result.fees = [
                {
                    langMsg: 'xrp_speed_one',
                    feeForTx: '536300000000000000',
                    amountForTx: data.amount
                }
            ]
            result.selectedFeeIndex = 0
        }


        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        const balance = data.amount
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)

        const fees = await this.getFeeRate(data, privateData, additionalData)

        let amount
        if (this._settings.currencyCode === 'VET') {
            amount = balance
        } else {
            amount = BlocksoftUtils.diff(balance, '536300000000000000').toString()
        }

        return {
            ...fees,
            shouldShowFees: false,
            selectedTransferAllBalance: amount
        }
    }

    /**
     * https://thorify.vecha.in/#/?id=how-do-i-send-vtho-token
     * https://thorify.vecha.in/#/?id=send-transaction-1
     * https://github.com/vechain/thorify/blob/bb7a97e5e62b46af0d45fa119e99539d57e2302a/test/web3/eth.test.ts
     * @param data
     * @param privateData
     * @param uiData
     */
    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('VET transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('VET transaction required addressTo')
        }

        let signedData = false
        try {
            this._web3.eth.accounts.wallet.add(privateData.privateKey)

            if (this._settings.currencyCode === 'VET') {
                signedData = await this._web3.eth.accounts.signTransaction({
                    from: data.addressFrom,
                    to: data.addressTo,
                    value: data.amount,
                }, privateData.privateKey)
            } else {
                const basicAddressTo = data.addressTo.toLowerCase()
                const encoded = this._token.methods.transfer(basicAddressTo, data.amount).encodeABI()
                signedData = await this._web3.eth.accounts.signTransaction({
                    from: data.addressFrom,
                    to: tokenAddress,
                    data : encoded,
                    value: 0,
                }, privateData.privateKey)
            }

        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' error ' + e.message)
            throw new Error(e.message)
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, signedData)
        if (!signedData || typeof signedData.rawTransaction === 'undefined' || !signedData.rawTransaction) {
            throw new Error('SYSTEM_ERROR')
        }
        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            const send = await BlocksoftAxios.post(API_PATH + '/transactions', { raw: signedData.rawTransaction })
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount, send.data)
            if (typeof send.data === 'undefined' || !send.data || typeof send.data.id === 'undefined') {
                throw new Error('SYSTEM_ERROR')
            }
            result.transactionHash = send.data.id
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' VetTransferProcessor.sendTx  ' + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' send error ' + e.message)
            throw new Error(e.message)
        }
        return result
    }
}
