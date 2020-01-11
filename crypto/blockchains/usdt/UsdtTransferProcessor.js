/**
 * @version 0.5
 */
import BtcTransferProcessor from '../btc/BtcTransferProcessor'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDispatcher from '../BlocksoftDispatcher'
import BtcUnspentsProvider from '../btc/providers/BtcUnspentsProvider'
import BtcSendProvider from '../btc/providers/BtcSendProvider'
import UsdtTxInputsOutputs from './tx/UsdtTxInputsOutputs'
import UsdtTxBuilder from './tx/UsdtTxBuilder'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const Dispatcher = new BlocksoftDispatcher()

const CACHE_VALID_TIME = 1000

export default class UsdtTransferProcessor extends BtcTransferProcessor {
    /**
     * @type {string}
     * @private
     */
    _trezorServer = 'https://btc1.trezor.io'

    /**
     * @private
     */
    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new BtcUnspentsProvider(this._settings, this._trezorServer)
        this.sendProvider = new BtcSendProvider(this._settings, this._trezorServer)
        this.txPrepareInputsOutputs = new UsdtTxInputsOutputs(this._settings, this._trezorServer)
        this.txBuilder = new UsdtTxBuilder(this._settings, this._trezorServer)
        this._initedProviders = true
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

        let balanceProvider = Dispatcher.getScannerProcessor(this._settings)
        let current = await balanceProvider.getBalance(data.addressFrom)

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + current.balance)
        return current.balance
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
     * @returns {Promise<{correctedAmountFrom: string, hash: string}>}
     */
    async sendTx(data) {
        this._initProviders()
        if (data.replacingTransaction !== 'undefined' && data.replacingTransaction) {
            throw new Error('PLZ CODE BACK REPLACING TX LOGIC')
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTransferProcessor.sendTx ' + data.addressFrom + ' started')

        const now = new Date().getTime()
        if (this._precached.unspentsAddress !== data.addressFrom || !this._precached.blocks_2 || !this._precached.unspents || now - this._precached.time > CACHE_VALID_TIME) {
            await this.getTransferPrecache(data)
        }

        let preparedInputsOutputs = this.txPrepareInputsOutputs.getInputsOutputs(data, this._precached, 'sendTx')
        let logInputsOutputs = this._logInputsOutputs(data, preparedInputsOutputs, this._settings.currencyCode + ' BtcTransferProcessor.sendTx')

        let rawTxHex = await this.txBuilder.getRawTx(data, preparedInputsOutputs)
        let result
        try {
            result = await this.sendProvider.sendTx(rawTxHex, 'usual first try')
        } catch (e) {
            if (typeof e.code !== 'undefined' && e.code === 'ERROR_USER') {
                // can do something here to try more
                logInputsOutputs['error'] = e.basicMessage
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_user_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTransferProcessor.sendTx basicMessage', e.basicMessage)
                throw e
            } else {
                logInputsOutputs['userError'] = e.message
                MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_system_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

                // noinspection JSUndefinedPropertyAssignment
                data.rawTxHex = rawTxHex
                throw e
            }
        }
        if (!result) {
            MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_empty_result ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
            throw new Error('no result')
        }
        //start prepare for next transactions
        this._precached.time = 0

        logInputsOutputs['hash'] = result
        MarketingEvent.logOnlyRealTime('prepared_inputs_outputs_success ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)

        return { hash: result, correctedAmountFrom: preparedInputsOutputs.correctedAmountFrom }
    }
}
