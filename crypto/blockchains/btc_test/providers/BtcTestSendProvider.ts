/**
 * @version 0.52
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'

import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import DogeSendProvider from '@crypto/blockchains/doge/providers/DogeSendProvider'
import config from '@app/config/config'

const API_URL = 'https://api.blockchair.com/bitcoin/testnet/push/transaction'

export default class BtcTestSendProvider extends DogeSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    async sendTx(hex: string, subtitle: string, txRBF : any, logData : any) : Promise<{transactionHash: string, transactionJson:any, logData: any}> {
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTestSendProvider.sendTx ' + subtitle + ' started ', logData)

        // logData = await this._check(hex, subtitle, txRBF, logData)

        let res
        try {
            res = await BlocksoftAxios.post(API_URL, {data : hex})
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' BtcTestSendProvider.sendTx error ', e)
            }
            try {
                logData.error = e.message
                // await this._checkError(hex, subtitle, txRBF, logData)
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' BtcTestSendProvider.send proxy error errorTx ' + e.message)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTestSendProvider.send proxy error errorTx ' + e2.message)
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
        let txid = ''
        // @ts-ignore
        if (typeof res.data === 'undefined' || !res.data) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        // @ts-ignore
        if (typeof res.data !== 'undefined' && typeof res.data.txid !== 'undefined') {
            // @ts-ignore
            txid = res.data.txid
        }
        // @ts-ignore
        if (typeof res.data.data !== 'undefined') {
            // @ts-ignore
            if (typeof res.data.data.transaction_hash !== 'undefined') {
                // @ts-ignore
                txid = res.data.data.transaction_hash
            }
        }
        if (txid === '') {
            if (config.debug.cryptoErrors) {
                // @ts-ignore
                console.log(this._settings.currencyCode + ' BtcTestSendProvider.send no txid', res.data)
            }
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        // logData = await this._checkSuccess(txid, hex, subtitle, txRBF, logData)

        return {transactionHash : txid, transactionJson: {}, logData }
    }
}


