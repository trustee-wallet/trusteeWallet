/**
 * @version 0.77
 * Use __validator.arrayValidation to perform validation od array of data
 * Single record should be object with next fields:
 * id - identity of data/error field (for exp. 'password')
 * type - type of validation. Should be in uppercase (for exp. 'PASSWORD')
 * value - value
 * name - (optionally) title that will be used in error message and not equal id (for exp. 'confirm password'). If not set -> will be used id.
 **/

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BtcCashUtils from '@crypto/blockchains/bch/ext/BtcCashUtils'
import MoneroUtilsParser from '@crypto/blockchains/xmr/ext/MoneroUtilsParser'

import { FIOSDK } from '@fioprotocol/fiosdk/src/FIOSDK'
import { isFioAddressValid } from '@crypto/blockchains/fio/FioUtils'
import { isUnstoppableAddressValid } from '@crypto/services/UnstoppableUtils'
import { isEnsAddressValid } from '@crypto/services/EnsUtils'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import OneUtils from '@crypto/blockchains/one/ext/OneUtils'

const networksConstants = require('@crypto/common/ext/networks-constants')

const cardNumberValid = require('fast-luhn')
const DEFAULT_WORDS = require('./_words/english.json')
const bitcoin = require('bitcoinjs-lib')

async function _fioAddressValidation(obj) {
    const { value, type } = obj

    if (!value || !type || !type.includes('_ADDRESS')) {
        return false
    }
    return isFioAddressValid(value) || isUnstoppableAddressValid(value) || isEnsAddressValid(value)
}

async function _userDataValidation(obj) {

    const id = obj.id
    const type = obj.type
    const subtype = obj.subtype
    const optional = typeof obj.optional !== 'undefined'
    const name = (typeof obj.name === 'undefined') ? obj.id : obj.name

    let value = obj.value
    let error = {}

    if (typeof value === 'undefined') {
        error.msg = strings('validator.empty', { name: name })
        error.field = id
        return error
    }

    if (!value && optional) {
        return false
    }

    if (type !== 'MNEMONIC_PHRASE') {
        const res = _mnemonicValidationWordsOnly(value)
        if (res && typeof res.wordsString !== 'undefined') {
            error.msg = strings('validator.mnemonic_detected', { name: name })
            error.field = id
            return error
        }
    }

    value = value ? value.trim() : ''

    switch (type) {

        case 'OPTIONAL':
            if (value.length > 255)
                error.msg = strings('validator.moreThanMax', { name: name })
            break

        case 'EMAIL':
            const pattern = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            if (!value)
                error.msg = strings('validator.empty', { name: name })
            else if (!pattern.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'PASSWORD':
            if (!value)
                error.msg = strings('validator.empty', { name: name })
            break

        case 'CARD_NUMBER':
            value = value.replace(/\s+/g, '')
            const numberValidation = cardNumberValid(value)
            if (!value)
                error.msg = strings('validator.empty', { name: name })
            else if (!numberValidation) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'EXPIRATION_DATE':
            const mm = value.split('/')[0]
            const yy = value.split('/')[1]

            let tmpYY = ((new Date().getFullYear()).toString()).substr(1)
            tmpYY = tmpYY.substr(1)

            if (!value)
                error.msg = strings('validator.empty', { name: name })
            else if (!/^\d{2}\/\d{2}$/g.test(value))
                error.msg = strings('validator.invalidFormat', { name: name })
            else if (mm > 12 || yy < tmpYY)
                error.msg = strings('validator.invalidFormat', { name: name })
            break

        case 'PASSWORDS_CHECK':
            const tmpCheck = _passwordsValidation(obj)
            if (tmpCheck) {
                error.msg = tmpCheck
            }
            break

        case 'TEXT':
            if (!value)
                error.msg = strings('validator.empty', { name: name })
            else if (!/^[a-z]+$/i.test(value)) {
                error.msg = 'The ' + name + ' field may contain only Latin letters'
            }
            break

        case 'COUNTRY':
            if (!value)
                error.msg = strings('validator.empty', { name: name })
            break

        case 'WALLET_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (value.length !== 42) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'TRX_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^T[0-9a-zA-Z]{33}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            } else if (TronUtils.addressHexToStr(TronUtils.addressToHex(value)) !== value) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'TRX_TOKEN':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^100[0-9]{4,}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            } else if (TronUtils.addressHexToStr(TronUtils.addressToHex(value)) !== value) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'ETH_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^0[xX]+[0-9a-fA-F]{40}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'ETH_ONE_ADDRESS':
            if (value && value.indexOf('one1') !== -1) {
                value = OneUtils.fromOneAddress(value)
            }
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^0[xX]+[0-9a-fA-F]{40}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'ASH_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!(value.startsWith('Æx'))) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'SOL_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            } else {
                try {
                    SolUtils.isAddressValid(value)
                } catch (e) {
                    error.msg = strings('validator.invalidFormat', { name: name })
                }
            }
            break

        case 'FIO_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else {
                try {
                    FIOSDK.isFioPublicKeyValid(value)
                } catch (e) {
                    error.msg = strings('validator.invalidFormat', { name: name })
                }
            }
            break

        case 'XRP_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^r[0-9a-zA-Z]{24,34}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'XMR_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^[0-9a-zA-Z]{95,106}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'BNB_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (value.toLowerCase().indexOf('bnb') !== 0) {
                error.msg = strings('validator.invalidFormat', { name: name })
            } else if (value.length !== 42) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }

            break

        case 'XRP_DESTINATION_TAG':
            if (!value) {
                return
            } else if (value > 4294967295) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'XLM_DESTINATION_TAG':
            // do nothing
            break

        case 'XMR_DESTINATION_TAG':
            if (!value || value === '') {
                return
            } else if (!MoneroUtilsParser.checkDestination(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        // unified LTC XVG DOGE
        case 'BTC_BY_NETWORK_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else {
                if (typeof networksConstants[subtype].network === 'undefined') {
                    Log.err('validator not found network for' + subtype)
                }
                let checkValues = [value]
                if (value.indexOf(';') !== -1) {
                    checkValues = value.replace(/\s+/g, ';').split(';')
                }
                for (let checkValue of checkValues) {
                    checkValue = checkValue.trim()
                    if (!checkValue) continue
                    if (subtype === 'bitcoincash' || subtype === 'bitcoinsv') { //clone not to overwrite
                        checkValue = BtcCashUtils.toLegacyAddress(checkValue)
                    }
                    try {
                        let output = bitcoin.address.toOutputScript(checkValue, networksConstants[subtype].network)
                    } catch (e) {
                        error.msg = strings('validator.invalidFormat', { name: name })
                    }
                }
            }
            break
        // actually could be unified to prev ones (as its the same)
        case 'BTC_ADDRESS':
        case 'BITCOIN_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else {
                let checkValues = [value]
                if (value.indexOf(';') !== -1) {
                    checkValues = value.replace(/\s+/g, ';').split(';')
                }
                for (let checkValue of checkValues) {
                    checkValue = checkValue.trim()
                    if (!checkValue) continue
                    let network = null
                    let firstOne = checkValue[0]
                    let firstThree = checkValue.slice(0, 3)
                    if (firstOne === '1' || firstOne === '3') {
                        network = bitcoin.networks.mainnet
                    } else if (firstThree === 'bc1') {
                        network = bitcoin.networks.mainnet
                    } else if (firstOne === '2' || firstOne === 'm' || firstOne === 'n') {
                        network = bitcoin.networks.testnet
                    } else if (firstThree === 'tb1') {
                        network = bitcoin.networks.testnet
                    }
                    try {
                        let output = bitcoin.address.toOutputScript(checkValue, network)
                    } catch (e) {
                        error.msg = strings('validator.invalidFormat', { name: name })
                    }
                }
            }
            break
        case 'BTC_LEGACY_ADDRESS':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else {
                let firstOne = value[0]
                if (firstOne === '1' || firstOne === '3') {
                    let network = bitcoin.networks.mainnet
                    try {
                        let output = bitcoin.address.toOutputScript(value, network)
                    } catch (e) {
                        error.msg = strings('validator.invalidFormat', { name: name })
                    }
                } else {
                    error.msg = strings('validator.invalidFormat', { name: name })
                }

            }
            break

        case 'MNEMONIC_PHRASE':
            const tmpCheck2 = await _validateMnemonic({
                mnemonic: value
            })
            if (tmpCheck2) {
                if (tmpCheck2.msg) {
                    error = tmpCheck2
                } else {
                    error.msg = tmpCheck2
                }
            }
            break

        case 'TX_HASH':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!/^0[xX]+[0-9a-fA-F]{64}$/.test(value)) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'CAPTCHA':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            }
            break

        case 'EMPTY':
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (value.length > 255) {
                error.msg = strings('validator.moreThanMax', { name: name })
            }
            break

        case 'AMOUNT':
            if (!value || !parseFloat(value)) {
                error.msg = strings('validator.empty', { name: name })
            } else if (value.length > 255) {
                error.msg = strings('validator.moreThanMax', { name: name })
            }
            break

        case 'UNDEFINED':
            if (typeof value === 'undefined') {
                error.msg = strings('validator.empty', { name: name })
            }
            break

        case 'ARRAY_EMPTY':
            if (!value.length) {
                error.msg = 'Data ' + name + ' is empty'
            }
            break

        case 'CASHBACK_LINK':
            const valueArray = value.split('/')
            value = value.replace('https://cashback.trustee.deals/', 'https://trustee.deals/link/')
            value = value.replace('https://trustee.deals/', 'https://trusteeglobal.com/')
            if (!value) {
                error.msg = strings('validator.empty', { name: name })
            } else if (!value.includes('https://trusteeglobal.com/link/')) {
                // not link is ok
                const tmp = value.split('/')
                if (tmp.length > 1) {
                    error.msg = strings('validator.invalidFormat', { name: name })
                }
            } else if (typeof valueArray[valueArray.length - 1] === 'undefined' || valueArray[valueArray.length - 1].length !== 8) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        case 'WALLET_CONNECT_LINK':
            if (!value.includes('wc:')) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            if (value.indexOf('URI format') === -1) {
                error.msg = strings('validator.invalidFormat', { name: name })
            }
            break

        default:
            break
    }

    if (typeof error.msg !== 'undefined') {
        error.field = id
        return error
    }
    return false
}


function _passwordsValidation(obj) {
    const only = /^[a-zA-Z0-9.,\/#!$%\^&\*;:{}=\-_`~()]+$/

    if (obj.value[0] && obj.value[1]) {
        if (obj.value[0] != obj.value[1]) {
            return 'Please enter the same passwords'
        } else if (obj.value[0].length <= 6) {
            return 'Password must be more than six characters'
        } else if (!only.test(obj.value[0])) {
            return 'Password should contain only latin letters, numbers and special characters'
        }
    }
    return ''
}


function _mnemonicValidationWordsOnly(txt) {
    if (typeof txt === 'undefined' || !txt) {
        return false
    }
    txt = txt.trim()
    if (!txt || txt === '') {
        return false
    }
    const words = txt.toLowerCase().split(/\s+/g)
    const mnemonicLength = words.length


    let i = 0
    let wordsString = ''
    if (txt[txt.length - 1] === ' ') {
        i = -1 //last word is spaced so will be checked
    }
    let lastError = false
    for (let word of words) {
        let index = DEFAULT_WORDS.indexOf(word)
        wordsString += word + ' '
        i++
        if (i === mnemonicLength) {
            //last word
            if (index === -1) {
                lastError = { msg: `Word ${word} is invalid`, word }
            }
        } else if (index === -1) {
            return { msg: `Word ${word} is invalid`, word }
        }
    }

    if (mnemonicLength <= 11) {
        return { msg: 'Mnemonic should be longer then 11 words', mnemonicLength }
    }
    if (mnemonicLength >= 25) {
        return { msg: 'Mnemonic should be 24 words', mnemonicLength }
    }
    if (mnemonicLength % 3 != 0) {
        return { msg: `Unexpected mnemonic phrase words amount ${mnemonicLength}`, mnemonicLength }
    }

    if (lastError) {
        return lastError
    }

    wordsString = wordsString.trim()
    return { wordsString }
}


/**
 * @param {string} obj.mnemonic
 * @return {string|{msg: string, word: string}}
 * @private
 */
async function _validateMnemonic(obj) {
    const res = _mnemonicValidationWordsOnly(obj.mnemonic)
    if (typeof res.wordsString === 'undefined') {
        return res
    }
    try {
        await BlocksoftKeys.validateMnemonic(res.wordsString)
    } catch (e) {
        return e.message
    }
    obj.mnemonic = res.wordsString

    return ''
}


module.exports = {
    mnemonicValidationWordsOnly: function(text) {
        const res = _mnemonicValidationWordsOnly(text)
        if (typeof res.wordsString === 'undefined') {
            return false
        }
        return res.wordsString.split(' ')[0]
    },

    safeWords: function(text, maxWords = 2) {
        if (!text) {
            return false
        }
        try {
            const words = text.trim().split(/\s+/g)
            if (words.length > 2) {
                const res = _mnemonicValidationWordsOnly(text)
                if (typeof res.wordsString === 'undefined') {
                    return words.slice(0, maxWords).join(' ')
                }
                return 'mnemonic'
            } else {
                return text
            }
        } catch (e) {
            return false
        }
    },

    userDataValidation: async function(obj) {
        obj.id = 'any'
        return _userDataValidation(obj)
    },

    arrayValidation: async function(array) {
        let resultArray = []
        if (!array || typeof (array) === 'undefined' || !array.length) {
            // do nothing
        } else {
            for (let i = 0; i < array.length; i++) {
                let validRes = await _userDataValidation(array[i])
                if (validRes) {
                    resultArray.push(validRes)
                }
            }
        }
        if (array.type === 'CASHBACK_LINK') {
            if (array.value.includes('trusteeglobal.com/')) {
                return {
                    status: 'success',
                    errorArr: []
                }
            } else {
                return {
                    status: 'fail',
                    errorArr: resultArray
                }
            }
        }
        if (resultArray && resultArray.length > 0) {
            if (array[0] && (await _fioAddressValidation(array[0]))) {
                return {
                    status: 'success',
                    errorArr: []
                }
            }
            return {
                status: 'fail',
                errorArr: resultArray
            }
        } else {
            return {
                status: 'success',
                errorArr: resultArray
            }
        }
    }
}
