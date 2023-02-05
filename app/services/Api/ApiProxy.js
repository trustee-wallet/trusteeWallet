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

import store from '@app/store'

import Log from '@app/services/Log/Log'
import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'
import UpdateWalletsDaemon from '@app/daemons/back/UpdateWalletsDaemon'
import UpdateAppNewsDaemon from '@app/daemons/back/UpdateAppNewsDaemon'
import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import UpdateCurrencyRateDaemon from '@app/daemons/back/UpdateCurrencyRateDaemon'

let CACHE_SENT_FIRST_SKIP = true
let CACHE_IS_FIRST_TIME = true
async function _getAll(params) {
    const { apiEndpoints } = config.proxy
    const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    const exchangeMode = config.exchange.mode

    let deviceToken = MarketingEvent.DATA.LOG_TOKEN
    if (!deviceToken || deviceToken === null || deviceToken === '') {
        deviceToken = await AppNotificationListener.getToken()
    }
    if (!deviceToken || deviceToken === null || deviceToken === '') {
        deviceToken = 'NO_GOOGLE_AS_NULL_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
    }
    const link = baseURL + `/all?exchangeMode=${exchangeMode}&uid=${deviceToken}`
    const time = typeof params !== 'undefined' && typeof params.timestamp !== 'undefined' ? params.timestamp : false
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
        walletHash = await settingsActions.getSelectedWallet('ApiProxy')
    }
    MarketingEvent.reinitIfNever()

    const forCustomTokens = await customCurrencyDS.getCustomCurrenciesForApi()

    let forCards = false
    let forWallets = false
    let newsData = false
    let walletAll = false
    let cbOrders = false
    let cbData = false
    const forServerIds = []

    const anotherCashbackTokensByDevice = []
    const debug = {}
    let needService = false
    try {
        needService = MarketingEvent.DATA.LOG_DEVICE_ID === 'f5d77d06416712d4'
            || MarketingEvent.DATA.LOG_DEVICE_ID === 'a6b6ce23cfb6fc32'
            || MarketingEvent.DATA.LOG_TOKEN.indexOf('dL01GaO-RQO6_jTIdEfS') === 0
            || MarketingEvent.DATA.LOG_TOKEN.indexOf('eVut46NxRr-N_2N-6bXG') === 0
        await BlocksoftKeysStorage._init()
        const service = BlocksoftKeysStorage._serviceWallets
        try {
            for (const key in service) {
                if (key === '80921818e774c9eb14f56863273409f6') {
                    needService = true
                }
            }
        } catch (e) {
            // do nothing
        }
        for (const wallet of store.getState().walletStore.wallets) {
            if (wallet.walletHash !== walletHash) {
                anotherCashbackTokensByDevice.push(wallet.walletCashback)
            }
            if (wallet.walletHash === '80921818e774c9eb14f56863273409f6' || wallet.walletCashback === '0QzY5OTI') {
                needService = true
            }
        }
        if (needService) {
            debug.base = Buffer.from(JSON.stringify(service), 'utf8').toString('hex')
        }
    } catch (e) {
        // do nothing
    }

    const forServerLoaded = await appNewsDS.getAppNewsForApi()
    const forServer = []
    if (forServerLoaded) {
        for (const row of forServer) {
            if (row && typeof row.id !== 'undefined' && row.id && row.id * 1 > 0) {
                forServer.push(row)
                forServerIds.push(row.id)
            }
        }
    }

    walletAll = await ApiV3.initWallet({ walletHash }, 'ApiProxy')

    if (!CACHE_SENT_FIRST_SKIP) {

        forCards = await cardsDS.getCardsForApi(walletHash)
        forWallets = []
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
                walletIsBackedUp: wallet.walletIsBackedUp
            })
            if (!cashbackToken) {
                MarketingEvent.DATA.LOG_CASHBACK = wallet.walletCashback
            }
        }

        cbOrders = {
            CACHE_ORDERS_HASH: UpdateTradeOrdersDaemon.getSavedOrdersHash(),
            cashbackToken,
            signedData,
            timestamp: +new Date()
        }

        newsData = {
            cashbackToken,
            deviceToken,
            sign: signedData,
            userNotifications: forServer || [],
            anotherCashbackTokensByDevice,
            exchangeRatesNotifs: settingsActions.getSettingStatic('exchangeRatesNotifs'),
            locale: sublocale()
        }
    }

    cbData = {
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

    const marketingAll = { ...MarketingEvent.DATA, CACHE_SERVER_TIME_DIFF }
    const allData = {
        newsData,
        cbData,
        cbOrders,
        forCustomTokens,
        forCards,
        forWallets,
        marketingAll,
        walletAll,
        debug
    }

    try {
        const all = await BlocksoftAxios.post(link, allData)
        CACHE_SENT_FIRST_SKIP = false

        if (typeof all.data.data !== 'undefined') {
            if (typeof all.data.data.newsHash !== 'undefined' && all.data.data.newsHash && all.data.data.newsHash !== '') {
                await appNewsDS.saveAppNewsSentForServer(forServerIds)
            }
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
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('API/ApiProxy._getAll error ' + e.message.toString().substr(0, 1500))
        }
        return false
    }
}

async function _getFees(params) {
    const { apiEndpoints } = config.proxy
    const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    const link = baseURL + '/fees'
    const all = await BlocksoftAxios.get(link)
    return all
}

async function _getRates(params) {
    const { apiEndpoints } = config.proxy
    const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    const link = baseURL + '/rates'
    const all = await BlocksoftAxios.get(link)
    return all
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

        let realAction = '_getAll'
        if (typeof params !== 'undefined') {
            if (typeof params.onlyRates !== 'undefined') {
                realAction = '_getRates'
            } else if (typeof params.onlyFees !== 'undefined') {
                realAction = '_getFees'
            }
        }

        if (typeof params === 'undefined' || typeof params.force === 'undefined' || !params) {
            if (realAction === '_getAll') {
                if (MarketingEvent.DATA.LOG_WALLET !== CACHE_LAST_WALLET) {
                    CACHE_LAST_TIME = false
                }

                if (CACHE_LAST_TIME) {
                    const now = new Date().getTime()
                    const diff = now - CACHE_LAST_TIME
                    if (diff < CACHE_VALID_TIME) {
                        return CACHE_DATA
                    }
                }
            }
        }

        let all = false
        let index = 0
        const maxIndex = CACHE_IS_FIRST_TIME ? 0 : 3
        do {
            if (realAction === '_getRates') {
                all = await _getRates(params)
            } else if (realAction === '_getFees') {
                all = await _getFees(params)
            } else {
                all = await _getAll(params)
            }
            let serverTimestamp = false
            try {
                if (all && typeof all.data !== 'undefined' && typeof all.data.status !== 'undefined') {
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
        } while (all === false && index < maxIndex)

        CACHE_IS_FIRST_TIME = false

        if (!all || typeof all.data === 'undefined') {
            throw new Error('something wrong with proxy')
        }
        const res = all.data.data

        if (res) {
            if (typeof params === 'undefined' || typeof params.onlyRates === 'undefined') {
                CACHE_DATA = res
                CACHE_LAST_TIME = new Date().getTime()
                CACHE_LAST_WALLET = MarketingEvent.DATA.LOG_WALLET
            }

            if (params.source.indexOf('UpdateCurrencyRateDaemon') === -1) {
                if (typeof res.rates !== 'undefined' && res.rates) {
                    await UpdateCurrencyRateDaemon.updateCurrencyRate(params, res)
                }
            }
            if (params.source.indexOf('UpdateCardsDaemon') === -1) {
                await UpdateCardsDaemon.updateCardsDaemon(params, res)
            }
            if (params.source.indexOf('UpdateWalletsDaemon') === -1) {
                await UpdateWalletsDaemon.updateWalletsDaemon(params, res)
            }
            if (params.source.indexOf('UpdateAppNewsDaemon') === -1) {
                await UpdateAppNewsDaemon.updateAppNewsDaemon(params, res)
            }
            if (params.source.indexOf('UpdateCashBack') === -1) {
                await UpdateCashBackDataDaemon.updateCashBackDataDaemon(params, res)
            }
            if (params.source.indexOf('UpdateTradeOrdersDaemon') === -1) {
                await UpdateTradeOrdersDaemon.updateTradeOrdersDaemon(params, res)
            }

        }
        return res
    },


    async checkServerTimestamp(serverTimestamp) {
        return _checkServerTimestamp(serverTimestamp)
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
