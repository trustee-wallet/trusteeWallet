/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import Log from '@app/services/Log/Log'

const scamSeeds = require('@crypto/common/ext/scam-seeds')

let CACHE_SEEDS = scamSeeds
let CACHE_CASHBACKS = {}
let CACHE_SEEDS_TIME = 0
const TIMEOUT_SEEDS = 60000
const PROXY_SEEDS = 'https://proxy.trustee.deals/seeds/checkBad'

const _get = async () => {
    const now = new Date().getTime()
    if ((now - CACHE_SEEDS_TIME) > TIMEOUT_SEEDS) {
        try {
            const tmp = await BlocksoftAxios.get(PROXY_SEEDS)
            CACHE_SEEDS_TIME = now
            if (tmp.data?.data?.seeds) {
                for (const seed of tmp.data.data.seeds) {
                    CACHE_SEEDS[seed] = 1
                }
            }
            if (tmp.data?.data?.cashbacks) {
                for (const cb of tmp.data.data.cashbacks) {
                    CACHE_CASHBACKS[cb] = 1
                }
            }
        } catch (e) {
            Log.log('BlocksoftKeysScam check error ' + e.message)
        }
    }
}
const isScamMnemonic = async (mnemonic) => {
    await _get()
    if (typeof CACHE_SEEDS[mnemonic] !== 'undefined') {
        return true
    }
    return false
}
const isScamCashback = async (cb) => {
    await _get()
    if (typeof CACHE_CASHBACKS[cb] !== 'undefined') {
        return true
    }
    return false
}

const isScamCashbackStatic = (cb) => {
    if (typeof CACHE_CASHBACKS[cb] !== 'undefined') {
        return true
    }
    return false
}

export default {
    isScamMnemonic,
    isScamCashback,
    isScamCashbackStatic
}
