/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthTransferProcessor from './EthTransferProcessor'
import BlocksoftUtils from '../../common/BlocksoftUtils'

const abi = require('./ext/erc20.js')

export default class EthTransferProcessorErc20 extends EthTransferProcessor {

    constructor(settings) {
        super(settings)
        // noinspection JSUnresolvedVariable
        this._token = new this._web3.eth.Contract(abi.ERC20, settings.tokenAddress)
        this._tokenAddress = settings.tokenAddress
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
        let tmpData = {...data}
        let logData = { tokenAddress: this._tokenAddress, addressTo: data.addressTo, amount: data.amount, addressFrom: data.addressFrom }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas started', logData)
        let estimatedGas
        if (data.addressTo === data.addressFrom) {
            let tmp1 = '0xA09fe17Cb49D7c8A7858C8F9fCac954f82a9f487'
            let tmp2 = '0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'
            BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas addressToChanged', logData)
            estimatedGas = await this._token.methods.transfer(data.addressFrom === tmp1 ? tmp2 : tmp1, data.amount).estimateGas({ from: data.addressFrom })
        } else {
            estimatedGas = await this._token.methods.transfer(data.addressTo, data.amount).estimateGas({ from: data.addressFrom })
        }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas finished', estimatedGas)
        return super.getFeeRate(tmpData, estimatedGas)
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        if (balanceRaw) return balanceRaw
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        let balance = await this._token.methods.balanceOf(data.addressFrom).call()
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
        return balance
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
        let tmpData = {...data}
        let logData = { tokenAddress: this._tokenAddress, addressTo: data.addressTo, amount: data.amount, addressFrom: data.addressFrom }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 encodeABI started', logData)
        tmpData.data = this._token.methods.transfer(data.addressTo, data.amount).encodeABI()
        BlocksoftCryptoLog.log('EthTxProcessorErc20 encodeABI finished', tmpData.data)
        tmpData.amount = 0
        tmpData.addressTo = this._tokenAddress
        return super.sendTx(tmpData)
    }
}
