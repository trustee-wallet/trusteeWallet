import config from '../../../app/config/config'
import { Fio, Ecc } from '@fioprotocol/fiojs'
import { TextDecoder, TextEncoder } from 'text-encoding'
import { FIOSDK } from '@fioprotocol/fiosdk'

const axios = require('axios')

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const DERIVE_PATH = "m/44'/235'/0'/0/0";

const fetchJson = async (uri, opts = {}) => {
    // eslint-disable-next-line no-undef
    return fetch(uri, opts)
}

const getFioSDK = (publicKey, privateKey) => {
    const { apiEndpoints: { baseURL } } = config.fio

    return  new FIOSDK(privateKey, publicKey, 'http://testnet.fioprotocol.io/v1/', fetchJson)
};

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

export const getPubAddress = async (fioAddress, chainCode, tokenCode) => {
    try {
        const response = await getFioSDK().getPublicAddress(fioAddress, chainCode, tokenCode)
        return response['public_address']
    } catch (e) {
        console.warn('FIO getPubFioAddress error: ', e)
        return null
    }
}

export const getFioName = async (fioPublicKey) => {
    try {
        const response = await getFioSDK().getFioNames(fioPublicKey)
        const [ fioAddress ] = response['fio_addresses'] || []
        return fioAddress['fio_address']
    } catch (e) {
        console.warn('FIO getFioNames error: ', e)
        return null
    }
}

export const getFioBalance = async (fioPublicKey) => {
    try {
        const response = await getFioSDK().getFioBalance(fioPublicKey)
        return response['balance'] || 0
    } catch (e) {
        console.warn('FIO getFioBalance error: ', e)
        return 0
    }
}

export const getSentFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    const { apiEndpoints: { baseURL } } = config.fio

    try {
        // TODO change to SDK
        // const response = await getFioSDK(fioPublicKey, "5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu")
        //     .getSentFioRequests(limit, offset)

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

export const addPubAddress = async () => {
    const maxFee =  await getFioSDK().getFeeForAddPublicAddress("kir@fiotestnet")
    const response = await getFioSDK("FIO5xbYYdNs5a7Fe5nmkb7BeUFjpXYgkmJus8NMZUAeNyt8jgsEwB", "5JmNyktQYEmG86Pd5Ymgx9YHxhRedpcfmMNugTZR4D9G3kPL3f1").addPublicAddress(
        "kir@fiotestnet",
        "BTC",
        "BTC",
        "1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs",
        maxFee,
    )

    console.log(response)
}
