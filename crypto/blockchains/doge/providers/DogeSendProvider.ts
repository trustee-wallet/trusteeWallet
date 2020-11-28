/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import config from '../../../../app/config/config'


export default class DogeSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    private _trezorServerCode: string = ''

    private _trezorServer: string = ''

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    async sendTx(hex: string, subtitle: string) : Promise<{transactionHash: string, transactionJson:any}> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'DOGE.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'
        let res
        try {
            res = await BlocksoftAxios.post(link, hex)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.sendTx error ', e)
            }
            if (subtitle.indexOf('rawSend') !== -1) {
                throw e
            }
            if (this._settings.currencyCode === 'USDT' && e.message.indexOf('bad-txns-in-belowout') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            } else if (e.message.indexOf('transaction already in block') !== -1) {
                throw new Error('SERVER_RESPONSE_TRANSACTION_ALREADY_MINED')
            } else if (e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE_OR_MORE_FEE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient fee, rejecting replacement') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
            } else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        return { transactionHash: res.data.result, transactionJson: {} }
    }
}

