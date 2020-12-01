import BlocksoftAxios from './BlocksoftAxios'
import BlocksoftCryptoLog from './BlocksoftCryptoLog'
import { createDispatchHook } from 'react-redux'

const API_PATH = 'https://microscanners.trustee.deals/fees'

const MAX_CACHE_VALID_TIME = 600000 // 10 minutes
const MIN_CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_TIME = 0

const TREZOR_SERVERS = {}

const CACHE = {
    'TRX_VOTE_BEST' : 'TV9QitxEJ3pdiAUAfJ2QuPxLKp9qTTR3og',
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 100, '6': 4, '12': 2 },
    'LTC': { '2': 100, '6': 2, '12': 1 },
    'XVG': { '2': 700, '6': 600, '12': 300 },
    'XRP_SERVER' : 'wss://s1.ripple.com',
    'ETH_INFURA' : '5e52e85aba6f483398c461c55b639a7b',
    'ETH_INFURA_PROJECT_ID' : '619a0809dcf2483c834982803f6e8b40',
    'ETH_TREZOR_SERVER': ['https://eth1.trezor.io', 'https://eth2.trezor.io'],
    'BTC_TREZOR_SERVER': ['https://btc1.trezor.io', 'https://btc2.trezor.io', 'https://btc3.trezor.io', 'https://btc4.trezor.io', 'https://btc5.trezor.io'],
    'LTC_TREZOR_SERVER': ['https://ltc1.trezor.io', 'https://ltc2.trezor.io', 'https://ltc3.trezor.io', 'https://ltc4.trezor.io', 'https://ltc5.trezor.io'],
    'BCH_TREZOR_SERVER': ['https://bch1.trezor.io', 'https://bch2.trezor.io', 'https://bch3.trezor.io', 'https://bch4.trezor.io', 'https://bch5.trezor.io'],
    'DOGE_TREZOR_SERVER': ['https://doge1.trezor.io', 'https://doge2.trezor.io', 'https://doge3.trezor.io', 'https://doge4.trezor.io', 'https://doge5.trezor.io'],
    'BTG_TREZOR_SERVER': ['https://btg1.trezor.io', 'https://btg2.trezor.io', 'https://btg3.trezor.io', 'https://btg4.trezor.io', 'https://btg5.trezor.io'],
    'ETH_ROPSTEN_TREZOR_SERVER' : ['https://ac-dev0.net:29136'],
    'minCryptoErrorsVersion': 491,
    'minAppErrorsVersion': 491,
    'cardsCountries' : {643 : 1, 804: 1, 398: 1, 112: 1},
    'rubCardsCountries' : {643 : 1, 112: 1}, // 643 - russia, 398 - kz, 112 - bl, 804 - ua,
    'rubKostilKZT' : 0,
    'ADV_PERCENT' : 1,
    'SUPPORT_BOT' : 'https://t.me/trustee_support_bot?start=app',
    'navigationViewV3': 1,
    'SOCIAL_LINK_TELEGRAM': 'https://t.me/trustee_deals',
    'SOCIAL_LINK_TWITTER': 'https://twitter.com/Trustee_Wallet',
    'SOCIAL_LINK_FACEBOOK': 'https://facebook.com/Trustee.Wallet/',
    'SOCIAL_LINK_INSTAGRAM': 'https://instagram.com/trustee_wallet/',
    'SOCIAL_LINK_VK': 'https://vk.com/trustee_wallet',
    'SOCIAL_LINK_GITHUB': 'https://github.com/trustee-wallet/trusteeWallet',
    'SOCIAL_LINK_FAQ': 'https://github.com/trustee-wallet/trusteeWallet/wiki',
}


class BlocksoftExternalSettings {

    async getAll(source) {
        await this._get(source)
        return CACHE
    }

    async get(param, source) {
        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.get started ' + param + ' from ' + source)
        await this._get(source)
        if (typeof CACHE[param] === 'undefined') return false
        return CACHE[param]
    }

    getStatic(param, source = '') {
        return CACHE[param]
    }

    async _get(source) {
        const now = new Date().getTime()
        if (now - CACHE_TIME < CACHE_VALID_TIME) {
            return false
        }
        try {
            // BlocksoftCryptoLog.log('BlocksoftExternalSettings._get started ALL from ' + source)
            const tmp = await BlocksoftAxios.getWithoutBraking(API_PATH)
            CACHE_TIME = now
            // BlocksoftCryptoLog.log('BlocksoftExternalSettings._get returned ALL from ' + source)
            if (tmp && typeof tmp.data !== 'undefined' && tmp.data) {
                this._setCache(tmp.data.data)
                CACHE_VALID_TIME = MIN_CACHE_VALID_TIME
            } else {
                CACHE_VALID_TIME = MAX_CACHE_VALID_TIME
            }
        } catch (e) {
            // BlocksoftCryptoLog.log('BlocksoftExternalSettings._get started ALL from ' + source + ' error ' + e.message)
        }
    }

    _setCache(json) {
        let key
        for (key in json) {
            CACHE[key] = json[key]
        }
    }

    async setTrezorServerInvalid(key, server) {
        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.setTrezorServerInvalid ' + key + ' start invalid ' + server + ' cache ' + JSON.stringify(TREZOR_SERVERS[key]))
        if (typeof TREZOR_SERVERS[key] === 'undefined') {
            return false
        }
        const cached = TREZOR_SERVERS[key]
        if (cached.currentServerValue !== server) {
            return false
        }
        cached.currentServerIndex++
        if (cached.currentServerIndex >= cached.okServers.length || typeof cached.okServers[cached.currentServerIndex] === 'undefined') {
            cached.currentServerIndex = 0
        }
        if (typeof cached.okServers[cached.currentServerIndex] !== 'undefined') {
            cached.currentServerValue = cached.okServers[cached.currentServerIndex]
        }
        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.setTrezorServerInvalid ' + key + ' finish invalid ' + server + ' cache ' + JSON.stringify(TREZOR_SERVERS[key]))
        if (typeof cached.currentServerValue === 'undefined' || !cached.currentServerValue) {
            BlocksoftCryptoLog.err('BlocksoftExternalSettings.getTrezorServer ' + key + ' setInvalid error with currentServer ' + JSON.stringify(TREZOR_SERVERS[key]))
            return CACHE[key][0]
        }
        return cached.currentServerValue
    }

    async getTrezorServer(key, source) {
        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source)
        const now = new Date().getTime()
        if (typeof TREZOR_SERVERS[key] !== 'undefined') {
            const cached = TREZOR_SERVERS[key]
            if (now - cached.cacheTime < MIN_CACHE_VALID_TIME) {
                // BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' got from cache ' + JSON.stringify(TREZOR_SERVERS[key]))
                if (typeof cached.currentServerValue === 'undefined' || !cached.currentServerValue) {
                    BlocksoftCryptoLog.err('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' cache error with currentServer ' + JSON.stringify(TREZOR_SERVERS[key]))
                    return CACHE[key][0]
                }
                return cached.currentServerValue
            }
        }
        const servers = await this.get(key, 'inner')
        let okServers = []
        let bestHeight = 0
        let currentServer = false
        if (key === 'BTC_TREZOR_SERVER' || servers.length === 1) {
            okServers = servers
            currentServer = servers[0]
        } else {
            let server
            const allServers = []
            for (server of servers) {
                if (!currentServer) {
                    currentServer = server
                }
                // BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' server ' + server + ' will load ' + server + '/api')
                const current = await BlocksoftAxios.getWithoutBraking(server + '/api')
                // BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' server ' + server + ' is loaded')
                if (current && typeof current.data !== 'undefined' && current.data) {
                    if (current.data.blockbook.bestHeight !== 'undefined') {
                        const tmp = current.data.blockbook.bestHeight
                        if (tmp > bestHeight) {
                            bestHeight = tmp
                        }
                        allServers[server] = tmp
                        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' server ' + server + ' height ' + tmp)
                    } else {
                        BlocksoftCryptoLog.err('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' server ' + server + ' something wrong with blockbook ' + JSON.stringify(current.data))
                    }

                }
            }
            if (typeof TREZOR_SERVERS[key] !== 'undefined' && TREZOR_SERVERS[key].bestHeight > bestHeight && typeof TREZOR_SERVERS[key].currentServerValue !== 'undefined' && TREZOR_SERVERS[key].currentServerValue) {
                TREZOR_SERVERS[key].cacheTime = now
                return TREZOR_SERVERS[key].currentServerValue
            }
            for (server of servers) {
                if (typeof allServers[server] !== 'undefined' && allServers[server] === bestHeight) {
                    okServers.push(server)
                }
            }
        }


        if (okServers && typeof okServers[0] !== 'undefined') {
            currentServer = okServers[0]
        } else {
            okServers = [currentServer]
        }

        TREZOR_SERVERS[key] = {
            okServers,
            bestHeight,
            cacheTime: now,
            currentServerValue: currentServer,
            currentServerIndex: 0
        }
        if (typeof currentServer === 'undefined' || !currentServer) {
            BlocksoftCryptoLog.err('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' error with currentServer ' + JSON.stringify(TREZOR_SERVERS[key]))
        }

        BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' put to cache ' + JSON.stringify(TREZOR_SERVERS[key]))

        return currentServer
    }
}

export default new BlocksoftExternalSettings()
