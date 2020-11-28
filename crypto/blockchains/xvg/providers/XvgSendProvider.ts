/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class XvgSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    _apiPath = 'https://api.vergecurrency.network/node/api/XVG/mainnet/tx/send'

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
    }

    async sendTx(hex: string, subtitle: string): Promise<{ transactionHash: string, transactionJson: any }> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgSendProvider.sendTx ' + subtitle + ' started ' + subtitle)
        let res
        try {
            res = await BlocksoftAxios.post(this._apiPath, { rawTx: hex })
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgSendProvider.sendTx ' + subtitle + ' error ' + subtitle + ' ok ' + hex)
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgSendProvider.sendTx ' + subtitle + ' error ' + subtitle + ' ' + e.message + ' ' + hex)
            if (e.message.indexOf('mandatory-script-verify-flag-failed') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else {
                throw e
            }

        }
        if (typeof res.data.txid === 'undefined' || !res.data.txid) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return { transactionHash: res.data.txid, transactionJson: {} }
    }
}

