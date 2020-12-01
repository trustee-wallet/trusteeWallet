/**
 * @version 0.11
 */
import config from '../../config/config'

import AsyncStorage from '@react-native-community/async-storage'

import Log from '../Log/Log'
import { strings, sublocale } from '../i18n'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'

import MarketingEvent from '../Marketing/MarketingEvent'


export default {

    validateCard: async (data, forceMode = false) => {
        let { mode: exchangeMode, apiEndpoints } = config.exchange
        if (typeof forceMode !== 'undefined' && forceMode) {
            exchangeMode = forceMode
        }
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        return fetch(`${baseUrl}/validate-card`, {
            method: 'POST',
            credentials: 'same-origin',
            mode: 'same-origin',
            headers: {
                'Accept': 'multipart/form-data',
                'Content-Type': 'multipart/form-data'
            },
            body: data
        })
    },

    setExchangeStatus: async (orderId, status) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        const cashbackToken = CashBackUtils.getWalletToken()
        const link = `${baseUrl}/365cash/handle-success-order`
        Log.log('Api setExchangeStatus axios ' + link)
        const data = {orderId, status, cashbackToken}
        return BlocksoftAxios.post(link, data, false)
    },

    getExchangeData: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        const cashbackToken = CashBackUtils.getWalletToken()
        const link = `${baseUrl}/get-base-data?cashbackToken=${cashbackToken}`
        Log.log('Api getExchangeData axios ' + link)
        return BlocksoftAxios.get(link, false, false)
    },

    getExchangeOrders: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        const signedData = await CashBackUtils.createWalletSignature(true)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const cashbackToken = CashBackUtils.getWalletToken()
        if (!cashbackToken) {
            throw new Error('No cashbackToken for getExchangeOrders')
        }
        const tmp = {
            cashbackToken,
            signedData,
            timestamp: +new Date()
        }

        const link = `${baseUrl}/get-statuses`

        let res = false
        try {
            let index = 0
            let serverTime = 0
            const MAX_TRY_SERVER_TIME = 4
            do {
                index++
                Log.daemon('Api getExchangeOrders axios ' + index + ' ' + link)
                try {
                    res = await BlocksoftAxios.post(link, tmp, false)
                    if (!res) {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } catch (e) {
                    Log.daemon('Api getExchangeOrders error ' + e.message)
                    if (typeof e.subdata === 'undefined') {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                    res = e.subdata
                }

                if (typeof res.errorMsg !== 'undefined') {
                    Log.daemon('Api getExchangeOrders error ', res)
                    if (typeof res.serverTimestamp !== 'undefined' && res.serverTimestamp) {
                        serverTime = res.serverTimestamp
                        res = false
                        if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                            throw new Error('UI_ERROR_IME_ERROR')
                        } else {
                            Log.daemon('Api getExchangeOrders will retry with time ' + serverTime)
                            tmp.signedData = await CashBackUtils.createWalletSignature(true, serverTime)
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
            res.data.cashbackToken = cashbackToken
            res.data.signedData = signedData
            res.data.publicAddress = CashBackUtils.getWalletPublicAddress()
            return res.data
        }
        return res
    },

    createOrder: async (data) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        data.cashbackToken = CashBackUtils.getWalletToken()
        data.deviceToken = MarketingEvent.DATA.LOG_TOKEN
        data.walletHash = MarketingEvent.DATA.LOG_WALLET
        if (data.exchangeWayId.toString().indexOf('ksu_') !== -1) {
            data.exchangeWayId = data.exchangeWayId.substr(4)
        }
        const link = `${baseUrl}/create-order`
        return BlocksoftAxios.post(link, data)
    },

    checkError: (e, msg, dataToSend, errorMsgExt) => {
        const tmp = e.message.toLowerCase()
        if (tmp.indexOf('invalid outamount param') !== -1 || tmp.indexOf('invalid inamount param') !== -1 || tmp.indexOf('out_or_range') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidExchangeAmount')
        } else if (tmp.indexOf('enough liquidity in pair') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidExchangeAmountTooBig')
        } else if (tmp.indexOf('card has not been validated') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidCard')
        } else if (tmp.indexOf('timeout') !== -1) {
            msg = strings('confirmScreen.confirmScreenTimeout')
        } else if (tmp.indexOf('invalid outdestination param') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidOut')
        } else if (tmp.indexOf('is temporary disabled') !== -1) {
            msg = strings('confirmScreen.confirmScreenTemporaryOff')
        } else if (tmp.indexOf('adv cash account is not verified') !== -1) {
            msg = strings('confirmScreen.confirmScreenAdvNotVerified')
        } else if (tmp.indexOf('invalid cardnumber param') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
            Log.err('Api.checkError ' + msg + ' error ' + tmp + ' ' + JSON.stringify(dataToSend) + ' ALL DATA ' + JSON.stringify(errorMsgExt))// will be removed after tests
        } else if (tmp.indexOf('failed_to_create_cryptoaddress') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
        } else if (tmp.indexOf('failed: visa_mc_p2p') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
        } else if (tmp.indexOf('invalid address') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
            Log.err('Api.checkError ' + msg + ' error ' + tmp + ' ' + JSON.stringify(dataToSend) + ' ALL DATA ' + JSON.stringify(errorMsgExt)) // will be removed after tests
        } else {
            Log.err('Api.checkError ' + msg + ' error ' + tmp + ' ' + JSON.stringify(dataToSend) + ' ALL DATA ' + JSON.stringify(errorMsgExt))
            msg = strings(msg)
        }

        return msg
    },

    /**
     *
     * @param userNotifications[]
     * @returns {Promise<{createdAt: string, currencyCode: string, data : any, type : string, group: string, image: string, name: string, needPopUp: boolean, priority: string, serverId: string, source: string, text: string, title: string, url: string}[]>}
     */

    getNews: async (userNotifications) => {
        const baseUrl = 'https://notifications.trustee.deals/notifications/history'
        const signedData = await CashBackUtils.createWalletSignature(true)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const data = {
            cashbackToken: Log.DATA.LOG_CASHBACK,
            deviceToken: Log.DATA.LOG_TOKEN,
            sign : signedData,
            userNotifications : userNotifications ? userNotifications : []
        }
        try {
            const res = await BlocksoftAxios.post(`${baseUrl}`, data, false)
            if (!res || typeof res.data === 'undefined' || !res.data || typeof res.data[0] === 'undefined') {
                return []
            }
            console.log('data', res.data)
            return res.data
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Api.getNews error ', data, e)
            }
            Log.log('Api.getNews error ' + e.message, data)
            return []
        }
    },

    getCashbackData: async () => {
        const signature = await CashBackUtils.createWalletSignature(true)
        if (!signature) {
            throw new Error('UI_ERROR_CASHBACK_SIGN_ERROR')
        }
        const cashbackToken = CashBackUtils.getWalletToken()
        const parentToken = CashBackUtils.getParentToken()
        const deviceToken = MarketingEvent.DATA.LOG_TOKEN

        const getStatisticsReqData = {
            deviceToken,
            locale: sublocale(),
            signedData: signature,
            timestamp: +new Date()
        }

        if (typeof cashbackToken !== 'undefined' && cashbackToken !== null) {
            getStatisticsReqData.cashbackToken = cashbackToken
        }

        if (typeof parentToken !== 'undefined' && parentToken !== null && parentToken) {
            getStatisticsReqData.parentToken = parentToken
        }

        const link = `${CashBackSettings.getBase()}/get-cb-data`

        let res
        let index = 0
        let serverTime = 0
        const MAX_TRY_SERVER_TIME = 4
        do {
            index++
            Log.daemon('Api getCashbackData axios ' + index + ' ' + link)
            res = await BlocksoftAxios.postWithoutBraking(link, getStatisticsReqData)
            if (!res || typeof res.data === 'undefined' || !res.data) {
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            }
            if (typeof res.data.data === 'undefined' || !res.data.data) {
                Log.daemon('Api getCashbackData error ', res.data)
                if (typeof res.data.serverTimestamp !== 'undefined' && res.data.serverTimestamp) {
                    serverTime = res.data.serverTimestamp
                    res = false
                    if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                        throw new Error('UI_ERROR_CASHBACK_TIME_ERROR')
                    } else {
                        Log.daemon('Api getCashbackData will retry with time ' + serverTime)
                        getStatisticsReqData.signedData = await CashBackUtils.createWalletSignature(true, serverTime)
                    }
                } else {
                    throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
                }
            } else {
                // finish ok
                break
            }
        } while (index < MAX_TRY_SERVER_TIME)

        if (!res || typeof res.data === 'undefined' || !res.data) {
            throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
        }
        return res.data.data
    }

}
