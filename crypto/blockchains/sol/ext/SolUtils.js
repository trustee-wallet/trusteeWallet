/**
 * @version 0.43
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import { PublicKey } from '@solana/web3.js/src/index'
import { Account } from '@solana/web3.js'

export default {

    isAddressValid(value) {
        new PublicKey(value)
        return true
    },

    /**
     * https://docs.solana.com/developing/clients/jsonrpc-api#sendtransaction
     * @param raw
     * @returns {Promise<string>}
     */
    async sendTransaction(raw) {
        const sendData = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'sendTransaction',
            'params': [
                raw,
                {
                    encoding : 'base64'
                }
            ]
        }
        const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
        const sendRes = await BlocksoftAxios._request(apiPath, 'POST', sendData)
        if (!sendRes || typeof sendRes.data === 'undefined') {
            throw new Error('SERVER_RESPONSE_BAD_INTERNET')
        }
        if (typeof sendRes.data.error !== 'undefined' && typeof sendRes.data.error.message !== 'undefined') {
            throw new Error(sendRes.data.error.message)
        }
        return sendRes.data.result
    },

    /**
     * @returns {Promise<{blockhash: string, feeCalculator: {lamportsPerSignature: number}}>}
     */
    async getBlockData() {
        const getRecentBlockhashData = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'getRecentBlockhash'
        }
        const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
        const getRecentBlockhashRes = await BlocksoftAxios._request(apiPath, 'POST', getRecentBlockhashData)
        return getRecentBlockhashRes.data.result.value
    },

    async signTransaction(transaction, walletPrivKey, walletPubKey) {

        let account = false
        try {
            account = new Account(Buffer.from(walletPrivKey, 'hex'))
        } catch (e) {
            e.message += ' while create account'
            throw e
        }

        try {
            const data = await this.getBlockData()
            transaction.recentBlockhash = data.blockhash
        } catch (e) {
            e.message += ' while getBlockData'
            throw e
        }
        try {
            transaction.setSigners(
                new PublicKey(walletPubKey)
            )
        } catch (e) {
            e.message += ' while setSigners'
            throw e
        }

        try {
            transaction.partialSign(account)
        } catch (e) {
            e.message += ' while transaction.partialSign with account'
            throw e
        }

        return transaction
    }
}
