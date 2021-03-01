/**
 * @version 0.14
 * @author yura
 */
import Log from '../Log/Log'
import { sublocale } from '../i18n'
import DaemonCache from '../../daemons/DaemonCache'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import accountDS from '../../appstores/DataSource/Account/Account'
import walletPubDS from '../../appstores/DataSource/Wallet/WalletPub'
import walletDS from '../../appstores/DataSource/Wallet/Wallet'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'

import database from '@react-native-firebase/database'

import PubEncrypt from './PubEncrypt/PubEncrypt'
import config from '../../config/config'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import currencyDS from '../../appstores/DataSource/Currency/Currency'
import cardDS from '../../appstores/DataSource/Card/Card'
import MarketingEvent from '../Marketing/MarketingEvent'
import axios from 'axios'
import UpdateCardsDaemon from '../../daemons/back/UpdateCardsDaemon'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'

const V3_ENTRY_POINT_EXCHANGE = '/mobile-exchanger'
const V3_ENTRY_POINT_SELL = '/mobile-sell'
const V3_ENTRY_POINT_BUY = '/mobile-buy'
const V3_ENTRY_POINT_CHECK = '/mobile-check'
const V3_ENTRY_POINT_SET_STATUS = '/order/update-payment-status'
const V3_ENTRY_POINT_MARKET = '/mobile-market'

const V3_PUB = '818ef87763ee0f9eaee49ff1f27d4b87e76dc1a8309187b82de52687783d832705f4bafe4a51efad26ccca9367419f9e28e07cea849b8b15108a56e054128a8c'
const V3_KEY_PREFIX = 'TrusteeExchange'


let CACHE_SERVER_TIME_NEED_TO_ASK = false

export default {

    validateCard: async (data, forceMode = false) => {
        let { mode: exchangeMode, apiEndpoints } = config.exchange
        if (typeof forceMode !== 'undefined' && forceMode) {
            exchangeMode = forceMode
        }
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        try {
            return await axios.post(`${baseUrl}/payment-details/validate-card`, data, {
                headers: {
                    'Accept': 'multipart/form-data',
                    'Content-Type': 'multipart/form-data'
                }
            })
        } catch (e) {
            Log.err('ApiV3 validateCard e.response.data ' + JSON.stringify(e.response.data))
            Log.err('ApiV3 validateCard e.response.data.message ' + JSON.stringify(e.response.data.message))
        }
    },

    async initWallet(walletHash, currencies = false) {
        if (typeof DaemonCache.CACHE_WALLET_NAMES_AND_CB[walletHash] === 'undefined') {
            return false
        }
        const wallet = DaemonCache.CACHE_WALLET_NAMES_AND_CB[walletHash]

        const btcLegacyOrSegWit = settingsActions.getSettingStatic('btc_legacy_or_segwit')
        const btcShowTwoAddress = settingsActions.getSettingStatic('btcShowTwoAddress')
        let showType = 'segwit'
        if (btcShowTwoAddress === false && btcLegacyOrSegWit === 'legacy') {
            showType = 'legacy'
        }

        if (currencies === false || typeof currencies['BTC'] === 'undefined') {
            const tmps = await currencyDS.getCurrencies()
            currencies = {}
            for (const currency of tmps) {
                const currencyCode = currency.currencyCode
                currencies[currencyCode] = currency
            }
        }

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

            const resultAccount = {
                currencyCode,
                address: account.address,
                isHidden: currencies[currencyCode].isHidden,
                balance : account.balancePretty,
                unconfirmed: account.unconfirmedPretty,
                raw: account.balanceRaw,
                currencyRateUsd : currencies[currencyCode].currencyRateUsd,
                basicCurrencyCode: account.basicCurrencyCode,
                basicCurrencyRate: account.basicCurrencyRate,
                basicCurrencyBalance : account.basicCurrencyBalance,
                basicCurrencyUnconfirmed : account.basicCurrencyUnconfirmed
            }
            if (currencyCode.indexOf('CUSTOM_') !== -1) {
                const currencySettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
                if (typeof currencySettings.tokenAddress !== 'undefined') {
                    resultAccount.tokenAddress = currencySettings.tokenAddress
                }
                if (typeof currencySettings.tokenName !== 'undefined') {
                    resultAccount.tokenName = currencySettings.tokenName
                }
                if (typeof currencySettings.tokenBlockchain !== 'undefined') {
                    resultAccount.tokenBlockchain = currencySettings.tokenBlockchain
                }
            }

            if (showType === 'segwit' && typeof account.legacy !== 'undefined' && typeof account.segwit !== 'undefined') {
                resultAccount.address = [
                    {
                        address: account.segwit,
                        type: 'SEGWIT'
                    },
                    {
                        address: account.legacy,
                        type: 'LEGACY'
                    }
                ]
            } else if (currencyCode === 'XRP'  || currencyCode === 'XLM') {
                let balance = account.balancePretty
                if (currencyCode === 'XRP') {
                    balance = account.balancePretty * 1 - 20
                    resultAccount.balance = balance
                } else if (currencyCode === 'XLM') {
                    balance = account.balancePretty * 1 - 1
                    resultAccount.balance = balance
                }
                resultAccount.basicCurrencyBalance = BlocksoftUtils.mul(resultAccount.balance, resultAccount.basicCurrencyRate)
            }
            accounts.push(resultAccount)
        }
        return accounts
    },

    async initData(type, currencyCode = false, isLight) {

        let { mode: exchangeMode, apiEndpoints } = config.exchange
        let entryURL = exchangeMode === 'DEV' ? apiEndpoints.entryURLTest : apiEndpoints.entryURL
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        entryURL = type === 'MARKET' ? exchangeMode === 'DEV' ? apiEndpoints.entryMarketURLTest : apiEndpoints.entryMarketURL : entryURL
    

        let entryPoint
        if (type === 'EXCHANGE') {
            entryPoint = V3_ENTRY_POINT_EXCHANGE
        } else if (type === 'SELL') {
            entryPoint = V3_ENTRY_POINT_SELL
        } else if (type === 'BUY') {
            entryPoint = V3_ENTRY_POINT_BUY
        } else if (type === 'MARKET') {
            entryPoint = V3_ENTRY_POINT_MARKET
        } else {
            throw new Error('ApiV3 invalid settings type ' + type)
        }

        await UpdateCardsDaemon.updateCardsDaemon({ force: true })

        const data = {
            locale: sublocale(),
            deviceToken: MarketingEvent.DATA.LOG_TOKEN,
            wallets: [],
            cards: await cardDS.getCards(),
            selectedCurrency: currencyCode
        }
        if (!data.cards || typeof data.cards === 'undefined') {
            data.cards = []
        }

        const tmps = await currencyDS.getCurrencies()
        const currencies = {}
        for (const currency of tmps) {
            const currencyCode = currency.currencyCode
            currencies[currencyCode] = currency
        }

        for (const walletHash in DaemonCache.CACHE_WALLET_NAMES_AND_CB) {
            let wallet = DaemonCache.CACHE_WALLET_NAMES_AND_CB[walletHash]
            wallet = await walletDS._redoCashback(wallet)
            const accounts = await this.initWallet(walletHash, currencies)

            data.wallets.push({
                walletHash,
                walletName: wallet.walletName,
                cashbackToken: wallet.walletCashback,
                accounts
            })
        }

        let msg = ''
        let date = new Date()
        if (true || CACHE_SERVER_TIME_NEED_TO_ASK) { // lets check if the error
            try {
                await Log.log('ApiV3.initData will ask time from server ' + (CACHE_SERVER_TIME_NEED_TO_ASK ? ' need ask ' : ' no ask but we forced'))

                const now = await BlocksoftAxios.get(`${baseUrl}/data/server-time`)
                if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                    msg = now.data.serverTime
                    date = new Date(msg)
                    const oldNow = +new Date()
                    await Log.log('ApiV3.initData msg from server ' + msg + ' - old ' + oldNow + ' = ' + Math.abs(msg * 1 - oldNow * 1))
                } else {
                    await Log.log('ApiV3.initData msg from server - no time ', now.data)
                }
            } catch (e) {
                // do nothing
            }
        }

        const sign = await CashBackUtils.createWalletSignature(true, msg)
        data.sign = sign

        const currentToken = CashBackUtils.getWalletToken()
        date = date.toISOString().split('T')
        const keyTitle = V3_KEY_PREFIX + '/' + date[0] + '/' + currentToken
        try {
            const link = entryURL + entryPoint
                + '?date=' + date[0]
                + '&message=' + sign.message
                + '&messageHash=' + sign.messageHash
                + '&signature=' + sign.signature
                + '&cashbackToken=' + currentToken
                + '&locale=' + sublocale()
                + '&version=' + MarketingEvent.DATA.LOG_VERSION
                + '&isLight=' + MarketingEvent.UI_DATA.IS_LIGHT

            await Log.log('ApiV3.initData start json link ' + link)
            const text = JSON.stringify(data)
            await Log.log('ApiV3.initData start encryption')
            const encrypted = await PubEncrypt.encryptWithPublicKey(V3_PUB, text)
            await Log.log('ApiV3.initData end encryption')
            encrypted.key = currentToken // for firebase key read rule

            await Log.log('ApiV3.initData start save to firebase')
            await database().ref(keyTitle).set(encrypted)
            await Log.log('ApiV3.initData end save to firebase link ' + link)
            return link
        } catch (e) {
            await Log.err('ApiV3.initData error ' + e.message)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
    },

    getMobileCheck: async (orderHash) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const entryUrl = exchangeMode === 'DEV' ? apiEndpoints.entryURLTest : apiEndpoints.entryURL
        const entryPoint = V3_ENTRY_POINT_CHECK


        const sign = await CashBackUtils.createWalletSignature(true)

        const currentToken = CashBackUtils.getWalletToken()

        try {

            const link = entryUrl + entryPoint
                + '?signature=' + sign.signature
                + '&signMessage=' + sign.message
                + '&signMessageHash=' + sign.messageHash
                + '&cashbackToken=' + currentToken
                + '&locale=' + sublocale()
                + '&orderHash=' + orderHash
                + '&version=' + MarketingEvent.DATA.LOG_VERSION
                + '&isLight=' + MarketingEvent.UI_DATA.IS_LIGHT
            Log.log('ApiV3 getMobileCheck link ' + link)
            return link
        } catch (e) {
            Log.err('ApiV3 getMobileCheck error ' + e.message)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
    },

    setExchangeStatus: async (orderHash, status) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        const sign = await CashBackUtils.createWalletSignature(true)

        const cashbackToken = CashBackUtils.getWalletToken()

        const data = {}

        data.sign = sign

        data.cashbackToken = cashbackToken

        data.orderHash = orderHash
        data.paymentStatus = status

        try {
            const link = baseUrl + V3_ENTRY_POINT_SET_STATUS
            Log.log('ApiV3 setExchangeStatus axios ' + link + ' status ' + status)
            return BlocksoftAxios.post(link, data, false)

        } catch (e) {
            Log.err('ApiV3 setExchangeStatus e.response.data ' + e.response.data)
            Log.err('ApiV3 setExchangeStatus e.response.data.message ' + e.response.data.message)
        }
    },

    getExchangeOrders: async (_requestAuthHash = false) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        let signedData = await CashBackUtils.createWalletSignature(true, false, _requestAuthHash)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const cashbackToken = signedData.cashbackToken
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
                await Log.daemon('ApiV3 getExchangeOrders axios ' + index + ' ' + link)
                try {
                    link = `${baseUrl}/order/history-for-wallet?`
                        + `cashbackToken=${signedData.cashbackToken}&message=${signedData.message}&messageHash=${signedData.messageHash}`
                        + `&signature=${signedData.signature}&timestamp=${+new Date()}`
                    await Log.daemon('ApiV3 getExchangeOrders finished ' + index + ' ' + link)

                    now = +new Date()
                    res = await BlocksoftAxios.get(link, false)
                    if (!res) {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } catch (e) {
                    await Log.daemon('ApiV3 getExchangeOrders error ' + e.message)
                    if (typeof e.subdata === 'undefined') {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                    res = e.subdata
                }

                if (typeof res.errorMsg !== 'undefined') {
                    await Log.daemon('ApiV3 getExchangeOrders error ', res)
                    if (typeof res.serverTimestamp !== 'undefined' && res.serverTimestamp) {
                        serverTime = res.serverTimestamp
                        res = false
                        if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                            throw new Error('UI_ERROR_IME_ERROR')
                        } else {
                            await Log.daemon('ApiV3 getExchangeOrders will retry with time ' + serverTime)
                            signedData = await CashBackUtils.createWalletSignature(true, serverTime, _requestAuthHash)
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
                if (diff > 6000) {
                    await Log.daemon('ApiV3 getExchangeOrders will ask server time diff ' + diff + ' with time ' + res.data.serverTime)
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
