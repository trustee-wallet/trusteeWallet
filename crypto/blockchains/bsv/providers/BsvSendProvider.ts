/**
 * @version 0.20
 * https://www.bitindex.network/docs.html
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class BsvSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    _apiPath = 'https://api.bitindex.network/api/v2/tx/send'

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
    }

    async sendTx(hex: string, subtitle: string) : Promise<{transactionHash: string, transactionJson:any}> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        let res
        try {
            res = await BlocksoftAxios.post(this._apiPath, { hex: hex })
        } catch (e) {
            if (e.message.indexOf('transaction already in the mempool') !== -1) {
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
        if (typeof res.data.data !== 'undefined' && typeof res.data.data.txid !== 'undefined') {
            txid = res.data.data.txid
        }
        if (!txid) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return {transactionHash : txid, transactionJson: {} }
    }
}

