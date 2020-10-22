import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { getFioSdk } from './FioSdkWrapper'
import config from '../../../app/config/config'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import { Fio } from '@fioprotocol/fiojs'

export const resolveChainCode = (currencyCode, currencySymbol) => {
    let chainCode = currencyCode
    if (typeof currencyCode !== 'undefined' && currencyCode !== currencySymbol) {
        const tmp = currencyCode.split('_')
        if (typeof tmp[0] !== 'undefined' && tmp[0]) {
            chainCode = tmp[0]
        }
    }
    return chainCode
}

export const resolveCryptoCodes = (currencyCode) => {
    let chainCode = currencyCode
    let currencySymbol = currencyCode
    const tmp = currencyCode.split('_')
    if (typeof tmp[0] !== 'undefined' && tmp[0] && tmp[1]) {
        chainCode = tmp[0]
        currencySymbol = tmp[1]
    }
    return {
        chain_code: chainCode,
        token_code: currencySymbol
    }
}

export const isFioAddressRegistered = async (address) => {
    if (!address || !address.includes('@')) {
        return false;
    }

    try {
        const response = await getFioSdk().isAvailable(address)
        return response['is_registered'] === 1
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO sFioAddressRegistered')
        return false
    }
}

export const getPubAddress = async (fioAddress, chainCode, tokenCode) => {
    try {
        const response = await getFioSdk().getPublicAddress(fioAddress, chainCode, tokenCode)
        return response['public_address']
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getPubFioAddress')
        return null
    }
}

/**
 * Returns FIO Addresses and FIO Domains owned by this public key.
 *
 * @param fioPublicKey FIO public key of owner.
 * @return Promise<[ { fio_address:*, expiration:* } ]>
 */
export const getFioNames = async (fioPublicKey) => {
    try {
        const response = await getFioSdk().getFioNames(fioPublicKey)
        return response['fio_addresses'] || []
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getFioNames')
        return []
    }
}

export const getFioBalance = async (fioPublicKey) => {
    try {
        const response = await getFioSdk().getFioBalance(fioPublicKey)
        return response['balance'] || 0
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getFioBalance')
        return 0
    }
}

export const getSentFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    try {
        BlocksoftCryptoLog.log(`FIO getSentFioRequests started ${fioPublicKey}`)
        const response = await getFioSdk().getSentFioRequests(limit, offset)
        const requests = response['requests'] || []
        return requests.sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp));
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getSentFioRequests')
        return []
    }
}

export const getPendingFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    try {
        BlocksoftCryptoLog.log(`FIO getPendingFioRequests started ${fioPublicKey}`)
        const response = await getFioSdk().getPendingFioRequests(limit, offset)
        const requests = response['requests'] || []
        return requests.sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp));
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getPendingFioRequests')
        return []
    }
}

/**
 * This call allows a public address of the specific blockchain type to be added to the FIO Address.
 *
 * @param fioName FIO Address which will be mapped to public address.
 * @param chainCode Blockchain code for blockchain hosting this token.
 * @param tokenCode Token code to be used with that public address.
 * @param publicAddress The public address to be added to the FIO Address for the specified token.
 */
export const addCryptoPublicAddress = async ({fioName, chainCode, tokenCode, publicAddress}) => {
    try {
        const { fee = 0 } = await getFioSdk().getFeeForAddPublicAddress(fioName)
        const response = await getFioSdk().addPublicAddress(
            fioName,
            chainCode,
            tokenCode,
            publicAddress,
            fee,
            null
        )
        const isOK = response['status'] === 'OK'
        if (!isOK) {
            await BlocksoftCryptoLog.log('FIO addPublicAddress error', response)
        }
        return isOK
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO addPubAddress')
    }
}

export const addCryptoPublicAddresses = async ({fioName, publicAddresses}) => {
    try {
        const { fee = 0 } = await getFioSdk().getFeeForAddPublicAddress(fioName)
        const response = await getFioSdk().addPublicAddresses(
            fioName,
            publicAddresses,
            fee,
            null
        )
        const isOK = response['status'] === 'OK'
        if (!isOK) {
            await BlocksoftCryptoLog.log('FIO addPublicAddress error', response)
        }
        return isOK
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO addPubAddress')
    }
}


/**
 * Create a new funds request on the FIO chain.
 *
 * @param payerFioAddress FIO Address of the payer. This address will receive the request and will initiate payment.
 * @param payeeFioAddress FIO Address of the payee. This address is sending the request and will receive payment.
 * @param payeeTokenPublicAddress Payee's public address where they want funds sent.
 * @param amount Amount requested.
 * @param chainCode Blockchain code for blockchain hosting this token.
 * @param tokenCode Code of the token represented in amount requested.
 * @param memo
 */
export const requestFunds = async ({payerFioAddress, payeeFioAddress, payeeTokenPublicAddress, amount, chainCode, tokenCode, memo}) => {
    try {
        BlocksoftCryptoLog.log(`FIO requestFunds started ${payerFioAddress} -> ${payeeFioAddress} ${amount} ${tokenCode} (${chainCode})`)
        const { fee = 0 } = await getFioSdk().getFeeForNewFundsRequest(payeeFioAddress)
        const response = await getFioSdk().requestFunds(
            payerFioAddress,
            payeeFioAddress,
            payeeTokenPublicAddress,
            amount,
            chainCode,
            tokenCode,
            memo,
            fee,
            null,
            null,
            null,
            null,
        )

        await BlocksoftCryptoLog.log('FIO requestFunds result', response)
        return response
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO requestFunds')
        const errorMessage = e.json?.fields
            ? e.json?.fields[0].error
            : e.json?.message

        return {
            error: errorMessage || 'FIO request creation error'
        }
    }
}

export const getTransactions = async (publicKey) => {
    const { apiEndpoints: { historyURL } } = config.fio

    try {
        const accountHash = Fio.accountHash(publicKey);
        const response = await BlocksoftAxios.post(`${historyURL}get_actions`, {
            'account_name': accountHash,
            'pos': -1
        })
        return response?.data
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO getTransactions')
        return []
    }
}

export const transferTokens = async (addressTo, amount) => {
    try {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        const result = await getFioSdk().transferTokens(addressTo, amount, fee, null)
        return result['transaction_id']
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO transferTokens')
        const errorMessage = e.json?.fields
            ? e.json?.fields[0].error
            : e.json?.message
        throw new Error(errorMessage || 'FIO token transfer error')
    }
}

export const rejectFioFundsRequest = async (fioRequestId, payerFioAddress) => {
    try {
        const sdk = getFioSdk()
        const { fee = 0 } = await sdk.getFeeForRejectFundsRequest(payerFioAddress)
        const result = await sdk.rejectFundsRequest(`${fioRequestId}`, fee, null)
        return result['status'] === 'request_rejected'
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO rejectFioRequest')
    }
}

/**
 *
 * Records information on the FIO blockchain about a transaction that occurred on other blockchain, i.e. 1 BTC was sent on Bitcoin Blockchain, and both
 * sender and receiver have FIO Addresses. OBT stands for Other Blockchain Transaction
 *
 * @param fioRequestId ID of funds request, if this Record Send transaction is in response to a previously received funds request.  Send empty if no FIO Request ID
 * @param payerFioAddress FIO Address of the payer. This address initiated payment.
 * @param payeeFioAddress FIO Address of the payee. This address is receiving payment.
 * @param payerTokenPublicAddress Public address on other blockchain of user sending funds.
 * @param payeeTokenPublicAddress Public address on other blockchain of user receiving funds.
 * @param amount Amount sent.
 * @param chainCode Blockchain code for blockchain hosting this token.
 * @param tokenCode Code of the token represented in Amount requested, i.e. BTC.
 * @param obtId Other Blockchain Transaction ID (OBT ID), i.e Bitcoin transaction ID.
 */
export const recordFioObtData = async ({
                                           fioRequestId,
                                           payerFioAddress,
                                           payeeFioAddress,
                                           payerTokenPublicAddress,
                                           payeeTokenPublicAddress,
                                           amount,
                                           chainCode,
                                           tokenCode,
                                           obtId
                                       }) => {
    try {
        const sdk = getFioSdk()
        const { fee = 0 } = await sdk.getFeeForRecordObtData(payerFioAddress)
        const result = await sdk.recordObtData(fioRequestId, payerFioAddress, payeeFioAddress, payerTokenPublicAddress, payeeTokenPublicAddress, amount, chainCode, tokenCode, 'sent_to_blockchain', obtId, fee, null, null, null, null, null)
        return !!result['status']
    } catch (e) {
        await BlocksoftCryptoLog.err(e, JSON.stringify(e.json), 'FIO rejectFioRequest')
    }
}

