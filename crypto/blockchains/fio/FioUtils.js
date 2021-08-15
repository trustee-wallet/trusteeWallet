import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { getFioSdk } from './FioSdkWrapper'
import config from '../../../app/config/config'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import { Fio } from '@fioprotocol/fiojs'
import { FIOSDK } from '@fioprotocol/fiosdk/src/FIOSDK'
import chunk from 'lodash/chunk'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

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

export const resolveChainToken = (currencyCode, extend) => {
    if (extend.currencyCode === 'BNB_SMART') {
        return 'SMART'
    }
    if (typeof extend.tokenBlockchain !== 'undefined') {
        if (extend.tokenBlockchain === 'BNB') {
            return 'SMART'
        }
    }
    return extend.currencySymbol
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

export const isFioAddressValid = (address) => {
    if (address) {
        try {
            FIOSDK.isFioAddressValid(address)
            return true
        } catch (e) {
        }
    }
    return false
}

export const isFioAddressRegistered = async (address) => {
    if (!isFioAddressValid(address)) {
        return false
    }

    try {
        const response = await getFioSdk().isAvailable(address)
        return response['is_registered'] === 1
    } catch (e) {
        formatError('FIO isFioAddressRegistered ', e)
        return false
    }
}

export const getPubAddress = async (fioAddress, chainCode, tokenCode) => {
    try {
        const response = await getFioSdk().getPublicAddress(fioAddress, chainCode, tokenCode)
        return response['public_address']
    } catch (e) {
        formatError('FIO getPubAddress', e)
        return null
    }
}

export const getAccountFioName = async () => {
    try {
        const sdk = getFioSdk()
        const fioPublicKey = sdk.getFioPublicKey()
        const response = await getFioSdk().getFioNames(fioPublicKey)
        const addresses = response['fio_addresses'] || []
        return addresses[0]?.fio_address
    } catch (e) {
        formatError('FIO.getAccountFioName ', e)
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
        formatError('FIO getFioNames', e)
        return []
    }
}

export const getFioBalance = async (fioPublicKey) => {
    try {
        const response = await getFioSdk().getFioBalance(fioPublicKey)
        return response['balance'] || 0
    } catch (e) {
        formatError('FIO getFioBalance', e)
        return 0
    }
}

export const getSentFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    try {
        BlocksoftCryptoLog.log(`FIO getSentFioRequests started ${fioPublicKey}`)
        const response = await getFioSdk().getSentFioRequests(limit, offset)
        const requests = response['requests'] || []
        return requests.sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp))
    } catch (e) {
        formatError('FIO getSentFioRequests', e)
        return []
    }
}

export const getPendingFioRequests = async (fioPublicKey, limit = 100, offset = 0) => {
    try {
        BlocksoftCryptoLog.log(`FIO getPendingFioRequests started ${fioPublicKey}`)
        const response = await getFioSdk().getPendingFioRequests(limit, offset)
        const requests = response['requests'] || []
        return requests.sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp))
    } catch (e) {
        formatError('FIO getPendingFioRequests', e)
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
export const addCryptoPublicAddress = async ({ fioName, chainCode, tokenCode, publicAddress }) => {
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
        formatError('FIO addPubAddress', e)
    }
}

export const addCryptoPublicAddresses = async ({ fioName, publicAddresses }) => {
    if (!publicAddresses || Object.keys(publicAddresses).length === 0) return true

    let isOK = true
    for await (const publicAddressesChunk of chunk(publicAddresses, 5)) {
        try {
            const { fee = 0 } = await getFioSdk().getFeeForAddPublicAddress(fioName)
            const response = await getFioSdk().addPublicAddresses(
                fioName,
                publicAddressesChunk,
                fee,
                null
            )

            if (response['status'] !== 'OK') {
                await BlocksoftCryptoLog.log('FIO addPublicAddress error', response)
                isOK = false
            }
        } catch (e) {
            formatError('FIO addPubAddress', e)
        }
    }
    return isOK
}

export const removeCryptoPublicAddresses = async ({ fioName, publicAddresses }) => {
    if (!publicAddresses || Object.keys(publicAddresses).length === 0) return true

    let isOK = true
    for await (const publicAddressesChunk of chunk(publicAddresses, 5)) {
        try {
            const { fee = 0 } = await getFioSdk().getFeeForRemovePublicAddresses(fioName)
            const response = await getFioSdk().removePublicAddresses(
                fioName,
                publicAddressesChunk,
                fee,
                null
            )

            if (response['status'] !== 'OK') {
                await BlocksoftCryptoLog.log('FIO removeCryptoPublicAddresses error', response)
                isOK = false
            }
        } catch (e) {
            formatError('FIO removeCryptoPublicAddresses', e)
        }
    }
    return isOK
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
export const requestFunds = async ({ payerFioAddress, payeeFioAddress, payeeTokenPublicAddress, amount, chainCode, tokenCode, memo }) => {
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
            null
        )

        await BlocksoftCryptoLog.log('FIO requestFunds result', response)
        return response
    } catch (e) {
        formatError('FIO requestFunds', e)
        const errorMessage = e.json?.fields
            ? e.json?.fields[0].error
            : e.json?.message

        return {
            error: errorMessage || 'FIO request creation error'
        }
    }
}

export const getTransactions = async (publicKey) => {

    try {
        const link = BlocksoftExternalSettings.getStatic('FIO_HISTORY_URL')
        const accountHash = Fio.accountHash(publicKey)
        const response = await BlocksoftAxios.post(link + 'get_actions', {
            'account_name': accountHash,
            'pos': -1
        })
        return response?.data
    } catch (e) {
        formatError('FIO getTransactions', e)
        return []
    }
}

export const transferTokens = async (addressTo, amount) => {
    try {
        const { fee = 0 } = await getFioSdk().getFee('transfer_tokens_pub_key')
        const result = await getFioSdk().transferTokens(addressTo, amount, fee, null)
        return result['transaction_id']
    } catch (e) {
        formatError('FIO transferTokens', e)
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
        formatError('FIO rejectFioRequest', e)
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
 * @param memo
 */
export const recordFioObtData = async ({
                                           fioRequestId = '',
                                           payerFioAddress = '',
                                           payeeFioAddress = '',
                                           payerTokenPublicAddress,
                                           payeeTokenPublicAddress,
                                           amount,
                                           chainCode,
                                           tokenCode,
                                           obtId,
                                           memo
                                       }) => {
    try {
        const sdk = getFioSdk()
        const { fee = 0 } = await sdk.getFeeForRecordObtData(payerFioAddress)
        const result = await sdk.recordObtData(fioRequestId, payerFioAddress, payeeFioAddress, payerTokenPublicAddress, payeeTokenPublicAddress, amount, chainCode, tokenCode, 'sent_to_blockchain', obtId, fee, null, null, memo, null, null)
        return !!result['status']
    } catch (e) {
        formatError('FIO recordFioObtData', e)
    }
}

export const getFioObtData = async (tokenCode, offset = 0, limit = 100) => {
    let res = false
    try {
        res = await getFioSdk().getObtData(limit, offset, tokenCode)
    } catch (e) {
        formatError('FIO.getFioObtData ' + tokenCode + ' ' + limit + ' ' + offset, e)
    }
    return res
}

const formatError = (title, e) => {
    if (config.debug.fioErrors) {
        console.log(title + ' error', e.json, e)
    }
    if (e.message.indexOf('Error 404') === -1 && e.message.indexOf('Network request failed') === -1) {
        BlocksoftCryptoLog.err(title + ' error ' + e.message, e.json || false)
    } else {
        const msg = title + ' 404 notice ' + e.message + ' ' + JSON.stringify(e.json)
        if (msg.indexOf('No FIO Requests') === -1) {
            BlocksoftCryptoLog.log(msg)
        }
    }
}
