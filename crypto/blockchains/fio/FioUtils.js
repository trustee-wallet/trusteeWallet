import config from '../../../app/config/config'
import { Fio } from '@fioprotocol/fiojs'
import { TextDecoder, TextEncoder } from 'text-encoding'
import { FIOSDK } from '@fioprotocol/fiosdk'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const DERIVE_PATH = "m/44'/235'/0'/0/0";

const fetchJson = async (uri, opts = {}) => {
    // eslint-disable-next-line no-undef
    return fetch(uri, opts)
}

const getFioSDK = (publicKey, privateKey) => {
    const { apiEndpoints: { baseURL } } = config.fio

    return new FIOSDK(privateKey, publicKey, baseURL, fetchJson)
};

export const isFioAddressRegistered = async (address) => {
    if (!address || !address.includes('@')) {
        return false;
    }

    try {
        const response = await getFioSDK().isAvailable(address)
        return response['is_registered'] === 1
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO sFioAddressRegistered')
        return false
    }
}

export const getPubAddress = async (fioAddress, chainCode, tokenCode) => {
    try {
        const response = await getFioSDK().getPublicAddress(fioAddress, chainCode, tokenCode)
        return response['public_address']
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO getPubFioAddress')
        return null
    }
}

export const getFioName = async (fioPublicKey) => {
    try {
        const response = await getFioSDK().getFioNames(fioPublicKey)
        const [ fioAddress ] = response['fio_addresses'] || []
        return fioAddress['fio_address']
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO getFioNames')
        return null
    }
}

export const getFioBalance = async (fioPublicKey) => {
    try {
        const response = await getFioSDK().getFioBalance(fioPublicKey)
        return response['balance'] || 0
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO getFioBalance')
        return 0
    }
}

export const getSentFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    const privateKey = '5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu'

    try {
        const response = await getFioSDK(fioPublicKey, privateKey).getSentFioRequests(limit, offset)
        return (response['requests'] || []).map(request => ({
            ...request,
            contentDecoded: request['content'] // TODO just for compatibility refactor to content and remove
        }))
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO getSentFioRequests')
        return []
    }
}

export const getPendingFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    const privateKey = '5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu'

    try {
        const response = await getFioSDK(fioPublicKey, privateKey).getPendingFioRequests(limit, offset)
        return (response['requests'] || []).map(request => ({
            ...request,
            contentDecoded: request['content'] // TODO just for compatibility refactor to content and remove
        }))
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO getPendingFioRequests')
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
        BlocksoftCryptoLog.err(e, e.json, 'FIO decodeFioData')
        return null
    }
}

/**
 * This call allows a public address of the specific blockchain type to be added to the FIO Address.
 *
 * @param fioName FIO Address which will be mapped to public address.
 * @param chainCode Blockchain code for blockchain hosting this token.
 * @param tokenCode Token code to be used with that public address.
 * @param publicAddress The public address to be added to the FIO Address for the specified token.
 * @param privateKey the fio private key of the client sending requests to FIO API.
 * @param publicKey the fio public key of the client sending requests to FIO API.
 */
export const addCryptoPublicAddress = async ({fioName, chainCode, tokenCode, publicAddress, publicKey, privateKey}) => {
    try {
        const maxFee = await getFioSDK().getFeeForAddPublicAddress(fioName)
        const response = await getFioSDK(publicKey, privateKey)
            .addPublicAddress(
                fioName,
                chainCode,
                tokenCode,
                publicAddress,
                maxFee['fee'] || 0,
                null
            )
        const isOK = response['status'] === 'OK'
        if (!isOK) {
            await BlocksoftCryptoLog.log('FIO addPublicAddress error', response)
        }
        return isOK
    } catch (e) {
        await BlocksoftCryptoLog.err(e, e.json, 'FIO addPubAddress')
    }
}
