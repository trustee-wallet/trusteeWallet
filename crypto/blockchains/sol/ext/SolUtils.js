/**
 * @version 0.52
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import { PublicKey } from '@solana/web3.js/src/index'
import { Account } from '@solana/web3.js/src/account'

import config from '@app/config/config'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
const OWNER_VALIDATION_PROGRAM_ID = '4MNPdKu9wFMvEeZBMt3Eipfs5ovVWTJb31pEXDJAAxX5'

export default {

    getTokenProgramID() {
        return TOKEN_PROGRAM_ID
    },

    getOwnerValidationProgramId() {
        return OWNER_VALIDATION_PROGRAM_ID
    },

    getAssociatedTokenProgramId() {
        return ASSOCIATED_TOKEN_PROGRAM_ID
    },

    async findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        try {
            const seeds = [
                new PublicKey(walletAddress).toBuffer(),
                new PublicKey(TOKEN_PROGRAM_ID).toBuffer(),
                new PublicKey(tokenMintAddress).toBuffer()
            ]
            const res =
                await PublicKey.findProgramAddress(
                    seeds,
                    new PublicKey(
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                )
            return res[0].toBase58()
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SolUtils.findAssociatedTokenAddress ' + e.message)
            }
            throw new Error('SYSTEM_ERROR')
        }
    },

    async getAccountInfo(address) {
        let accountInfo = false
        try {

            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const checkData = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getAccountInfo',
                'params': [
                    address,
                    {
                        'encoding': 'jsonParsed'
                    }
                ]
            }
            const res = await BlocksoftAxios._request(apiPath, 'POST', checkData)
            accountInfo = res.data.result.value
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SolUtils.getAccountInfo ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log('SolUtils.getAccountInfo ' + address + ' error ' + e.message)
        }
        return accountInfo
    },

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
                    encoding: 'base64'
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
