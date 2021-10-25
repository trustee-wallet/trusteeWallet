import BlocksoftAxios from './BlocksoftAxios'
import BlocksoftCryptoLog from './BlocksoftCryptoLog'
import ApiProxy from '../../app/services/Api/ApiProxy'
import config from '../../app/config/config'

const MAX_CACHE_VALID_TIME = 6000000 // 100 minutes
const MIN_CACHE_VALID_TIME = 600000 // 10 minute
let CACHE_VALID_TIME = 600000 // 10 minute
let CACHE_TIME = 0

const TREZOR_SERVERS = {}

const CACHE = {
    'TRX_VOTE_BEST' : 'TV9QitxEJ3pdiAUAfJ2QuPxLKp9qTTR3og',
    'TRX_SEND_LINK' : 'https://api.trongrid.io', // http://trx.trusteeglobal.com:8090
    'TRX_SOLIDITY_NODE' : 'https://api.trongrid.io',
    'TRX_USE_TRONSCAN' : 'YES',
    'SOL_VOTE_BEST' : 'CertusDeBmqN8ZawdkxK5kFGMwBXdudvWHYwtNgNhvLu',
    'ETH_LONG_QUERY' : 1,
    'ETH_BLOCKED_BALANCE_FORCE_QUIT' : 1,
    'ETH_LONG_QUERY_FORCE_QUIT' : 1,
    'ETH_GAS_LIMIT' : 120000,
    'ETH_GAS_LIMIT_FORCE_QUIT' : 1,
    'BCH': { '2': 2, '6': 1, '12': 1 },
    'BSV': { '2': 2, '6': 1, '12': 1 },
    'BTG': { '2': 10, '6': 5, '12': 2 },
    'DOGE': { '2': 800000, '6': 600000, '12': 500000 },
    'DOGE_STATIC' : { 'useStatic' : true, 'speed_blocks_2' : 1, 'feeForAllInputs' : 3},
    'BTC_TEST': { '2': 8, '6': 6, '12': 5 },
    'LTC': { '2': 8, '6': 5, '12': 2 },
    'XVG': { '2': 700, '6': 600, '12': 300 },
    'XVG_SEND_LINK' : 'https://api.vergecurrency.network/node/api/XVG/mainnet/tx/send',
    'XRP_SERVER' : 'wss://s1.ripple.com',
    'XLM_SERVER' : 'https://horizon.stellar.org',
    'XLM_SERVER_PRICE' : 100,
    'XLM_SEND_LINK' : 'https://horizon.stellar.org/transactions',
    'BNB_SERVER' : 'https://dex.binance.org',
    'BNB_SMART_SERVER' : 'https://bsc-dataseed1.binance.org:443',
    'BNB_SMART_PRICE' : 10000000000,
    'BNB_GAS_LIMIT' : 620000,
    'ETH_MIN_GAS_LIMIT' : 42000,
    'ETH_TESTNET_PRICE' : 6710000000,
    'ETH_INFURA' : '5e52e85aba6f483398c461c55b639a7b',
    'ETH_INFURA_PROJECT_ID' : 'c8b5c2ced3b041a8b55a1719b508ff08',
    'ETH_TREZOR_SERVER': ['https://eth1.trezor.io', 'https://eth2.trezor.io'],
    'BTC_TREZOR_SERVER': ['https://btc1.trezor.io', 'https://btc2.trezor.io', 'https://btc3.trezor.io', 'https://btc4.trezor.io', 'https://btc5.trezor.io'],
    'LTC_TREZOR_SERVER': ['https://ltc1.trezor.io', 'https://ltc2.trezor.io', 'https://ltc3.trezor.io', 'https://ltc4.trezor.io', 'https://ltc5.trezor.io'],
    'BCH_TREZOR_SERVER': ['https://bch1.trezor.io', 'https://bch2.trezor.io', 'https://bch3.trezor.io', 'https://bch4.trezor.io', 'https://bch5.trezor.io'],
    'DOGE_TREZOR_SERVER': ['https://doge1.trezor.io', 'https://doge2.trezor.io', 'https://doge3.trezor.io', 'https://doge4.trezor.io', 'https://doge5.trezor.io'],
    'BTG_TREZOR_SERVER': ['https://btg1.trezor.io', 'https://btg2.trezor.io', 'https://btg3.trezor.io', 'https://btg4.trezor.io', 'https://btg5.trezor.io'],
    'BSV_TREZOR_SERVER': ['https://bsv.trusteeglobal.com'],
    'ETH_ROPSTEN_TREZOR_SERVER' : ['https://ac-dev0.net:29136'],
    'ETC_TREZOR_SERVER' : ['https://etcblockexplorer.com'],
    'ETC_SERVER' : 'https://www.ethercluster.com/etc',
    'ETC_PRICE' : 6710000000,
    'ETC_GAS_LIMIT' : 620000,
    'AMB_SERVER' : 'https://network.ambrosus.com',
    'AMB_TREZOR_SERVER' : ['http://64.227.116.62:29136'],
    'AMB_PRICE' : 5000000000,
    'AMB_GAS_LIMIT' : 620000,
    'OPTIMISM_SERVER' : 'https://mainnet.optimism.io',
    'OPTIMISM_PRICE' : 15000000,
    'OPTIMISM_GAS_LIMIT' : 2320100000,
    'OPTIMISM_MIN_GAS_LIMIT' : 23201000,
    'MATIC_SERVER' : 'https://rpc-mainnet.maticvigil.com',
    'MATIC_PRICE' : 1000000000,
    'MATIC_GAS_LIMIT' : 620000,
    'RSK_SERVER' : 'https://public-node.rsk.co',
    'RSK_PRICE' : 5000000000,
    'RSK_GAS_LIMIT' : 620000,
    'SOL_SERVER' : 'https://api.mainnet-beta.solana.com',
    'SOL_PRICE' : 5000,
    'SOL_PRICE_NEW_SPL' : 2044280,
    'SOL_TOKENS_LIST' : 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json',
    'SOL_VALIDATORS_LIST' : 'https://raw.githubusercontent.com/trustee-wallet/trusteeWalletAssets/main/blockchains/sol/validators.json',
    'WAVES_SERVER' : 'https://nodes.wavesnodes.com',
    'ASH_SERVER' : 'http://51.158.70.89:6555',
    'FIO_BASE_URL' : 'https://fio.eosphere.io/v1/',
    'FIO_HISTORY_URL': 'https://fio.eosphere.io/v1/history/',
    'FIO_REGISTRATION_URL' : 'https://reg.fioprotocol.io/ref/trustee?publicKey=',
    'minCryptoErrorsVersion': 491,
    'minAppErrorsVersion': 491,
    'SUPPORT_BOT' : 'https://t.me/trustee_support_bot?start=app',
    'SUPPORT_BOT_NAME' : '@trustee_support_bot',
    'SUPPORT_EMAIL' : 'contact@trustee.deals',
    'navigationViewV3': 1,
    'SOCIAL_LINK_SITE': 'trusteeglobal.com',
    'SOCIAL_LINK_TELEGRAM': 'https://t.me/trustee_deals',
    'SOCIAL_LINK_TWITTER': 'https://twitter.com/Trustee_Wallet',
    'SOCIAL_LINK_FACEBOOK': 'https://facebook.com/Trustee.Wallet/',
    'SOCIAL_LINK_INSTAGRAM': 'https://instagram.com/trustee_wallet/',
    'SOCIAL_LINK_VK': 'https://vk.com/trustee_wallet',
    'SOCIAL_LINK_GITHUB': 'https://github.com/trustee-wallet/trusteeWallet',
    'SOCIAL_LINK_FAQ': 'https://trusteeglobal.com/faq/',
    'PRIVACY_POLICY_en': 'https://trusteeglobal.com/privacy-policy/?header_footer=none',
    'PRIVACY_POLICY_ru': 'https://trusteeglobal.com/ru/politika-konfidencialnosti/?header_footer=none',
    'PRIVACY_POLICY_uk': 'https://trusteeglobal.com/uk/poltika-konfidencijnosti/?header_footer=none',
    'TERMS_en': 'https://trusteeglobal.com/terms-of-use/?header_footer=none',
    'TERMS_ru': 'https://trusteeglobal.com/ru/usloviya-ispolzovaniya/?header_footer=none',
    'TERMS_uk': 'https://trusteeglobal.com/uk/umovi-vikoristannya/?header_footer=none',
    'SEND_CHECK_ALMOST_ALL_PERCENT' : 0.95
}


class BlocksoftExternalSettings {

    async getAll(source) {
        await this._get('getAll ' + source)
        return CACHE
    }

    async get(param, source) {
        // BlocksoftCryptoLog.log('BlocksoftExternalSettings.get started ' + param + ' from ' + source)
        await this._get('get ' + (typeof source !== 'undefined' ? source : param))
        if (typeof CACHE[param] === 'undefined') return false
        return CACHE[param]
    }

    getStatic(param, source = '') {
        if (typeof CACHE[param] === 'undefined') return false
        return CACHE[param]
    }

    async _get(source) {
        const now = new Date().getTime()
        if (now - CACHE_TIME < CACHE_VALID_TIME) {
            return false
        }
        try {
            // BlocksoftCryptoLog.log('BlocksoftExternalSettings._get started ALL from ' + source)
            const tmp = await ApiProxy.getAll({source : 'BlocksoftExternalSettings._get ' + source, onlyFees: true})

            CACHE_TIME = now
            // BlocksoftCryptoLog.log('BlocksoftExternalSettings._get returned ALL from ' + source)
            if (tmp && typeof tmp.fees !== 'undefined' && tmp.fees) {
                this._setCache(tmp.fees.data)
                CACHE_VALID_TIME = MIN_CACHE_VALID_TIME
            } else {
                CACHE_VALID_TIME = MAX_CACHE_VALID_TIME
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('BlocksoftExternalSettings._get started ALL from ' + source + ' error ' + e.message)
            }
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
        const servers = await this.get(key, 'inner getTrezorServer ' + key)
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
            BlocksoftCryptoLog.err('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' error with currentServer ', JSON.stringify(TREZOR_SERVERS[key]))
        }

        BlocksoftCryptoLog.log('BlocksoftExternalSettings.getTrezorServer ' + key + ' from ' + source + ' put to cache ', JSON.stringify(TREZOR_SERVERS[key]))

        return currentServer
    }
}

export default new BlocksoftExternalSettings()
