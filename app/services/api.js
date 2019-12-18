import AsyncStorage from '@react-native-community/async-storage'
import axios from 'axios'

import Cashback from './Cashback/Cashback'

import config from '../config/config'
import Log from './Log/Log'
import BlocksoftAxios from "../../crypto/common/BlocksoftAxios";

export default {

    validateCard: async (data) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        return fetch(`${baseUrl}/validate-card`, {
            method: "POST",
            headers: {
                'Accept': 'multipart/form-data',
                'Content-Type': 'multipart/form-data',
            },
            body: data
        })
    },

    getExchangeData: async () => {
        const {mode: exchangeMode, apiEndpoints} = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        const token = await AsyncStorage.getItem('cashbackToken')

        return axios.get(`${baseUrl}/get-base-data?cashbackToken=${token}`)
    },

    getExchangeOrders: async () => {
        const {mode: exchangeMode, apiEndpoints} = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

        const signedData = await Cashback.createSignature()

        const cashbackToken = Cashback.getCashbackToken()

        if (!cashbackToken) {
            throw new Error('No cashbackToken')
        }
        const tmp = {
            cashbackToken,
            signedData,
            timestamp: +new Date()
        }

        const link = `${baseUrl}/get-statuses`
        Log.log('DMN/Api getExchangeOrders axios ' + link)
        const res = await axios.post(link, tmp)
        if (typeof res.data.state !== 'undefined' && res.data.state === 'fail') {
            res.data.cashbackToken = cashbackToken
            res.data.signedData = signedData
            res.data.publicAddress = Cashback.getPublicAddress()
        }

        return res
    },
    getNBURates: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL
        return axios.get(`${baseUrl}/get-nbu-rates`)
    },
    createOrder: async (data) => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL
        return axios.post(`${baseUrl}/create-order`, data)
    }
}

async function sendRequest(param) {
    const {url} = param
    let res = {}

    try {
        Log.log(`DMN/Api sendRequest ${url}`)
        const {data} = await axios.post(url)

        res.data = data.data
        res.status = 'success'
    } catch (err) {
        res.status = 'fail'
        res.message = JSON.stringify(err)
        console.log('api.sendRequest fail')
        console.log(res)
    }

    return res
}
