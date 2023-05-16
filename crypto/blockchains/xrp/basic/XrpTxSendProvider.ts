/**
 * @version 0.20
 * https://gist.github.com/WietseWind/19df307c3c68748543971242284ade4d
 *
 * https://xrpl.org/rippleapi-reference.html#preparepayment
 * https://xrpl.org/rippleapi-reference.html#sign
 * https://xrpl.org/rippleapi-reference.html#submit
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'

import { XrpTxUtils } from './XrpTxUtils'

import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'
import config from '../../../../app/config/config'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'

const PROXY_PREP = 'https://proxy.trustee.deals/xrp/getPrep'
const PROXY_SEND = 'https://proxy.trustee.deals/xrp/sendTx'
const RippleAPI = require('ripple-lib').RippleAPI
export class XrpTxSendProvider {

    private readonly _api: typeof RippleAPI

    constructor() {
        this._api = new RippleAPI({ server: BlocksoftExternalSettings.getStatic('XRP_SERVER') }) // Public rippled server
        this._api.on('error', (errorCode: string, errorMessage: string) => {
            BlocksoftCryptoLog.log('XrpTransferProcessor constructor' + errorCode + ': ' + errorMessage)
        })
        this._api.on('connected', () => {
        })
        this._api.on('disconnected', () => {

        })
    }

    async getPrepared(data: BlocksoftBlockchainTypes.TransferData, toObject = true) {

        const payment = {
            'source': {
                'address': data.addressFrom,
                'maxAmount': {
                    'value': XrpTxUtils.amountPrep(data.amount),
                    'currency': 'XRP'
                }
            },
            'destination': {
                'address': data.addressTo,
                'amount': {
                    'value': XrpTxUtils.amountPrep(data.amount),
                    'currency': 'XRP'
                }
            }
        }

        if (data.addressFrom === data.addressTo) {
            throw new Error('SERVER_RESPONSE_SELF_TX_FORBIDDEN')
        }

        try {
            if (typeof data.memo !== 'undefined' && data.memo && data.memo.toString().trim().length > 0) {
                // @ts-ignore
                const int = data.memo.toString().trim() * 1
                if (int.toString() !== data.memo) {
                    throw new Error('Destination tag type validation error')
                }
                if (int > 4294967295) {
                    throw new Error('Destination tag couldnt be more then 4294967295')
                }
                // @ts-ignore
                payment.destination.tag = int
            }
        } catch (e) {
            // @ts-ignore
            BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared memo error ' + e.message, data)
        }
        // @ts-ignore
        BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared payment', payment)

        let res = false
        try {
            res = await BlocksoftAxios.post(PROXY_PREP, { data, payment })
            if (typeof res.data === 'undefined') {
                throw new Error('no data')
            }
            if (typeof res.data.msg !== 'undefined') {
                throw new Error('XRP prep error ' + res.data.msg)
            }
            return res.data.res
        } catch (e) {
            BlocksoftCryptoLog.log('XrpTxSendProvider._getPrepared error ' + e.toString())
            throw e
        }
        return false
    }

    signTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, txJson: any): Promise<string> {
        const api = this._api
        const keypair = {
            privateKey: privateData.privateKey,
            publicKey: data.accountJson.publicKey.toUpperCase()
        }
        try {
            const signed = api.sign(JSON.stringify(txJson), keypair)
            return signed.signedTransaction
        } catch (e) {
            throw new Error(e.message + ' while signTx')
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, txJson: any): Promise<{
        resultCode: string,
        resultMessage: string,
        // eslint-disable-next-line camelcase
        tx_json?: {
            hash: string
        }
    }> {
        let result
        try {
            const signed = this.signTx(data, privateData, txJson)
            BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx signed', signed)

            const res= await BlocksoftAxios.post(PROXY_SEND, { data, signed})
            if (typeof res.data === 'undefined') {
                throw new Error('no data')
            }
            if (typeof res.data.msg !== 'undefined') {
                throw new Error('XRP SEND error ' + res.data.msg)
            }
            result = res.data.res
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('XrpTransferProcessor.sendTx error ', e)
            }
            MarketingEvent.logOnlyRealTime('v30_rippled_send2_error', {
                title: data.addressFrom + ' => ' + data.addressTo,
                txJson,
                msg: e.toString()
            })
            BlocksoftCryptoLog.log('XrpTransferProcessor.send2 error ' + e.toString())
            if (typeof e.resultMessage !== 'undefined') {
                throw new Error(e.resultMessage.toString())
            } else if (typeof e.message !== 'undefined') {
                throw new Error(e.message.toString())
            } else {
                throw new Error(e.toString())
            }
        }
        // @ts-ignore
        return result
    }
}
