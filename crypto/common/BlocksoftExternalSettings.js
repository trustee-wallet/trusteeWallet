import BlocksoftAxios from './BlocksoftAxios'

const API_PATH = 'https://microscanners.trustee.deals/fees'

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_TIME = 0

const CACHE = {
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 100, '6': 4, '12': 2 },
    'LTC': { '2': 100, '6': 2, '12': 1 },
    'XVG': { '2': 700, '6': 600, '12': 300 },
    'ETH_TREZOR_SERVER' : ['https://eth1.trezor.io', 'https://eth2.trezor.io'],
    'BTC_TREZOR_SERVER' : ['https://btc1.trezor.io', 'https://btc2.trezor.io', 'https://btc3.trezor.io', 'https://btc4.trezor.io', 'https://btc5.trezor.io'],
    'LTC_TREZOR_SERVER' : ['https://ltc1.trezor.io', 'https://ltc2.trezor.io', 'https://ltc3.trezor.io', 'https://ltc4.trezor.io', 'https://ltc5.trezor.io'],
    'DOGE_TREZOR_SERVER' : ['https://doge1.trezor.io', 'https://doge2.trezor.io', 'https://doge3.trezor.io', 'https://doge4.trezor.io', 'https://doge5.trezor.io'],
    'BTG_TREZOR_SERVER' : ['https://btg1.trezor.io', 'https://btg2.trezor.io', 'https://btg3.trezor.io', 'https://btg4.trezor.io', 'https://btg5.trezor.io'],
    'minCryptoErrorsVersion' : 430,
    'minAppErrorsVersion' : 430
}


class BlocksoftExternalSettings {

    async getAll() {
        await this._get()
        return CACHE
    }

    async get(param) {
        await this._get()
        if (typeof CACHE[param] === 'undefined') return false
        return CACHE[param]
    }

    async _get() {
        const now = new Date().getTime()
        if (now - CACHE_TIME < CACHE_VALID_TIME) return false
        try {
            const tmp = await BlocksoftAxios.getWithoutBraking(API_PATH)
            if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
                CACHE_TIME = now
                this._setCache(tmp.data.data)
            }
        } catch (e) {
            // do nothing
        }
    }

    _setCache(json) {
        let key
        for (key in json) {
            CACHE[key] = json[key]
        }
    }
}

export default new BlocksoftExternalSettings()
