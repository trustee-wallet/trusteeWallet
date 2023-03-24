/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

const BALANCE_PATH = 'https://apilist.tronscan.org/api/account?address='
const BALANCE_MAX_TRY = 10

const CACHE_TRONSCAN = {}
const CACHE_VALID_TIME = 3000 // 3 seconds

export default class TrxTronscanProvider {

    /**
     * https://apilist.tronscan.org/api/account?address=TUbHxAdhPk9ykkc7SDP5e9zUBEN14K65wk
     * @param {string} address
     * @param {string} tokenName
     * @returns {Promise<boolean|{unconfirmed: number, frozen: *, frozenEnergy: *, voteTotal: *, balance: *, provider: string}>}
     */
    async get(address, tokenName, useCache = true) {
        const now = new Date().getTime()
        if (useCache && typeof CACHE_TRONSCAN[address] !== 'undefined' && (now - CACHE_TRONSCAN[address].time) < CACHE_VALID_TIME) {
            if (typeof CACHE_TRONSCAN[address][tokenName] !== 'undefined') {
                BlocksoftCryptoLog.log('TrxTronscanProvider.get from cache', address + ' => ' + tokenName + ' : ' + CACHE_TRONSCAN[address][tokenName])
                const frozen = typeof CACHE_TRONSCAN[address][tokenName + 'frozen'] !== 'undefined' ? CACHE_TRONSCAN[address][tokenName + 'frozen'] : 0
                const frozenEnergy = typeof CACHE_TRONSCAN[address][tokenName + 'frozenEnergy'] !== 'undefined' ? CACHE_TRONSCAN[address][tokenName + 'frozenEnergy'] : 0
                const voteTotal = typeof CACHE_TRONSCAN[address].voteTotal !== 'undefined' ? CACHE_TRONSCAN[address].voteTotal : 0
                return { balance: CACHE_TRONSCAN[address][tokenName], voteTotal, frozen, frozenEnergy, unconfirmed : 0, provider: 'tronscan-cache', time :  CACHE_TRONSCAN[address].time }
            } else if (tokenName !== '_') {
                return false
            }
        }

        const link = BALANCE_PATH + address
        BlocksoftCryptoLog.log('TrxTronscanProvider.get ' + link)
        const res = await BlocksoftAxios.getWithoutBraking(link, BALANCE_MAX_TRY)
        if (!res || !res.data) {
            return false
        }

        CACHE_TRONSCAN[address] = {}
        CACHE_TRONSCAN[address].time = now
        CACHE_TRONSCAN[address]._ = res.data.balance
        CACHE_TRONSCAN[address]._frozen = typeof res.data.frozen.total !== 'undefined' ? res.data.frozen.total : 0
        CACHE_TRONSCAN[address]._frozenEnergy = typeof res.data.accountResource !== 'undefined'
                                    && typeof res.data.accountResource.frozen_balance_for_energy !== 'undefined'
                                    && typeof res.data.accountResource.frozen_balance_for_energy.frozen_balance !== 'undefined' ? res.data.accountResource.frozen_balance_for_energy.frozen_balance : 0

        CACHE_TRONSCAN[address].voteTotal = typeof res.data.voteTotal !== 'undefined' ? res.data.voteTotal : 0
        let token
        if (res.data.tokenBalances) {
            for (token of res.data.tokenBalances) {
                const id = typeof token.name !== 'undefined' ? token.name : token.tokenId
                CACHE_TRONSCAN[address][id] = token.balance
            }
        }

        if (res.data.trc20token_balances) {
            for (token of res.data.trc20token_balances) {
                const id = typeof token.name !== 'undefined' ? token.name : token.tokenId
                CACHE_TRONSCAN[address][id] = token.balance
            }
        }

        if (typeof CACHE_TRONSCAN[address][tokenName] === 'undefined') {
            if (tokenName.indexOf('T') === 0) {
                return 0
            } else {
                return false
            }
        }

        const balance = CACHE_TRONSCAN[address][tokenName]
        const frozen = typeof CACHE_TRONSCAN[address][tokenName + 'frozen'] !== 'undefined' ? CACHE_TRONSCAN[address][tokenName + 'frozen'] : 0
        const frozenEnergy = typeof CACHE_TRONSCAN[address][tokenName + 'frozenEnergy'] !== 'undefined' ? CACHE_TRONSCAN[address][tokenName + 'frozenEnergy'] : 0
        const voteTotal = typeof CACHE_TRONSCAN[address].voteTotal !== 'undefined' ? CACHE_TRONSCAN[address].voteTotal : 0
        return { balance, frozen, frozenEnergy, voteTotal, unconfirmed: 0, provider: 'tronscan', time : CACHE_TRONSCAN[address].time }
    }
}
