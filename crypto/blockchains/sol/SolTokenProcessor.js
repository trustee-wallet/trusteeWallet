/**
 * @version 0.52
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

export default class SolTokenProcessor {

    /**
     * @param {string} tokenAddress
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: *, description: *, tokenType: string, currencyCode: *}|boolean>}
     */
    async getTokenDetails(tokenAddress) {
        const link = await BlocksoftExternalSettings.get('SOL_TOKENS_LIST')
        const res = await BlocksoftAxios.get(link)
        if (!res || typeof res.data.tokens === 'undefined' || !res.data.tokens) {
            return false
        }

        let tmp = false
        for (const token of res.data.tokens) {
            if (token.address === tokenAddress) {
                if (token.chainId !== 101) continue
                tmp = token
                break
            }
        }
        if (tmp) {


            return {
                currencyCodePrefix: 'CUSTOM_SOL_',
                currencyCode: tmp.symbol,
                currencyName: tmp.name,
                tokenType: 'SOL',
                tokenAddress: tokenAddress,
                tokenDecimals: tmp.decimals,
                icon: tmp.logoURI,
                description: tmp.website,
                coingeckoId: tmp.coingeckoId,
                provider: 'sol'
            }
        }


        let decimals = 6
        try {
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const data = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getAccountInfo',
                'params': [
                    tokenAddress,
                    {
                        'encoding': 'jsonParsed'
                    }
                ]
            }
            const res = await BlocksoftAxios._request(apiPath, 'POST', data)
            if (typeof res.data.result === 'undefined' || typeof res.data.result.value === 'undefined') {
                return false
            }
            if (typeof res.data.result.value.owner === 'undefined' || res.data.result.value.owner !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                return false
            }
            if (typeof res.data.result.value.data.program === 'undefined' || res.data.result.value.data.program !== 'spl-token') {
                return false
            }
            decimals = res.data.result.value.data.parsed.info.decimals

        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' SolTokenProcessor getTokenDetails tokenAddress ' + tokenAddress + ' error ' + e.message)
            return false
        }

        return {
            currencyCodePrefix: 'CUSTOM_SOL_',
            currencyCode: 'UNKNOWN_TOKEN_' + tokenAddress,
            currencySymbol: 'UNKNOWN',
            currencyName: tokenAddress,
            tokenType: 'SOL',
            tokenAddress: tokenAddress,
            tokenDecimals: decimals,
            provider: 'sol'
        }
    }
}
