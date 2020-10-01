import config from '../../../app/config/config'
import { Fio, Ecc } from '@fioprotocol/fiojs'
import { TextDecoder, TextEncoder } from 'text-encoding'

const axios = require('axios')

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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
        console.warn('FIO sFioAddressRegistered error: ', e)
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
        console.warn('FIO getPubFioAddress error: ', e)
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
        console.warn('FIO getFioNames error: ', e)
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
        const requests = response.data && response.data["requests"] || [];
        return requests.map(request => {
            const contentDecoded = decodeFioData({
                content: request["content"],
                payerPublicKey: request["payer_fio_public_key"],
                payeePrivateKey: "5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu",
            })
            return {
                ...request,
                contentDecoded,
            }
        })
    } catch (e) {
        console.warn('FIO getSentFioRequests error: ', e)
        return []
    }
}

export const decodeFioData = ({content, payeePrivateKey, payerPublicKey}) => {
    if (!content || !payeePrivateKey || !payerPublicKey) {
        return null;
    }

    try {
        const cipherAlice = Fio.createSharedCipher({privateKey: payeePrivateKey, publicKey: payerPublicKey, textEncoder, textDecoder})
        return cipherAlice.decrypt('new_funds_content', content)
    } catch (e) {
        console.warn('FIO decodeFioData error: ', e)
        return null
    }
}
