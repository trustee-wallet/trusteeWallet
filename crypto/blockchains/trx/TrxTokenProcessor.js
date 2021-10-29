/**
 * @version 0.5
 * https://apilist.tronscan.org/api/contract?contract=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
 * [ { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', balance: 7208332710, verify_status: 0, balanceInUsd: 0, trxCount: 758742, date_created: 1555400628000, creator: [Object] } ] }
 */
import BlocksoftAxios from '../../common/BlocksoftAxios'

export default class TrxTokenProcessor {
    constructor() {
        this._tokenTronscanPath20 = 'https://apilist.tronscan.org/api/token_trc20?contract='
        this._tokenTronscanPath10 = 'https://apilist.tronscan.org/api/token?id='
    }

    /**
     * https://apilist.tronscan.org/api/token_trc20?contract=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
     * @param {string} tokenAddress
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: *, description: *, tokenType: string, currencyCode: *}|boolean>}
     */
    async getTokenDetails(tokenAddress) {
        if (tokenAddress[0] === 'T') {
            const res = await BlocksoftAxios.get(this._tokenTronscanPath20 + tokenAddress)
            if (typeof res.data.trc20_tokens[0] !== 'undefined') {
                const tmp = res.data.trc20_tokens[0]
                return {
                    currencyCodePrefix : 'CUSTOM_TRX_',
                    currencyCode: tmp.symbol,
                    currencyName: tmp.name,
                    tokenType : 'TRX', // 'TRX'
                    tokenAddress: tmp.contract_address,
                    tokenDecimals: tmp.decimals,
                    icon: tmp.icon_url,
                    description: tmp.token_desc,
                    provider : 'tronscan20'
                }
            }
        } else {
            const res = await BlocksoftAxios.get(this._tokenTronscanPath10 + tokenAddress)
            if (typeof res.data.data[0] !== 'undefined') {
                const tmp = res.data.data[0]
                return {
                    currencyCodePrefix : 'CUSTOM_TRX_',
                    currencyCode: tmp.abbr,
                    currencyName: tmp.name,
                    tokenType : 'TRX', // 'TRX'
                    tokenAddress: tmp.tokenID,
                    tokenDecimals: tmp.precision,
                    icon: tmp.imgUrl,
                    description: tmp.description,
                    provider : 'tronscan10'
                }
            }
        }
        return false
    }
}
