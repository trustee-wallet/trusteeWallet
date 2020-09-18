/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthTransferProcessor from './EthTransferProcessor'
import BlocksoftDispatcher from '../BlocksoftDispatcher'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const Dispatcher = new BlocksoftDispatcher()

const abi = require('./ext/erc20.js')

export default class EthTransferProcessorErc20 extends EthTransferProcessor {
    /**
     * @type {boolean}
     * @private
     */
    _checkBalance = false

    constructor(settings) {
        super(settings)
        // noinspection JSUnresolvedVariable
        this._token = new this._web3.eth.Contract(abi.ERC20, settings.tokenAddress)
        this._tokenAddress = settings.tokenAddress.toLowerCase()
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
        const logData = {
            tokenAddress: this._tokenAddress,
            addressTo: data.addressTo,
            amount: data.amount,
            addressFrom: data.addressFrom
        }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas started', logData)
        let estimatedGas

        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            let firstAddressTo = basicAddressTo
            let eventTitle = 'eth_gas_limit_token1 '
            if (basicAddressTo === data.addressFrom.toLowerCase()) {
                const tmp1 = '0xA09fe17Cb49D7c8A7858C8F9fCac954f82a9f487'
                const tmp2 = '0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'
                firstAddressTo = data.addressFrom === tmp1 ? tmp2 : tmp1
                BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas addressToChanged', logData)
                eventTitle = 'eth_gas_limit_token2 '
            }

            let serverEstimatedGas = 0
            let serverEstimatedGas2 = 0
            let serverEstimatedGas3 = 0
            try {
                serverEstimatedGas = await this._token.methods.transfer(firstAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check1 ' + data.amount
                throw e
            }
            try {
                serverEstimatedGas2 = await this._token.methods.transfer(basicAddressTo, data.amount).estimateGas({ from: data.addressFrom })
            } catch (e) {
                e.message += ' while transfer check2 ' + data.amount
                throw e
            }
            const tmp3 = data.amount * 1
            try {
                serverEstimatedGas3 = await this._token.methods.transfer(basicAddressTo, tmp3).estimateGas({ from: data.addressFrom })
            } catch (e) {
                // do nothing
            }


            if (serverEstimatedGas2 > serverEstimatedGas) {
                estimatedGas = serverEstimatedGas2
            } else {
                estimatedGas = serverEstimatedGas
            }
            if (estimatedGas < serverEstimatedGas3) {
                estimatedGas = serverEstimatedGas3
            }
            if (estimatedGas < 70200) {
                estimatedGas = 70200
            }
            MarketingEvent.logOnlyRealTime(eventTitle + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo,
                {
                    amount: data.amount + '',
                    estimatedGas,
                    serverEstimatedGas,
                    serverEstimatedGas2,
                    serverEstimatedGas3
                })

        } catch (e) {
            this.checkError(e, logData)
        }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 estimateGas finished', estimatedGas)
        return super.getFeeRate(tmpData, estimatedGas)
    }

    async checkTransferHasError(data) {
        const balanceProvider = Dispatcher.getScannerProcessor('ETH')
        const basicAddressTo = data.addressTo.toLowerCase()
        const balanceRaw = await balanceProvider.getBalanceBlockchain(basicAddressTo)
        if (balanceRaw && typeof balanceRaw.balance !== 'undefined' && balanceRaw.balance > 0) {
            return false
        } else {
            return { code: 'TOKEN', parentBlockchain: 'Ethereum', parentCurrency: 'ETH' }
        }
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
        if (balanceRaw) return balanceRaw
        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        try {
            const balance = await this._token.methods.balanceOf(data.addressFrom).call()
            BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + balance)
            return balance
        } catch (e) {
            this.checkError(e, data)
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
        const tmpData = { ...data }
        const logData = {
            tokenAddress: this._tokenAddress,
            addressTo: data.addressTo,
            amount: data.amount,
            addressFrom: data.addressFrom
        }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 encodeABI started', logData)
        try {
            const basicAddressTo = data.addressTo.toLowerCase()
            tmpData.data = this._token.methods.transfer(basicAddressTo, data.amount).encodeABI()
        } catch (e) {
            this.checkError(e, logData)
        }
        BlocksoftCryptoLog.log('EthTxProcessorErc20 encodeABI finished', tmpData.data)
        tmpData.amount = 0
        tmpData.addressTo = this._tokenAddress
        return super.sendTx(tmpData, true)
    }
}
