/**
 * @version 0.9
 */
import AsyncStorage from '@react-native-community/async-storage'
import Cashback from '../Cashback/Cashback'
import config from '../../config/config'

import Log from '../Log/Log'
import { sublocale } from '../i18n'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'


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

        const token = await AsyncStorage.getItem('cashbackToken')

        return BlocksoftAxios.get(`${baseUrl}/get-base-data?cashbackToken=${token}`, false, false)
    },

    getExchangeOrders: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        const signedData = await Cashback.createSignature()

        const cashbackToken = await AsyncStorage.getItem('cashbackToken')

        if (!cashbackToken) {
            throw new Error('No cashbackToken')
        }
        const tmp = {
            cashbackToken,
            signedData,
            timestamp: +new Date()
        }

        const link = `${baseUrl}/get-statuses`
        Log.log('Api.getExchangeOrders axios ' + link)
        const res = await BlocksoftAxios.postWithoutBraking(link, tmp)
        if (res && typeof res.data !== 'undefined' && typeof res.data.state !== 'undefined' && res.data.state === 'fail') {
            res.data.cashbackToken = cashbackToken
            res.data.signedData = signedData
            res.data.publicAddress = Cashback.getPublicAddress()
            return res.data
        }
        return res
    },

    createOrder: async (data) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        return BlocksoftAxios.post(`${baseUrl}/create-order`, data)
    },

    getNews: async (data) => {
        data.deviceToken = Log.LOG_TOKEN
        data.cashbackToken = Log.LOG_CASHBACK
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
    }

}
