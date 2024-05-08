/**
 * @version 0.52
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import SolScannerProcessor from '@crypto/blockchains/sol/SolScannerProcessor'
import config from "@app/config/config";

const CACHE_BALANCES = {}
const CACHE_VALID_TIME = 30000 // 30 seconds

export default class SolScannerProcessorSpl extends SolScannerProcessor {

    /**
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     * https://solana.com/docs/rpc/http/gettokenaccountsbyowner
     */
    async getBalanceBlockchain(address) {
        address = address.trim()

        const now = new Date().getTime()
        let balance = 0
        try {
            if (typeof CACHE_BALANCES[address] === 'undefined' || typeof CACHE_BALANCES[address].time === 'undefined' || (now - CACHE_BALANCES[address].time < CACHE_VALID_TIME)) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessorSpl getBalanceBlockchain actual scan address ' + address)
                CACHE_BALANCES[address] = {}
                const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')

                const data = {
                    'jsonrpc': '2.0',
                    'id': 1,
                    'method': 'getTokenAccountsByOwner',
                    'params': [
                        address,
                        {
                            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
                        },
                        { encoding: 'jsonParsed' }
                    ]
                }

                const res = await BlocksoftAxios._request(apiPath, 'POST', data)
                if (typeof res.data.result === 'undefined' || typeof res.data.result.value === 'undefined') {
                    return false
                }
                for (const account of res.data.result.value) {
                    if (typeof account.account === 'undefined') continue
                    if (typeof account.account.data.program === 'undefined' || account.account.data.program !== 'spl-token') continue
                    const parsed = account.account.data.parsed.info
                    if (typeof parsed.mint === 'undefined') continue
                    CACHE_BALANCES[address][parsed.mint] = parsed?.tokenAmount // "amount": "1606300", "decimals": 6, "uiAmount": 1.6063, "uiAmountString": "1.6063"
                }
                CACHE_BALANCES[address].time = now
            }
            if (typeof CACHE_BALANCES[address][this.tokenAddress] === 'undefined' || typeof CACHE_BALANCES[address][this.tokenAddress].amount === 'undefined') {
                balance = 0
            } else {
                balance = CACHE_BALANCES[address][this.tokenAddress].amount * 1
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' SolScannerProcessorSpl getBalanceBlockchain address ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessorSpl getBalanceBlockchain address ' + address + ' error ' + e.message)
            return false
        }
        return { balance, unconfirmed: 0, provider: 'solana-api' }
    }
    async getTransactionsBlockchain(scanData, source) {
        return this._getTransactionsBlockchainInner(scanData, source, this.tokenAddress)
    }
    async _unifyTransaction(address, transaction) {
        return this._unifyTransactionInner(address, transaction, this.tokenAddress)
    }
}
