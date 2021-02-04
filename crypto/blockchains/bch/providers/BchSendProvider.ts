/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import DogeSendProvider from '../../doge/providers/DogeSendProvider'

export default class BchSendProvider extends DogeSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    _apiPath = 'https://rest.bitcoin.com/v2/rawtransactions/sendRawTransaction/'

    async sendTx(hex: string, subtitle: string, txRBF : any, logData : any): Promise<{ transactionHash: string, transactionJson: any }> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BchSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        try {
            const trezor = await super.sendTx(hex, subtitle, txRBF, logData)
            if (trezor) {
                return trezor
            }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                throw e
            } else {
                // do nothing
            }
        }

        let res
        try {
            res = await BlocksoftAxios.get(this._apiPath + hex)
        } catch (e) {
            if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }
        }
        if (typeof res.data === 'undefined' || !res.data) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return { transactionHash: res.data, transactionJson: {} }
    }
}

