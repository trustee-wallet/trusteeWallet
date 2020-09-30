import config from '../../../app/config/config'

const axios = require('axios')

export const isFioAddressRegistered = async (address) => {
    const { apiEndpoints: { baseURL } } = config.fio

    if (!address || !address.includes('@')) {
        return false;
    }

    try {
        const response = await axios.post(`${baseURL}/avail_check`, {
            'fio_name': address
        })
        return response.data && response.data['is_registered'] === 1
    } catch (e) {
        console.warn('FIO sFioAddressRegistered error: ', e);
        return false
    }
}

export const getPubFioAddress = async (fioAddress, chainCode, tokenCode) => {
    const { apiEndpoints: { baseURL } } = config.fio

    try {
        const response = await axios.post(`${baseURL}/get_pub_address`, {
            'fio_address': fioAddress,
            'chain_code': chainCode,
            'token_code': tokenCode
        })
        return response.data && response.data['public_address']
    } catch (e) {
        console.warn('FIO getPubFioAddress error: ', e);
        return null
    }
}

export const getFioNames = async (fioPublicKey) => {
    const { apiEndpoints: { baseURL } } = config.fio

    try {
        const response = await axios.post(`${baseURL}/get_fio_names`, {
            'fio_public_key': fioPublicKey,
        })
        return response.data && response.data['fio_addresses'] || []
    } catch (e) {
        console.warn('FIO getFioNames error: ', e);
        return []
    }
}

export const getSentFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    const { apiEndpoints: { baseURL } } = config.fio

    try {
        const response = await axios.post(`${baseURL}/get_sent_fio_requests`, {
            'fio_public_key': fioPublicKey,
            'limit': limit,
            'offset': offset
        })
        return response.data
    } catch (e) {
        console.warn('FIO getSentFioRequests error: ', e);
        return {
            requests: [],
        }
    }
}
