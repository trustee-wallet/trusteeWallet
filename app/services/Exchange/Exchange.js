/**
 * @version 0.9
 * @misha optimize?
 */
const axios = require('axios')

import config from '../../config/config'

import Log from '../Log/Log'

import { applyFee, convertCurrency, applyWithdrawFee, applyPayinFeeFiat, getTrusteeFee } from './ExchangeFee'
import { SIDE_FIAT, SIDE_CRYPTO, ACTION_SELL, ACTION_BUY } from './ExchangeConstants'

export async function getEquivalent(data) {
    const { mode: exchangeMode, apiEndpoints } = config.exchange
    const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL

    // Equivalent module v3.7
    if (data.side !== ACTION_SELL && data.side !== ACTION_BUY) {
        throw new Error('Exchange.getEquivalent Invalid side ' + data.side)
    }
    if (data.type !== SIDE_FIAT && data.type !== SIDE_CRYPTO) {
        throw new Error('Exchange.getEquivalent Invalid type ' + data.type)
    }

    const reqData = JSON.parse(JSON.stringify(data))
    const link = baseUrl + '/get-equivalent-info'

    reqData.amount = parseFloat(reqData.amount)

    Log.log('SRV/Exchange.getEquivalent post start ' + link, reqData)

    let APIrequest = { currency: reqData.currency }
    if (reqData.countryCode) {
        APIrequest.countryCode = reqData.countryCode
    }
    let APIresponse
    try {
        APIresponse = await axios.post(link, APIrequest)
    } catch (e) {
        e.code = 'ERROR_SYSTEM'
        throw e
    }

    if (typeof (APIresponse.data) === 'undefined' || !APIresponse.data) {
        let e = new Error('No APIresponse.data')
        e.code = 'ERROR_SYSTEN'
        throw e
    }
    // Check API response state
    let feeInfo = APIresponse.data
    if (feeInfo.state === 'fail') {
        let e = new Error(typeof (feeInfo.errorMsg) !== 'undefined' && feeInfo.errorMsg[0] ? feeInfo.errorMsg[0] : JSON.stringify(feeInfo))
        e.code = 'ERROR_USER'
        throw e
    }

    feeInfo = feeInfo.data

    // Main logic
    switch (reqData.side) {

        case ACTION_BUY:

            switch (reqData.type) {
                case SIDE_CRYPTO:
                    return buySideCryptoSub(reqData.amount, reqData.type, feeInfo.buy)
                case SIDE_FIAT:
                    return buySideFiatSub(reqData.amount, reqData.type, feeInfo.buy)

                default:
                    throw new Error('Exchange.getEquivalent Invalid type ' + reqData.type)
            }


        case ACTION_SELL:

            switch (reqData.type) {
                case SIDE_CRYPTO:
                    return sellSideCryptoSub(reqData.amount, reqData.type, feeInfo.sell)
                case SIDE_FIAT:
                    return sellSideFiatSub(reqData.amount, reqData.type, feeInfo.sell)
                default:
                    throw new Error('Exchange.getEquivalent Invalid type ' + reqData.type)
            }

        default:
            throw new Error('Exchange.getEquivalent Invalid side ' + reqData.side)
    }
}


const buySideCryptoSub = (amount, type, feeInfo) => {
    let resData = {}
    let message = ''

    let amountCrypto = applyWithdrawFee(amount, feeInfo.withdrawFeeCrypto, feeInfo.basePrecision, type, ACTION_BUY)

    //Check for minimal purchase
    if (amountCrypto <= feeInfo.minPurchase) {
        resData.state = 'fail'
        message = 'Amount less than minimal purchase'
    }

    amountCrypto = applyFee(amountCrypto, feeInfo.basePrecision, feeInfo.feeCrypto, type, ACTION_BUY) // our fee crypto
    amountCrypto = applyFee(amountCrypto, feeInfo.basePrecision, feeInfo.tradesFee, type, ACTION_BUY) // trades fee
    let amountFiat = convertCurrency(amountCrypto, feeInfo.exchangeRate.sell, 2, type)
    let trusteeFee = getTrusteeFee(amountFiat, feeInfo.feeFiat)
    amountFiat = applyFee(amountFiat, 2, feeInfo.feeFiat, type, ACTION_BUY) // our fee fiat
    let payinEstimate = applyPayinFeeFiat(amountFiat, feeInfo.payinFeeFiat, type)

    resData.state = typeof resData.state == 'undefined' ? 'success' : resData.state
    resData.data = {
        equivalent: amount == 0 ? 0 : payinEstimate.amountFiat,
        sendToApiFiat: amount == 0 ? 0 : payinEstimate.sendToApiFiat,
        sendToApiCrypto: amount,
        amountForCheckLimits: amount == 0 ? 0 : payinEstimate.amountFiat,
        networkFee: {
            crypto: feeInfo.withdrawFeeCrypto,
            fiat: convertCurrency(feeInfo.withdrawFeeCrypto, feeInfo.exchangeRate.sell, 2, 'crypto')
        },
        trusteeFee: amount == 0 ? { ...trusteeFee, equivalent: 0 } : trusteeFee,
        currencyFiat: feeInfo.currencyFiat,
        message: message
    }

    return resData
}

const buySideFiatSub = (amount, type, feeInfo) => {
    let resData = {}
    let message = ''

    let payinEstimate = applyPayinFeeFiat(amount, feeInfo.payinFeeFiat, type)
    let trusteeFee = getTrusteeFee(payinEstimate.amountFiat, feeInfo.feeFiat)
    let amountFiat = applyFee(payinEstimate.amountFiat, 2, feeInfo.feeFiat, type, ACTION_BUY) // our fee fiat
    let amountCrypto = convertCurrency(amountFiat, feeInfo.exchangeRate.sell, feeInfo.basePrecision, type)
    amountCrypto = applyFee(amountCrypto, feeInfo.basePrecision, feeInfo.tradesFee, type, ACTION_BUY) // trades fee
    amountCrypto = applyFee(amountCrypto, feeInfo.basePrecision, feeInfo.feeCrypto, type, ACTION_BUY) // our fee crypto

    //Check for minimal purchase
    if (amountCrypto <= feeInfo.minPurchase) {
        resData.state = 'fail'
        message = 'Amount less than minimal purchase'
    }

    amountCrypto = applyWithdrawFee(amountCrypto, feeInfo.withdrawFeeCrypto, feeInfo.basePrecision, type, ACTION_BUY)

    resData.state = typeof resData.state == 'undefined' ? 'success' : resData.state
    resData.data = {
        equivalent: amountCrypto <= 0 ? 0 : amountCrypto,
        sendToApiFiat: payinEstimate.sendToApiFiat <= 0 ? 0 : payinEstimate.sendToApiFiat,
        sendToApiCrypto: amountCrypto <= 0 ? 0 : amountCrypto,
        amountForCheckLimits: amount,
        networkFee: {
            crypto: feeInfo.withdrawFeeCrypto,
            fiat: convertCurrency(feeInfo.withdrawFeeCrypto, feeInfo.exchangeRate.sell, 2, 'crypto')
        },
        trusteeFee,
        currencyFiat: feeInfo.currencyFiat,
        message: message
    }
    return resData
}

const sellSideCryptoSub = (amount, type, feeInfo) => {
    let resData = {}
    let message = ''


    //Check for minimal transfer
    if (amount <= feeInfo.minTransfer) {
        resData.state = 'fail'
        message = 'Amount less than minimal transfer'
    }

    let amountCrypto = applyFee(amount, feeInfo.basePrecision, feeInfo.feeCrypto, type, ACTION_SELL) // our fee crypto
    let amountFiat = convertCurrency(amountCrypto, feeInfo.exchangeRate.buy, 2, type)
    amountFiat = applyFee(amountFiat, 2, feeInfo.tradesFee, type, ACTION_SELL) // trades fee
    let trusteeFee = getTrusteeFee(amountFiat, feeInfo.feeFiat)
    amountFiat = applyFee(amountFiat, 2, feeInfo.feeFiat, type, ACTION_SELL) // our fee fiat
    amountFiat = applyWithdrawFee(amountFiat, feeInfo.withdrawFeeFiatV2, 2, type, ACTION_SELL) // withdraw fee fiat

    //Check for minimal withdraw
    if (amountFiat <= feeInfo.minWithdraw) {
        resData.state = 'fail'
        if (!message || message === '') message = 'Amount less than minimal withdraw'
    }

    resData.state = typeof resData.state == 'undefined' ? 'success' : resData.state
    resData.data = {
        equivalent: amountFiat <= 0 ? 0 : amountFiat,
        sendToApiFiat: amountFiat <= 0 ? 0 : amountFiat,
        sendToApiCrypto: amount,
        amountForCheckLimits: amountFiat <= 0 ? 0 : amountFiat,
        trusteeFee,
        currencyFiat: feeInfo.currencyFiat,
        message: message
    }

    return resData


}

const sellSideFiatSub = (amount, type, feeInfo) => {
    let resData = {}
    let message = ''


    //Check for minimal withdraw
    if (amount <= feeInfo.minWithdraw) {
        resData.state = 'fail'
        message = 'Amount less than minimal withdraw'
    }

    let amountFiat = applyWithdrawFee(amount, feeInfo.withdrawFeeFiatV2, 2, type, ACTION_SELL) // withdraw fee fiat
    let trusteeFee = getTrusteeFee(amountFiat, feeInfo.feeFiat)
    amountFiat = applyFee(amountFiat, 2, feeInfo.feeFiat, type, ACTION_SELL) // our fee fiat
    amountFiat = applyFee(amountFiat, 2, feeInfo.tradesFee, type, ACTION_SELL) // trades fee
    let amountCrypto = convertCurrency(amountFiat, feeInfo.exchangeRate.buy, feeInfo.basePrecision, type)
    amountCrypto = applyFee(amountCrypto, feeInfo.basePrecision, feeInfo.feeCrypto, type, ACTION_SELL) // our fee crypto

    //Check for minimal transfer
    if (amountCrypto <= feeInfo.minTransfer) {
        resData.state = 'fail'
        if (!message || message === '') message = 'Amount less than minimal transfer'
    }

    resData.state = typeof resData.state == 'undefined' ? 'success' : resData.state
    resData.data = {
        equivalent: amountCrypto,
        sendToApiFiat: amount,
        sendToApiCrypto: amountCrypto,
        amountForCheckLimits: amount,
        trusteeFee,
        currencyFiat: feeInfo.currencyFiat,
        message: message
    }

    return resData


}
