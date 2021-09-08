/**
 * @version 0.52
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import SolScannerProcessor from '@crypto/blockchains/sol/SolScannerProcessor'

const CACHE_BALANCES = {}
const CACHE_VALID_TIME = 30000 // 30 seconds

export default class SolScannerProcessorSpl extends SolScannerProcessor {

    /**
     * @param {string} address
     * @return {Promise<{balance, provider}>}
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessorSpl getBalanceBlockchain address ' + address)

        const now = new Date().getTime()
        let balance = 0
        try {
            if (typeof CACHE_BALANCES[address] === 'undefined' || typeof CACHE_BALANCES[address].time === 'undefined' || (now - CACHE_BALANCES[address].time < CACHE_VALID_TIME)) {
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
                        { encoding: 'jsonParsed', commitment: 'processed' }
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
                    if (typeof parsed.state === 'undefined' && parsed.state !== 'initialized') continue
                    CACHE_BALANCES[address][parsed.mint] = parsed.tokenAmount // "amount": "1606300", "decimals": 6, "uiAmount": 1.6063, "uiAmountString": "1.6063"
                }
                CACHE_BALANCES[address].time = now
            }
            if (typeof CACHE_BALANCES[address][this.tokenAddress] === 'undefined' || typeof CACHE_BALANCES[address][this.tokenAddress].amount === 'undefined') {
                balance = 0
            } else {
                balance = CACHE_BALANCES[address][this.tokenAddress].amount * 1
            }
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolScannerProcessorSpl getBalanceBlockchain address ' + address + ' error ' + e.message)
            return false
        }
        return { balance, unconfirmed: 0, provider: 'solana-api' }
    }
}
