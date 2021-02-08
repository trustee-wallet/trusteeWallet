/**
 * @version 0.32
 */
import config from '../../config/config'

import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'

import { sublocale } from '../i18n'

import MarketingEvent from '../Marketing/MarketingEvent'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import appNewsDS from '../../appstores/DataSource/AppNews/AppNews'
import AppNotificationListener from '../AppNotification/AppNotificationListener'
import ApiV3 from './ApiV3'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import customCurrencyDS from '../../appstores/DataSource/CustomCurrency/CustomCurrency'

async function _getAll(params) {
    const { mode: exchangeMode } = config.exchange
    const link = config.proxy.apiEndpoints.baseURL + `/all?exchangeMode=${exchangeMode}`

    let deviceToken = MarketingEvent.DATA.LOG_TOKEN
    if (!deviceToken) {
        await AppNotificationListener.getToken()
        deviceToken = MarketingEvent.DATA.LOG_TOKEN
    }
    if (!deviceToken || deviceToken === null) {
        deviceToken = 'NO_GOOGLE_AS_NULL_' + (new Date().getTime()) + '_' + (Math.ceil(Math.random() * 100000))
    }
    const time = typeof params !== 'undefined' && typeof params.timestamp !== 'undefined' ? params.timestamp : false
    const signedData = await CashBackUtils.createWalletSignature(true, time)
    if (!signedData) {
        throw new Error('No signed for getNews')
    }
    const cashbackToken = CashBackUtils.getWalletToken()
    const parentToken = CashBackUtils.getParentToken()

    const forCustomTokens = await customCurrencyDS.getCustomCurrenciesForApi()
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

    const newsData = {
        cashbackToken,
        deviceToken,
        sign: signedData,
        userNotifications: forServer ? forServer : [],
        exchangeRatesNotifs : await settingsActions.getSetting('exchangeRatesNotifs'),
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
        cashbackToken,
        signedData,
        timestamp: +new Date()
    }

    const allData = {
        newsData,
        cbData,
        cbOrders,
        forCustomTokens,
        marketingAll : MarketingEvent.DATA,
        walletAll : await ApiV3.initWallet(MarketingEvent.DATA.LOG_WALLET)
    }

    const all = await BlocksoftAxios.post(link, allData)
    if (typeof all.data.data !== 'undefined') {
        all.data.data.forServerIds = forServerIds
        if (typeof all.data.data.forCustomTokensOk !== 'undefined' && all.data.data.forCustomTokensOk && all.data.data.forCustomTokensOk.length > 0) {
            await customCurrencyDS.savedCustomCurrenciesForApi(all.data.data.forCustomTokensOk)
        }
    }
    return all
}

async function _getRates(params) {
    const link = config.proxy.apiEndpoints.baseURL + '/rates'
    return BlocksoftAxios.get(link)
}

const CACHE_VALID_TIME = 60000 // 1 minute
let CACHE_LAST_TIME = false
let CACHE_LAST_WALLET = false
let CACHE_DATA = false

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
            if (typeof all.data.status !== 'undefined') {
                if (all.data.status !== 'success') {
                    if (typeof all.data.serverTimestamp !== 'undefined') {
                        params.timestamp = all.data.serverTimestamp
                        all = false
                    } else if (typeof all.data.subdata !== 'undefined' && typeof all.data.subdata.serverTimestamp !== 'undefined') {
                        if (typeof params === 'undefined') {
                            params = {}
                        }
                        params.timestamp = all.data.subdata.serverTimestamp
                        all = false
                    } else {
                        throw new Error(JSON.stringify(all.data))
                    }
                }
            }
            index++
        } while (all === false && index < 3)

        if (!all || typeof all.data === 'undefined') {
            throw new Error('something wrong with proxy')
        }
        const res = all.data.data

        if (typeof params === 'undefined' || typeof params.onlyRates === 'undefined') {
            CACHE_DATA = res
            CACHE_LAST_TIME = new Date().getTime()
            CACHE_LAST_WALLET = MarketingEvent.DATA.LOG_WALLET
        }
        // console.log('ApiProxy finish ' + new Date().toISOString(), JSON.parse(JSON.stringify(params)))
        return res
    }
}
