import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage'

import Cashback from './Cashback/Cashback'

import config from '../config/config'


export default {
    getExchangeData: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL

        return await sendRequest({
            url: `${baseUrl}/get-server-data`
        })
    },

    getExchangeOrders: async () => {
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest: apiEndpoints.baseURL

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

        const res = await axios.post(`${baseUrl}/get-statuses`, tmp)
        if(typeof res.data.state !== 'undefined' && res.data.state === 'fail'){
            res.data.cashbackToken = cashbackToken
            res.data.signedData = signedData
        }
        return res
    },
    getNBURates: async () => axios.get('https://testapiwallet.blocksoftlab.com/get-nbu-rates')
}

async function sendRequest(param) {
    const { url } = param
    let res = {}

    try {
        const { data } = await axios.post(url)

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
