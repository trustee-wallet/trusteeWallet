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
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'


export default {

    validateCard: async (data) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
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
        data.deviceToken = Log.LOG_TOKEN
        data.walletHash = Log.LOG_WALLET
        if (data.exchangeWayId.toString().indexOf('ksu_') !== -1) {
            data.exchangeWayId = data.exchangeWayId.substr(4)
        }
        const link = `${baseUrl}/create-order`
        return BlocksoftAxios.post(link, data)
    },

    checkError: (e, msg, dataToSend, errorMsgExt) => {
        if (e.message.indexOf('invalid outamount param') !== -1 || e.message.indexOf('invalid inamount param') !== -1 || e.message.indexOf('ER_WARN_DATA_OUT_OF_RANGE') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidExchangeAmount')
        } else if (e.message.indexOf('enough liquidity in pair') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidExchangeAmountTooBig')
        } else if (e.message.indexOf('The card has not been validated') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidCard')
        } else if (e.message.indexOf('timeout') !== -1) {
            msg = strings('confirmScreen.confirmScreenTimeout')
        } else if (e.message.indexOf('invalid outdestination param') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidOut')
        } else if (e.message.indexOf('failed_to_create_cryptoaddress') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
        } else if (e.message.indexOf('failed: VISA_MC_P2P') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
        } else if (e.message.indexOf('invalid address') !== -1) {
            msg = strings('confirmScreen.confirmScreenInvalidAddress')
            Log.err('Api.checkError ' + msg + ' error ' + e.message + ' ' + JSON.stringify(dataToSend) + ' ' + errorMsgExt) // will be removed after tests
        } else {
            Log.err('Api.checkError ' + msg + ' error ' + e.message + ' ' + JSON.stringify(dataToSend) + ' ' + errorMsgExt)
            msg = strings(msg)
        }

        return msg
    },

    getNews: async (data) => {
        if (!Log.LOG_TOKEN || Log.LOG_TOKEN === 'false') {
            return false
        }
        data.cashbackToken = CashBackUtils.getWalletToken()
        data.exchangeCashbackToken = CashBackUtils.getWalletToken()
        data.deviceToken = Log.LOG_TOKEN
        data.otherDeviceTokens = await AsyncStorage.getItem('allPushTokens')
        data.platform = Log.LOG_PLATFORM
        data.version = Log.LOG_VERSION
        data.locale = sublocale()
        data.time = new Date().toLocaleTimeString()
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        try {
            const res = await BlocksoftAxios.post(`${baseUrl}/device-token-info`, data, false)
            if (!res || typeof res.data === 'undefined' || typeof res.data.status === 'undefined' || res.data.status !== 'success' || typeof res.data === 'undefined' || !res.data) {
                return false
            }
            return res.data
        } catch (e) {
            return false
        }
    },

    getCashbackData: async () => {
        const signature = await CashBackUtils.createWalletSignature(true)
        if (!signature) {
            throw new Error('UI_ERROR_CASHBACK_SIGN_ERROR')
        }
        const cashbackToken = CashBackUtils.getWalletToken()


        const parentToken = CashBackUtils.getParentToken()
        const deviceToken = Log.LOG_TOKEN

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
