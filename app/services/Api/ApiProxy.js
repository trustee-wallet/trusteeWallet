/**
 * @version 0.32
 */
import config from '@app/config/config'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import { sublocale } from '@app/services/i18n'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'
import ApiV3 from '@app/services/Api/ApiV3'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import customCurrencyDS from '@app/appstores/DataSource/CustomCurrency/CustomCurrency'
import cardsDS from '@app/appstores/DataSource/Card/Card'

import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import Log from '@app/services/Log/Log'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'
import store from '@app/store'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import UpdateWalletsDaemon from '@app/daemons/back/UpdateWalletsDaemon'

async function _getAll(params) {
    const { mode: exchangeMode } = config.exchange

    let deviceToken = MarketingEvent.DATA.LOG_TOKEN
    if (!deviceToken || deviceToken === null || deviceToken === '') {
        deviceToken = await AppNotificationListener.getToken()
    }
    if (!deviceToken || deviceToken === null || deviceToken === '') {
        deviceToken = 'NO_GOOGLE_AS_NULL_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
    }
    const link = config.proxy.apiEndpoints.baseURL + `/all?exchangeMode=${exchangeMode}&uid=${deviceToken}`

    const time = typeof params !== 'undefined' && typeof params.timestamp !== 'undefined' ? params.timestamp : false
    /*
    try {
        const now = await BlocksoftAxios.get(`https://api.v3.trustee.deals/data/server-time`)
        if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
            time = now.data.serverTime
            Log.daemon('UpdateCardsDaemon msg from server ' + time)
        }
    } catch (e) {
        // do nothing
    }
    */

    const signedData = await CashBackUtils.createWalletSignature(true, time)
    if (!signedData) {
        throw new Error('No signed for getNews')
    }
    const cashbackToken = CashBackUtils.getWalletToken()
    MarketingEvent.DATA.LOG_CASHBACK = cashbackToken
    const parentToken = CashBackUtils.getParentToken()
    MarketingEvent.DATA.LOG_PARENT = parentToken
    let walletHash = MarketingEvent.DATA.LOG_WALLET
    if (!walletHash || walletHash === false) {
        walletHash = await BlocksoftKeysStorage.getSelectedWallet()
        MarketingEvent.DATA.LOG_WALLET = walletHash
    }
    MarketingEvent.reinitIfNever()

    const forCustomTokens = await customCurrencyDS.getCustomCurrenciesForApi()
    const forCards = await cardsDS.getCards()
    const forServer = await appNewsDS.getAppNewsForServer()
    const forServerIds = []
    if (forServer) {
        for (const row of forServer) {
            forServerIds.push(row.id)
            if (row.receivedAt) {
                row.receivedAt = row.receivedAt + '000'
            }
            if (row.openedAt) {
                row.openedAt = row.openedAt + '000'
            }
        }
    }
    const forWallets = []
    const wallet = store.getState().mainStore.selectedWallet
    if (wallet && wallet.walletHash === walletHash) {
        forWallets.push({
            walletToSendStatus: wallet.walletToSendStatus,
            walletHash: wallet.walletHash,
            walletCashback: wallet.walletCashback,
            walletIsHd: wallet.walletIsHd,
            walletName: wallet.walletName,
            walletUseLegacy: wallet.walletUseLegacy,
            walletUseUnconfirmed: wallet.walletUseUnconfirmed,
            walletIsHideTransactionForFee: wallet.walletIsHideTransactionForFee,
            walletAllowReplaceByFee: wallet.walletAllowReplaceByFee,
            walletIsBackedUp : wallet.walletIsBackedUp
        })
    }

    const newsData = {
        cashbackToken,
        deviceToken,
        sign: signedData,
        userNotifications: forServer ? forServer : [],
        exchangeRatesNotifs: await settingsActions.getSetting('exchangeRatesNotifs'),
        locale: sublocale()
    }

    const cbData = {
        deviceToken,
        locale: sublocale(),
        signedData,
        timestamp: +new Date()
    }
    if (typeof cashbackToken !== 'undefined' && cashbackToken !== null) {
        cbData.cashbackToken = cashbackToken
    }
    if (typeof parentToken !== 'undefined' && parentToken !== null && parentToken) {
        cbData.parentToken = parentToken
    }

    const cbOrders = {
        CACHE_ORDERS_HASH: UpdateTradeOrdersDaemon.getSavedOrdersHash(),
        cashbackToken,
        signedData,
        timestamp: +new Date()
    }

    const walletAll = await ApiV3.initWallet({ walletHash }, 'ApiProxy')
    const marketingAll = { ...MarketingEvent.DATA, CACHE_SERVER_TIME_DIFF}
    const allData = {
        newsData,
        cbData,
        cbOrders,
        forCustomTokens,
        forCards,
        forWallets,
        marketingAll,
        walletAll
    }

    const all = await BlocksoftAxios.post(link, allData)
    if (typeof all.data.data !== 'undefined') {
        all.data.data.forServerIds = forServerIds
        if (typeof all.data.data.forCustomTokensOk !== 'undefined' && all.data.data.forCustomTokensOk && all.data.data.forCustomTokensOk.length > 0) {
            await customCurrencyDS.savedCustomCurrenciesForApi(all.data.data.forCustomTokensOk)
        }

        let msg = ''
        msg += 'ApiProxy._getAll feesHash ' + (all.data.data.feesHash || 'none')
        msg += ' ratesHash ' + (all.data.data.ratesHash || 'none')
        msg += ' newsHash ' + (all.data.data.newsHash || 'none')
        msg += ' cbOrdersHash ' + (all.data.data.cbOrdersHash || 'none')
        msg += ' cbDataHash ' + (all.data.data.cbDataHash || 'none')
        await BlocksoftCryptoLog.log(msg)
    } else {
        await BlocksoftCryptoLog.log('ApiProxy._getAll no data')
    }
    return all
}

async function _getRates(params) {
    const link = config.proxy.apiEndpoints.baseURL + '/rates'
    return BlocksoftAxios.get(link)
}

async function _checkServerTimestamp(serverTimestamp) {

    CACHE_SERVER_TIME_DIFF = new Date().getTime() - serverTimestamp
    if (Math.abs(CACHE_SERVER_TIME_DIFF) > 6000) {
        await Log.daemon('ApiProxy will ask server time diff ' + CACHE_SERVER_TIME_DIFF + ' with time ' + serverTimestamp)
        CACHE_SERVER_TIME_NEED_TO_ASK = true
    } else {
        CACHE_SERVER_TIME_NEED_TO_ASK = false
    }
}

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_LAST_TIME = false
let CACHE_LAST_WALLET = false
let CACHE_DATA = false
let CACHE_SERVER_TIME_NEED_TO_ASK = false
let CACHE_SERVER_TIME_DIFF = false // diff to make

export default {

    getAll: async (params = {}) => {
        if (typeof params === 'undefined' || typeof params.force === 'undefined' || !params) {
            if (typeof params === 'undefined' || typeof params.onlyRates === 'undefined') {
                if (MarketingEvent.DATA.LOG_WALLET !== CACHE_LAST_WALLET) {
                    CACHE_LAST_TIME = false
                }
            }
            if (CACHE_LAST_TIME) {
                const now = new Date().getTime()
                const diff = now - CACHE_LAST_TIME
                if (diff < CACHE_VALID_TIME) {
                    return CACHE_DATA
                }
            }
        }
        if (config.debug.appErrors) {
            console.log(new Date().toISOString() + ' ApiProxy ' + JSON.stringify(params))
        }

        let all = false
        let index = 0
        // console.log('ApiProxy start ' + new Date().toISOString() + ' last cache ' + new Date(CACHE_LAST_TIME).toISOString(), JSON.parse(JSON.stringify(params)))
        do {
            if (typeof params !== 'undefined' && typeof params.onlyRates !== 'undefined') {
                all = await _getRates(params)
            } else {
                all = await _getAll(params)
            }
            let serverTimestamp = false
            try {
                if (typeof all.data.status !== 'undefined') {
                    if (typeof all.data.subdata !== 'undefined' && typeof all.data.subdata.serverTimestamp !== 'undefined') {
                        if (typeof params === 'undefined') {
                            params = {}
                        }
                        // error timestamp
                        params.timestamp = all.data.subdata.serverTimestamp
                        serverTimestamp = all.data.subdata.serverTimestamp
                        all = false
                    } else if (typeof all.data.serverTimestamp !== 'undefined') {
                        // error timestamp
                        params.timestamp = all.data.serverTimestamp
                        serverTimestamp = all.data.serverTimestamp
                    } else if (all.data.status !== 'success') {
                        throw new Error(JSON.stringify(all.data))
                    }

                }
            } catch (e) {
                throw new Error(e.message + ' while _getServerTimestamp')
            }
            try {
                if (serverTimestamp) {
                    _checkServerTimestamp(serverTimestamp)
                }
            } catch (e) {
                throw new Error(e.message + ' while _checkServerTimestamp')
            }
            index++
        } while (all === false && index < 3)

        if (!all || typeof all.data === 'undefined') {
            throw new Error('something wrong with proxy')
        }
        const res = all.data.data

        if (res) {
            if (typeof params === 'undefined' || typeof params.onlyRates === 'undefined') {
                CACHE_DATA = res
                CACHE_LAST_TIME = new Date().getTime()
                CACHE_LAST_WALLET = MarketingEvent.DATA.LOG_WALLET
                if (params.source.indexOf('UpdateCardsDaemon') === -1) {
                    await UpdateCardsDaemon.updateCardsDaemon(params, res)
                }
                if (params.source.indexOf('UpdateWalletsDaemon') === -1) {
                    await UpdateWalletsDaemon.updateWalletsDaemon(params, res)
                }
            }
        }
        // console.log('ApiProxy finish ' + new Date().toISOString(), JSON.parse(JSON.stringify(params)))
        return res
    },

    async getServerTimestampIfNeeded() {
        await Log.log('ApiProxy.getServerTimestampIfNeeded will ask time from server ' + (CACHE_SERVER_TIME_NEED_TO_ASK ? ' need ask ' : ' no ask'))
        if (!CACHE_SERVER_TIME_NEED_TO_ASK) {
            return false
        }

        if (CACHE_SERVER_TIME_DIFF !== false) {
            return new Date().getTime() + -1 * CACHE_SERVER_TIME_DIFF
        }


        const link = `https://api.v3.trustee.deals/data/server-time`
        let msg = false
        try {
            const now = await BlocksoftAxios.get(link)
            if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                msg = now.data.serverTime
                const oldNow = +new Date()
                await Log.log('ApiV3.initData msg from server ' + msg + ' - old ' + oldNow + ' = ' + Math.abs(msg * 1 - oldNow * 1))
            } else {
                await Log.log('ApiV3.initData msg from server - no time ', now.data)
            }
        } catch (e) {
            // do nothing
        }
        return msg
    }
}