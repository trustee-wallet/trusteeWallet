/**
 * @version 0.20
 * https://www.bitindex.network/docs.html
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import DogeSendProvider from '../../doge/providers/DogeSendProvider'
import config from '../../../../app/config/config'

export default class BsvSendProvider extends DogeSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    private _apiPath = 'https://api.bitindex.network/api/v2/tx/send'

    async sendTx(hex: string, subtitle: string, txRBF : any, logData : any) : Promise<{transactionHash: string, transactionJson:any}> {
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvSendProvider.sendTx ' + subtitle + ' started ', logData)

        logData = await this._check(hex, subtitle, txRBF, logData)

        let res
        try {
            res = await BlocksoftAxios.post(this._apiPath, { hex: hex })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BsvSendProvider.sendTx error ', e)
            }
            try {
                logData.error = e.message
                await this._checkError(hex, subtitle, txRBF, logData)
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' BsvSendProvider.send proxy error errorTx ' + e.message)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvSendProvider.send proxy error errorTx ' + e2.message)
            }
            if (e.message.indexOf('transaction already in the mempool') !== -1 || e.message.indexOf('TXN-MEMPOOL-CONFLICT')) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        let txid = false
        if (typeof res.data === 'undefined' || !res.data) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (typeof res.data !== 'undefined' && typeof res.data.txid !== 'undefined') {
            txid = res.data.txid
        }
        if (typeof res.data.data !== 'undefined') {
            if (typeof res.data.data.txid !== 'undefined') {
                txid = res.data.data.txid
            }
            if (typeof res.data.data.result !== 'undefined' && typeof res.data.data.result.txid !== 'undefined') {
                txid = res.data.data.result.txid
            }
        }
        if (!txid) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BsvSendProvider.send no txid', res.data)
            }
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        logData = await this._checkSuccess(txid, hex, subtitle, txRBF, logData)

        return {transactionHash : txid, transactionJson: {}, logData }
    }
}

