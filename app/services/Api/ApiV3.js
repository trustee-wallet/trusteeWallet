/**
 * @version 0.12
 */
import Log from '../Log/Log'
import { sublocale } from '../i18n'
import DaemonCache from '../../daemons/DaemonCache'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import accountDS from '../../appstores/DataSource/Account/Account'
import walletPubDS from '../../appstores/DataSource/Wallet/WalletPub'
import walletDS from '../../appstores/DataSource/Wallet/Wallet'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import firebase from 'react-native-firebase'

import PubEncrypt from './PubEncrypt/PubEncrypt'
import config from '../../config/config'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import currencyDS from '../../appstores/DataSource/Currency/Currency'
import cardDS from '../../appstores/DataSource/Card/Card'
import MarketingEvent from '../Marketing/MarketingEvent'

const V3_ENTRY_POINT_EXCHANGE = '/mobile-exchanger'
const V3_ENTRY_POINT_TRADE = '/mobile-sell'

const V3_API = 'https://api.v3.trustee.deals'
const V3_PUB = '818ef87763ee0f9eaee49ff1f27d4b87e76dc1a8309187b82de52687783d832705f4bafe4a51efad26ccca9367419f9e28e07cea849b8b15108a56e054128a8c'
const V3_KEY_PREFIX = 'TrusteeExchange'


let CACHE_SERVER_TIME_NEED_TO_ASK = false

export default {

    async initData(type) {

        let entryPoint
        if (type === 'EXCHANGE') {
            entryPoint = V3_ENTRY_POINT_EXCHANGE
        } else if (type === 'TRADE') {
            entryPoint = V3_ENTRY_POINT_TRADE
        } else {
            throw new Error('ApiV3 invalid settings type ' + type)
        }

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const entryUrl = exchangeMode === 'DEV' ? apiEndpoints.entryURLTest : apiEndpoints.entryURL

        const data = {
            locale: sublocale(),
            deviceToken: Log.LOG_TOKEN,
            wallets: [],
            cards : await cardDS.getCards()
        }

        const btcLegacyOrSegWit = await settingsActions.getSetting('btc_legacy_or_segwit')
        const btcShowTwoAddress = await settingsActions.getSetting('btcShowTwoAddress')
        let showType = 'segwit'
        if (btcShowTwoAddress === false && btcLegacyOrSegWit === 'legacy') {
            showType = 'legacy'
        }

        const tmps = await currencyDS.getCurrencies()
        const currencies = {}
        for (const currency of tmps) {
            const currencyCode = currency.currencyCode
            const isHidden = currency.isHidden
            currencies[currencyCode] = isHidden
        }

        for (const walletHash in DaemonCache.CACHE_WALLET_NAMES_AND_CB) {
            let wallet = DaemonCache.CACHE_WALLET_NAMES_AND_CB[walletHash]
            wallet = await walletDS._redoCashback(wallet)
            const accounts = []
            for (const currencyCode in DaemonCache.CACHE_ALL_ACCOUNTS[walletHash]) {
                const account = DaemonCache.CACHE_ALL_ACCOUNTS[walletHash][currencyCode]

                // @todo optimize with setSelectedAccount
                if (currencyCode === 'BTC' && wallet.walletIsHd) {
                    let accounts = await accountDS.getAccountData({
                        walletHash: walletHash,
                        currencyCode: currencyCode,
                        splitSegwit: true,
                        notAlreadyShown: true
                    })

                    let needSegwit = false
                    let needLegacy = false
                    if (showType === 'segwit' && (typeof accounts.segwit === 'undefined' || !accounts.segwit || accounts.segwit.length === 0)) {
                        needSegwit = true
                    }
                    if (typeof accounts.legacy === 'undefined' || !accounts.legacy || accounts.legacy.length === 0) {
                        needLegacy = true
                    }
                    Log.log('ACT/ApiV3 HD checked ' + JSON.stringify({ needSegwit, needLegacy }))
                    if (needSegwit || needLegacy) {
                        await walletPubDS.discoverMoreAccounts({
                            walletHash: walletHash,
                            currencyCode: currencyCode,
                            needSegwit,
                            needLegacy
                        }, '_SET_APIV3')
                        accounts = await accountDS.getAccountData({
                            walletHash: walletHash,
                            currencyCode: currencyCode,
                            splitSegwit: true,
                            notAlreadyShown: true
                        })
                    }
                    if (!accounts) {
                        accounts = await accountDS.getAccountData({
                            walletHash: walletHash,
                            currencyCode: currencyCode,
                            splitSegwit: true
                        })
                    }
                    if (accounts) {
                        if (showType === 'segwit' && accounts.segwit && typeof accounts.segwit[0] !== 'undefined') {
                            account.segwit = accounts.segwit[0].address
                        }
                        if (accounts.legacy && typeof accounts.legacy[0] !== 'undefined') {
                            account.legacy = accounts.legacy[0].address
                            account.address = account.legacy
                        }
                    }
                }
                // @todo end optimization

                if (showType === 'segwit' && typeof account.legacy !== 'undefined' && typeof account.segwit !== 'undefined') {
                    accounts.push({
                        currencyCode,
                        address: [
                            {
                                address: account.segwit,
                                type: 'SEGWIT'
                            },
                            {
                                address: account.legacy,
                                type: 'LEGACY'
                            }
                        ],

                        balance: account.balancePretty
                    })
                } else {
                    accounts.push({
                        currencyCode,
                        isHidden: currencies[currencyCode],
                        address: account.address,
                        balance: account.balancePretty
                    })
                }
            }

            data.wallets.push({
                walletHash,
                walletName: wallet.walletName,
                cashbackToken: wallet.walletCashback,
                accounts
            })
        }


        let msg = ''
        if (CACHE_SERVER_TIME_NEED_TO_ASK) {
            try {
                Log.log('ApiV3.initData will ask time from server')
                const now = await BlocksoftAxios.get(V3_API + '/data/server-time')
                if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                    msg = now.data.serverTime
                    Log.log('ApiV3.initData msg from server ' + msg)
                }
            } catch (e) {
                // do nothing
            }
        }
        console.log('data', data)

        const sign = await CashBackUtils.createWalletSignature(true, msg)
        data.sign = sign

        const currentToken = CashBackUtils.getWalletToken()
        const date = (new Date()).toISOString().split('T')
        const keyTitle = V3_KEY_PREFIX + '/' + date[0] + '/' + currentToken

        try {
            Log.log('ApiV3.initData start json')
            const text = JSON.stringify(data)
            Log.log('ApiV3.initData start encryption')
            const encrypted = await PubEncrypt.encryptWithPublicKey(V3_PUB, text)
            Log.log('ApiV3.initData end encryption')
            encrypted.key = currentToken // for firebase key read rule

            await firebase.database().ref(keyTitle).set(encrypted)

            const link = entryUrl + entryPoint
                + '?date=' + date[0]
                + '&message=' + sign.message
                + '&messageHash=' + sign.messageHash
                + '&signature=' + sign.signature
                + '&cashbackToken=' + currentToken
                + '&locale=' + sublocale()
                + '&version=' + MarketingEvent.DATA.LOG_VERSION
            Log.log('ApiV3.initData link ' + link)
            return link
        } catch (e) {
            Log.err('ApiV3.initData error ' + e.message)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
    },

    getExchangeOrders: async () => {

        let signedData = await CashBackUtils.createWalletSignature(true)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const cashbackToken = CashBackUtils.getWalletToken()
        if (!cashbackToken) {
            throw new Error('No cashbackToken for getExchangeOrders')
        }

        let res = false
        let link = ''
        let now = 0
        try {
            let index = 0
            let serverTime = 0
            const MAX_TRY_SERVER_TIME = 4
            do {
                index++
                Log.daemon('ApiV3 getExchangeOrders axios ' + index + ' ' + link)
                try {
                    link = `${V3_API}/order/history-for-wallet?`
                         + `cashbackToken=${cashbackToken}&message=${signedData.message}&messageHash=${signedData.messageHash}`
                         + `&signature=${signedData.signature}&timestamp=${+new Date()}`

                    now = +new Date()
                    res = await BlocksoftAxios.get(link, false)
                    if (!res) {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } catch (e) {
                    Log.daemon('ApiV3 getExchangeOrders error ' + e.message)
                    if (typeof e.subdata === 'undefined') {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                    res = e.subdata
                }

                if (typeof res.errorMsg !== 'undefined') {
                    Log.daemon('ApiV3 getExchangeOrders error ', res)
                    if (typeof res.serverTimestamp !== 'undefined' && res.serverTimestamp) {
                        serverTime = res.serverTimestamp
                        res = false
                        if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                            throw new Error('UI_ERROR_IME_ERROR')
                        } else {
                            Log.daemon('ApiV3 getExchangeOrders will retry with time ' + serverTime)
                            signedData = await CashBackUtils.createWalletSignature(true, serverTime)
                        }
                    } else {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } else {
                    // finish ok
                    break
                }
            } while (index < MAX_TRY_SERVER_TIME)
        } catch (e) {
            // do nothing
        }

        if (res && typeof res.data !== 'undefined') {
            if (typeof res.data.serverTime !== 'undefined') {
                const diff = Math.abs(now - res.data.serverTime)
                Log.daemon('ApiV3 getExchangeOrders diff ' + diff + ' with time ' + res.data.serverTime)
                if (diff > 6000) {
                    CACHE_SERVER_TIME_NEED_TO_ASK = true
                } else {
                    CACHE_SERVER_TIME_NEED_TO_ASK = false
                }
            }
            if (typeof res.data.orders !== 'undefined') {
                return res.data.orders
            }
        }
        return res
    }
}
