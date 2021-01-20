/**
 * @version 0.11
 */
import config from '../../config/config'

import Log from '../Log/Log'
import { strings, sublocale } from '../i18n'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'

import MarketingEvent from '../Marketing/MarketingEvent'
import AppNotificationListener from '../AppNotification/AppNotificationListener'


export default {

    validateCard: async (data, forceMode = false) => {
        let { mode: exchangeMode, apiEndpoints } = config.exchange
        if (typeof forceMode !== 'undefined' && forceMode) {
            exchangeMode = forceMode
        }
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        console.log(new Date().toISOString() + ' Api.validateCard ' + baseUrl)

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

    getExchangeOrders: async (_requestAuthHash) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        const signedData = await CashBackUtils.createWalletSignature(true, false, _requestAuthHash)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const cashbackToken = signedData.cashbackToken
        if (!cashbackToken) {
            throw new Error('No cashbackToken for getExchangeOrders')
        }
        const tmp = {
            cashbackToken,
            signedData,
            timestamp: +new Date()
        }

        const link = `${baseUrl}/get-statuses`
        console.log(new Date().toISOString() + ' Api.getExchangeOrders ' + link, tmp)

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
                            const tmp2 = await CashBackUtils.createWalletSignature(true, serverTime, _requestAuthHash)
                            tmp.signedData = tmp2
                            tmp.cashbackToken = tmp2.cashbackToken
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
        data.rand = new Date().getTime() + '_' + Math.random()
        const link = `${baseUrl}/create-order`
        let res
        let index = 0
        let isOk = false
        do {
            isOk = true
            res = await BlocksoftAxios.post(link, data)
            if (typeof res.data === 'undefined') {
                isOk = false
            } else if (res.data.rand !== data.rand || res.data.cashbackToken !== data.cashbackToken) {
                await Log.log('Api.createOrder error result ' + index, { data, result: res.data, headers: res.headers })
                isOk = false
            }
            index++
        } while (!isOk && index < 10)
        if (!isOk) {
            if (res && typeof res.data !== 'undefined') {
                Log.err('Api.createOrder error with rand ', { data, result: res.data, headers: res.headers })
            } else {
                Log.err('Api.createOrder error without res ', data)
            }
            throw new Error('UI_ERROR_NETWORK_ERROR')
        }
        return res
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

    activatePromo: async (promoCode) => {
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
            timestamp: +new Date(),
            promoCode
        }
        if (typeof cashbackToken !== 'undefined' && cashbackToken !== null) {
            getStatisticsReqData.cashbackToken = cashbackToken
        }
        if (typeof parentToken !== 'undefined' && parentToken !== null && parentToken) {
            getStatisticsReqData.parentToken = parentToken
        }

        const link = `${CashBackSettings.getBase()}/activate-promo`
        let res
        let index = 0
        let serverTime = 0
        const MAX_TRY_SERVER_TIME = 4
        do {
            index++
            Log.daemon('Api activatePromo axios ' + index + ' ' + link)
            try {
                res = await BlocksoftAxios.post(link, getStatisticsReqData)
            } catch (e) {
                if (e.message.indexOf('checkforduplicate') !== -1) {
                    throw new Error('UI_ERROR_CASHBACK_PROMO_DUPLICATE')
                } else if (e.message.indexOf('no info about promo code')) {
                    throw new Error('UI_ERROR_CASHBACK_PROMO_NOT_FOUND')
                } else {
                    Log.daemon('Api activatePromo error ' + cashbackToken + ' ' + promoCode + ' ' + e.message)
                }
            }
            if (!res || typeof res.data === 'undefined' || !res.data) {
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            }
            if (typeof res.data.description === 'undefined' || !res.data.description) {
                Log.daemon('Api activatePromo error ', res.data)
                if (typeof res.data.serverTimestamp !== 'undefined' && res.data.serverTimestamp) {
                    serverTime = res.data.serverTimestamp
                    res = false
                    if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                        throw new Error('UI_ERROR_CASHBACK_TIME_ERROR')
                    } else {
                        Log.daemon('Api activatePromo will retry with time ' + serverTime)
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
        return res.data.description
    }

}
