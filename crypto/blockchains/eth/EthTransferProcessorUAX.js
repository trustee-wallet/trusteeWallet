/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthTransferProcessorErc20 from './EthTransferProcessorErc20'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import KunaRates from '../../../app/services/Rate/providers/KunaRates'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const axios = require('axios')
const ethUtil = require('ethereumjs-util')

const FEES_PATH = 'https://api.xreserve.fund/fee'
const NONCE_PATH = 'https://api.xreserve.fund/nonce?address='
const POST_PATH = 'https://api.xreserve.fund/delegate-transfer'



const DELEGATED_ADDRESS = '0x8826a55c94915870aceed4ea9f1186678fcbdaf6'


const CACHE_VALID_TIME = 60000 // 1 minute
const MIN_FEE = 1000

let CACHE_FEES_TIME  = 0
let CACHE_FEES_VALUE = 0
let CACHE_FEES_RATE  = 0

const CACHE_SEND_ALL = {}

const Rates = new KunaRates()

export default class EthTransferProcessorUAX extends EthTransferProcessorErc20 {
    /**
     * @type {boolean}
     * @private
     */
    _checkBalance = false

    async _loadDelegatedFee() {
        const now = new Date().getTime()
        if (now - CACHE_FEES_TIME <= CACHE_VALID_TIME) return false
        const delegated = await BlocksoftAxios.getWithoutBraking(FEES_PATH)
        if (delegated && typeof delegated.data !== 'undefined' && typeof delegated.data.fee !== 'undefined') {
            const tmp = delegated.data.fee
            if (tmp > 0) {
                CACHE_FEES_VALUE = tmp
                CACHE_FEES_RATE = {
                    uah: await Rates.getRate({ currencyCode: 'uah' }),
                    eth: await Rates.getRate({ currencyCode: 'eth' })
                }
                CACHE_FEES_TIME = now
            }
        }
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @return {Promise<{feeForTx, langMsg, gasPrice, gasLimit}[]>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        const tmpData = { ...data }
        const logData = { tokenAddress: this._tokenAddress, addressTo: data.addressTo, amount: data.amount, addressFrom: data.addressFrom }
        BlocksoftCryptoLog.log('EthTxProcessorUAX getFeeRate started', logData)

        let fees = []
        const balanceETH = await this._web3.eth.getBalance(data.addressFrom)
        const balanceUAX = await this._token.methods.balanceOf(data.addressFrom).call()
        BlocksoftCryptoLog.log('EthTxProcessorUAX balances', { balanceETH, balanceUAX })
        if (balanceETH > MIN_FEE) {
            let estimatedGas
            if (data.addressTo === data.addressFrom) {
                const tmp1 = '0xA09fe17Cb49D7c8A7858C8F9fCac954f82a9f487'
                const tmp2 = '0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'
                BlocksoftCryptoLog.log('EthTxProcessorUAX estimateGas addressToChanged', logData)
                estimatedGas = await this._token.methods.transfer(data.addressFrom === tmp1 ? tmp2 : tmp1, data.amount).estimateGas({ from: data.addressFrom })
            } else {
                estimatedGas = await this._token.methods.transfer(data.addressTo, data.amount).estimateGas({ from: data.addressFrom })
            }
            BlocksoftCryptoLog.log('EthTxProcessorUAX estimateGas finished', estimatedGas)
            fees = await super.getFeeRate(tmpData, estimatedGas)
        }

        if (balanceUAX > 0) {
            await this._loadDelegatedFee()

            if (CACHE_FEES_VALUE && balanceUAX > CACHE_FEES_VALUE) {
                const newFee = {
                    langMsg: 'eth_speed_delegated',
                    feeForTx: 0,
                    feeForTxUsd: CACHE_FEES_VALUE * CACHE_FEES_RATE.uah.amount / 100,
                    feeForTxDelegated: CACHE_FEES_VALUE
                }
                newFee.feeForTx = BlocksoftUtils.toBigNumber(Math.round(newFee.feeForTxUsd * 100000)).mul(BlocksoftUtils.toBigNumber(10000)).div(BlocksoftUtils.toBigNumber(CACHE_FEES_RATE.eth.amount)).toString() + '0000000'
                if (fees.length === 0 || newFee.feeForTx < fees[2].feeForTx) {
                    fees.push(newFee)
                }
            }
        }
        BlocksoftCryptoLog.log('EthTxProcessorUAX getFeeRate finished', fees)
        return fees
    }

    /**
     * @param {Object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        if (!balanceRaw) {
            balanceRaw = await this._token.methods.balanceOf(data.addressFrom).call()
        }
        data.amount = balanceRaw

        const fees = await this.getFeeRate(data)
        if (!fees || fees.length === 0) {
            return 0
        }
        const last = fees[fees.length - 1]
        if (typeof last.feeForTxDelegated === 'undefined') {
            CACHE_SEND_ALL[data.addressFrom] = {
                type : 'ETH',
                amount : balanceRaw
            }
            return balanceRaw
        } else {
            await this._loadDelegatedFee()
            CACHE_SEND_ALL[data.addressFrom] = {
                type : 'DELEGATED',
                amount : balanceRaw - CACHE_FEES_VALUE,
                amountFull : balanceRaw
            }
            return balanceRaw - CACHE_FEES_VALUE
        }
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.feeForTx.gasPrice
     * @param {string} data.feeForTx.gasLimit
     * @param {string} data.feeForTx.feeForTx
     * @param {string} data.amount
     * @param {string} data.data
     */
    async sendTx(data) {

        if (data.amount <= 0) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
        }
        if (data.addressFrom === data.addressTo) {
            throw new Error('SERVER_RESPONSE_SELF_TX_FORBIDDEN')
        }
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForTx === 'undefined') {
            const fees = await this.getFeeRate(data)
            if (fees && fees.length > 0) {
                data.feeForTx = fees[fees.length - 1]
            } else {
                throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            }
        }

        let sendAll = false
        if (typeof data.addressForChange !== 'undefined' && data.addressForChange === 'TRANSFER_ALL' && typeof CACHE_SEND_ALL[data.addressFrom] !== 'undefined') {
            sendAll = CACHE_SEND_ALL[data.addressFrom]
        }

        let hash = false
        if (typeof data.feeForTx.feeForTxDelegated !== 'undefined') {
            let nonce = await BlocksoftAxios.get(NONCE_PATH + data.addressFrom)
            if (!nonce || typeof nonce.data === 'undefined' || typeof nonce.data.nonce === 'undefined') {
                throw new Error('api.xreserve.fund NONCE ERROR')
            }
            nonce = nonce.data.nonce
            const fee = data.feeForTx.feeForTxDelegated

            if (sendAll) {
                BlocksoftCryptoLog.log('EthTxProcessorUAX sendAll with delegated check', sendAll)
                if (sendAll.type === 'ETH' && sendAll.amount === data.amount) {
                    BlocksoftCryptoLog.log('EthTxProcessorUAX sendAll with delegated change amount => amount - fee')
                    data.amount -= fee
                }
            }

            const sigArgs = [
                {type: 'address', value: this._tokenAddress},
                {type: 'address', value: DELEGATED_ADDRESS},
                {type: 'address', value: data.addressTo},
                {type: 'uint256', value: data.amount},
                {type: 'uint256', value: fee},
                {type: 'uint256', value: nonce}
            ]
            let message = this._web3.utils.soliditySha3(...sigArgs)
            if (message.substr(0,2) === '0x') {
                message = message.substr(2)
            }
            let key = data.privateKey
            if (key.substr(0,2) === '0x') {
                key = key.substr(2)
            }
            const messageHex = Buffer.from(message, 'hex')
            BlocksoftCryptoLog.log('UAX message', message)
            const {v, r, s} = ethUtil.ecsign(messageHex, Buffer.from(key, 'hex'))

            const request = JSON.stringify({
                to: data.addressTo,
                value: data.amount*1,
                fee: fee,
                nonce: nonce,
                v: v,
                r: ethUtil.bufferToHex(r),
                s: ethUtil.bufferToHex(s)
            })
            BlocksoftCryptoLog.log('UAX request data', request)

            try {
                const result = await axios.post(POST_PATH, request, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    }
                })
                if (result && result.data) {
                    if (typeof result.data.txid !== 'undefined') {
                        hash = result.data.txid
                        MarketingEvent.logOnlyRealTime('uax_tx_success ' + ' ' + data.addressFrom  + ' => ' + data.addressTo, {amount : data.amount, fee : data.feeForTx})
                    } else if (typeof result.data.message !== 'undefined') {
                        throw new Error(result.data.message)
                    } else {
                        throw new Error(' no tx result ' + JSON.stringify(result.data))
                    }
                } else {
                    throw new Error(' empty response ')
                }
            } catch (e) {
                let tmp = false
                if (typeof e.response === 'undefined' || typeof e.response.data === 'undefined') {
                    // do nothing
                } else if (e.response.data) {
                    if (typeof e.response.data.message !== 'undefined') {
                       tmp = e.response.data.message
                    }
                    e.message = JSON.stringify(e.response.data) + ' ' + e.message
                }

                MarketingEvent.logOnlyRealTime('uax_tx_error ' + ' ' + data.addressFrom  + ' => ' + data.addressTo, {amount : data.amount, fee : data.feeForTx})
                if (tmp) {
                    if (tmp.indexOf('Low customer balance') !== -1) {
                        tmp = 'SERVER_RESPONSE_NOTHING_LEFT_FOR_DELEGATED_FEE'
                    } else {
                        BlocksoftCryptoLog.err('UAX request error2 ' + e.message)
                    }
                    e.message = tmp
                } else {
                    BlocksoftCryptoLog.err('UAX request error1 ' + e.message)
                }
                if (e.message.indexOf('replacement transaction underpriced') !== -1 || e.message.indexOf('insufficient funds for gas') !== -1) {
                    e.message = 'SERVER_RESPONSE_NO_RESPONSE_UAX_USE_ETH'
                }
                throw e
            }

            return {hash}

        } else {

            if (sendAll) {
                BlocksoftCryptoLog.log('EthTxProcessorUAX sendAll with eth check', sendAll)
                if (sendAll.type === 'DELEGATED' && sendAll.amount === data.amount) {
                    BlocksoftCryptoLog.log('EthTxProcessorUAX sendAll with eth change amount => amount + fee')
                    data.amount = sendAll.amountFull
                }
            }

            return super.sendTx(data, true)
        }
    }
}
