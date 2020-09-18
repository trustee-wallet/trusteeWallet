/**
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import { BigInt } from 'xmr-core/biginteger'

import { estimatedTransactionNetworkFee } from 'xmr-core/xmr-mymonero-libs/lib/mymonero-send-tx/sending_funds'
import {
    calculateFeeKb,
    multiplyFeePriority
} from 'xmr-core/xmr-mymonero-libs/src/mymonero-send-tx/internal_libs/fee_utils'
import {
    constructTx,
    validateAndConstructFundTargets
} from 'xmr-core/xmr-mymonero-libs/src/mymonero-send-tx/internal_libs/tx_utils/tx_utils'
import { getRestOfTxData } from 'xmr-core/xmr-mymonero-libs/src/mymonero-send-tx/internal_libs/construct_tx_and_send/construct_tx_and_send'
import XmrUnspentsProvider from './providers/XmrUnspentsProvider'
import { AmountOutput, Output, ParsedTarget, Pid, ViewSendKeys } from 'xmr-core/xmr-transaction'
import { HWDevice, NetType, DefaultDevice, rand_32 } from 'xmr-core/xmr-crypto-utils'
import { selectOutputsAndAmountForMixin } from 'xmr-core/xmr-mymonero-libs/src/mymonero-send-tx/internal_libs/output_selection'
import { createTxAndAttemptToSend } from 'xmr-core/xmr-mymonero-libs/src/mymonero-send-tx/internal_libs/construct_tx_and_send/index'

import XmrSendProvider from './providers/XmrSendProvider'

const hwdev = new DefaultDevice()

const CACHE = {}
export default class XmrTransferLightProcessor {

    constructor(settings) {
        this._settings = settings
        this.unspentsProvider = new XmrUnspentsProvider(settings)
        this.sendProvider = new XmrSendProvider(settings)
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        return false
    }


    async _buildTx(data, useCache = false) {
        if (typeof data.jsonData === 'undefined' || !data.jsonData || typeof data.jsonData.publicSpendKey === 'undefined') {
            throw new Error('XmrTransferProcessor public spend key is required')
        }
        const keys = data.privateKey.split('_')
        const privSpendKey = keys[0]
        const privViewKey = keys[1]
        const pubSpendKey = data.jsonData.publicSpendKey

        let unspents = false
        if (!useCache || typeof CACHE[data.address] === 'undefined') {
            unspents = await this.unspentsProvider._getUnspents({
                address: data.addressFrom,
                amount: data.amount,
                privViewKey,
                pubSpendKey,
                privSpendKey
            })
            CACHE[data.address] = unspents
        } else {
            unspents = CACHE[data.address]
        }


        const xmrParams = {
            senderAddress: data.addressFrom,
            senderPublicKeys: {
                view: data.jsonData.publicViewKey,
                spend: data.jsonData.publicSpendKey
            },
            senderPrivateKeys: {
                view: privViewKey,
                spend: privSpendKey
            },
            targetAddress: data.addressTo,
            targetAmount: data.amount,
            mixin: '10',
            unusedOuts: unspents.unusedOuts,
            feelessTotal: new BigInt(data.amount),
            feePerKB: unspents.per_kb_fee,
            isRingCT: true,
            isSweeping: false,
            updateStatus: (res) => {
            },
            api: {
                randomOutputs: async (usingOuts, mixin) => {
                    return this.unspentsProvider.randomOutputs(usingOuts, mixin)
                }
            },
            nettype: NetType.MAINNET,
            hwdev
        }
        return xmrParams
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.addressForChange
     * @param {string|int} data.amount
     * @param {number|boolean} additionalData.isPrecount
     * @param {number|boolean} additionalData.estimatedGas
     * @returns {Promise<boolean>}
     */
    async getFeeRate(data, additionalData) {

        if (data.amount <= 0) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' skipped as zero amount')
            return false
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' started amount: ' + data.amount)

        const xmrParams = await this._buildTx(data, false)

        // 1: "Low", 2: "Medium", 3: "High", 4: "Very High"
        const fee = []
        const res = []
        for (let i = 1; i <= 4; i++) {
            try {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' start amount: ' + data.amount + ' fee ' + i)
                const estMinNetworkFee = calculateFeeKb(
                     xmrParams.feePerKB,
                    13,
                    multiplyFeePriority(i)
                )
                xmrParams.networkFee = estMinNetworkFee
                xmrParams.simplePriority = i

                const estTx = await getRestOfTxData(
                    xmrParams,
                    selectOutputsAndAmountForMixin
                )

                fee[i] = estTx.newFee.toString()

                res.push({
                    langMsg: 'xmr_speed_' + i,
                    feeForTx: fee[i],
                    simplePriority: i,
                    estMinNetworkFee,
                    estTx
                })
            } catch (e) {
                if (e.message === 'NOT ENOUGHT BALANCE') {
                    // do nothing
                } else {
                    BlocksoftCryptoLog.err(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' error fee ' + i + ': ' + e.message)
                    throw e
                }
            }
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' fee: ', fee)
        return res
    }

    /**
     * @param {Object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.memo
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {

    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.data
     * @param {string} data.memo
     * @param {string} data.privateKey
     * @param {*} data.feeForTx
     * @param {BigInteger} data.feeForTx.estMinNetworkFee
     * @param {*} data.feeForTx.estTx
     * @param {*} data.feeForTx.estTx.mixOuts
     * @param {*} data.feeForTx.estTx.fundTargets
     * @param {*} data.feeForTx.estTx.newFee
     * @param {*} data.feeForTx.estTx.usingOuts
     * @param {string} data.feeForTx.feeForTx "160612352"
     * @param {string} data.feeForTx.langMsg "xmr_speed_1"
     * @param {string} data.feeForTx.simplePriority 1
     * @param {*} data.jsonData
     * @param {string} data.jsonData.publicSpendKey
     * @param {string} data.jsonData.publicViewKey
     */
    async sendTx(data) {

        try {
            if (typeof data.privateKey === 'undefined') {
                throw new Error('XMR transaction required privateKey')
            }
            if (typeof data.addressTo === 'undefined') {
                throw new Error('XMR transaction required addressTo')
            }

            if (typeof data.feeForTx === 'undefined' || !data.feeForTx || typeof data.feeForTx.simplePriority === 'undefined') {
                const fees = await this.getFeeRate(data)
                data.feeForTx = fees[fees.length - 1]
            }


            BlocksoftCryptoLog.log('XMRTransferProcessor.sendTx started')

            const xmrParams = await this._buildTx(data, true)
            xmrParams.networkFee = data.feeForTx.estMinNetworkFee
            xmrParams.simplePriority = data.feeForTx.simplePriority
            xmrParams.mixOuts = data.feeForTx.estTx.mixOuts
            xmrParams.fundTargets = data.feeForTx.estTx.fundTargets
            xmrParams.newFee = data.feeForTx.estTx.newFee
            xmrParams.usingOuts = data.feeForTx.estTx.usingOuts
            xmrParams.pid = await rand_32()
            console.log('xmrParams', xmrParams)

            const rawTx = await constructTx(xmrParams)
            console.log('rawTx', rawTx)

            const keys = data.privateKey.split('_')
            const privViewKey = keys[1]

            const send = await this.sendProvider.send({
                address: data.addressFrom,
                tx: rawTx.serializedSignedTx,
                privViewKey
            })
            console.log('send', send)
        } catch (e) {
            console.log(e)
            throw e
        }
    }


}
