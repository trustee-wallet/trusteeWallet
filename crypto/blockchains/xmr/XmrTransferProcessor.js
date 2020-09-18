/**
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import MoneroUtilsParser from './ext/MoneroUtilsParser'
import XmrSendProvider from './providers/XmrSendProvider'
import XmrUnspentsProvider from './providers/XmrUnspentsProvider'

const CACHE = {}
export default class XmrTransferProcessor {

    constructor(settings) {
        this._settings = settings
        this.sendProvider = new XmrSendProvider(settings)
        this.unspentsProvider = new XmrUnspentsProvider(settings)
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        return false
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

        if (typeof data.jsonData === 'undefined' || !data.jsonData || typeof data.jsonData.publicSpendKey === 'undefined') {
            throw new Error('XmrTransferProcessor public spend key is required')
        }
        const keys = data.privateKey.split('_')
        const privSpendKey = keys[0]
        const privViewKey = keys[1]
        const pubSpendKey = data.jsonData.publicSpendKey

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' started amount: ' + data.amount)

        const apiClient = this.unspentsProvider
        let core = await MoneroUtilsParser.getCore()
        if (!core || typeof core === 'undefined') {
            core = await MoneroUtilsParser.getCore()
        }

        // 1: "Low", 2: "Medium", 3: "High", 4: "Very High"
        const fee = []
        const res = []
        let noBalanceError = false
        for (let i = 1; i <= 4; i++) {
            try {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' start amount: ' + data.amount + ' fee ' + i)

                fee[i] = await new Promise((resolve, reject) => {
                    core.async__send_funds({
                        is_sweeping: false,
                        payment_id_string: undefined, // may be nil or undefined
                        sending_amount: data.amount, // sending amount
                        from_address_string: data.addressFrom,
                        sec_viewKey_string: privViewKey,
                        sec_spendKey_string: privSpendKey,
                        pub_spendKey_string: pubSpendKey,
                        to_address_string: data.addressTo,
                        priority: i,
                        unlock_time: 0, // unlock_time
                        nettype: 0, // MAINNET
                        get_unspent_outs_fn: function(req_params, cb) {
                            apiClient._getUnspents(req_params, function(err_msg, res) {
                                cb(err_msg, res)
                            })
                        },
                        get_random_outs_fn: function(req_params, cb) {
                            apiClient._getRandomOutputs(req_params, function(err_msg, res) {
                                cb(err_msg, res)
                            })
                        },
                        submit_raw_tx_fn: function(req_params, cb) {
                            cb(null)
                        },
                        //
                        status_update_fn: function(params) {
                            // BlocksoftCryptoLog.log('> Send funds priority ' + i + ' step ' + params.code + ': ')
                        },
                        error_fn: function(params) {
                            reject(new Error('XmrTransferProcessor getFee ' + i + ' err: ' + params.err_msg))
                        },
                        success_fn: function(params) {
                            BlocksoftCryptoLog.log('XmrTransferProcessor getFee ' + i + ' success: ', params)
                            resolve(params)
                        }
                    })
                })

                if (typeof fee[i] !== 'undefined') {
                    res.push({
                        langMsg: 'xmr_speed_' + i,
                        feeForTx: fee[i].used_fee,
                        rawTxHex: fee[i].serialized_signed_tx,
                        rawTxHash: fee[i].tx_hash,
                        simplePriority: i
                    })
                }
            } catch (e) {
                BlocksoftCryptoLog.log('e', e)
                if (e.message.indexOf('decode address') !== -1) {
                    BlocksoftCryptoLog.log('will go out')
                    throw new Error('SERVER_RESPONSE_BAD_DESTINATION')
                } else if (e.message.indexOf('pendable balance too low') !== -1) {
                    // do nothing
                    noBalanceError = true
                    break
                } else {
                    BlocksoftCryptoLog.err(this._settings.currencyCode + ' XmrTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount + ' error fee ' + i + ': ' + e.message)
                    throw e
                }
            }
        }
        if (res.length === 0 && noBalanceError) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
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
        const fees = await this.getFeeRate(data, { onlyMax: true })
        data.feeForTx = fees[fees.length - 1]

        if (balanceRaw) return BlocksoftUtils.diff(balanceRaw, data.feeForTx.feeForTx)
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

        const balanceProvider = Dispatcher.getScannerProcessor(this._settings)
        const current = await balanceProvider.getBalanceBlockchain(data.addressFrom)

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + current.balance)
        return BlocksoftUtils.diff(current.balance, data.feeForTx.feeForTx)
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
     * @param {string} data.feeForTx.feeForTx
     * @param {string} data.feeForTx.langMsg
     * @param {string} data.feeForTx.simplePriority
     * @param {string} data.feeForTx.rawTxHex
     * @param {string} data.feeForTx.rawTxHash
     * @param {*} data.jsonData
     * @param {string} data.jsonData.publicSpendKey
     * @param {string} data.jsonData.publicViewKey
     */
    async sendTx(data) {

        if (typeof data.privateKey === 'undefined') {
            throw new Error('XMR transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('XMR transaction required addressTo')
        }

        if (typeof data.feeForTx === 'undefined' || !data.feeForTx || typeof data.feeForTx.simplePriority === 'undefined' || typeof data.feeForTx.rawTxHex === 'undefined') {
            const fees = await this.getFeeRate(data)
            data.feeForTx = fees[fees.length - 1]
        }

        BlocksoftCryptoLog.log('XmrTransferProcessor.sendTx started')

        const keys = data.privateKey.split('_')
        const privViewKey = keys[1]

        const send = await this.sendProvider.send({
            address: data.addressFrom,
            tx: data.feeForTx.rawTxHex,
            privViewKey
        })

        if (send.status === 'OK') {
            return { hash: data.feeForTx.rawTxHash }
        } else {
            throw new Error('XmrTransferProcessor.sendTx status error ' + JSON.stringify(send))
        }
    }


}
