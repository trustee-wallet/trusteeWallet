import { Clipboard } from 'react-native'
import { strings } from './i18n'
import { showModal } from '../appstores/Actions/ModalActions'

import BlocksoftTransfer from '../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'


export function copyToClipboard(data) {
    Clipboard.setString(data)
}

export function renderError(field, array) {
    if (array.length > 0) {
        let result = array.find((array) => {
            return array.field === field
        })
        if (typeof result != 'undefined') {
            return result.msg
        }
    } else return ''
}

export function removeByKey(array, params) {
    array.some(function(item, index) {
        return (array[index][params.key] === params.value) ? !!(array.splice(index, 1)) : false
    })
    return array
}

export function getArrayItem(field, array) {
    if (array.length > 0) {
        let result = array.find((array) => {
            return array.field === field
        })
        if (typeof result != 'undefined') {
            return result.msg
        }
    } else return ''
}

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function normalizeWithDecimals(val, decimals) {
    let tmpSplit
    let value = val.replace(/\,/g, '.')

    value = value.replace(/[^0-9.]*/g, '')
    value = value.replace(/\.{2,}/g, '.')
    //value = value.replace(/\.,/g, ',');
    //value = value.replace(/\,\./g, ',');
    //value = value.replace(/\,{2,}/g, ',');
    value = value.replace(/\.[0-9]+\./g, '.')

    if (!decimals) {
        value = value.replace('.', '')
    }

    tmpSplit = value.split('.')

    if (typeof tmpSplit[1] != 'undefined' && tmpSplit[1].length > 2) {
        value = tmpSplit[0] + '.' + tmpSplit[1].substring(0, decimals)
    }

    value = (value[0] == '0' && value[1] == '0') || (value[0] == '0' && +value[1]) ? '0' : value
    return !value || value == '.' ? '' : value
}

const utils = {

    langCodeToWord: (data) => {
        switch (data) {
            case 'ru-RU':
                return 'Russian'
            case 'en-US':
                return 'English'
            default:
                break
        }
    },

    /**
     * @param {string} currencyCode
     * @param {string} address
     * @returns {Promise<boolean>}
     */
    checkTransferHasError: async (currencyCode, address) => {
        const checked = await (
            BlocksoftTransfer
                .setCurrencyCode(currencyCode)
                .setAddressTo(address)
        ).checkTransferHasError()

        if (checked) {
            if (currencyCode === 'XRP') {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings(`modal.checkTransferHasError.${currencyCode}.title`),
                    description: strings(`modal.checkTransferHasError.${currencyCode}.description`)
                })
            }

            return true
        }

        return false
    },

    prettierNumber: (raw, fractionDigits = 5, whileNotNull = true) => {

        const decimal = raw.toString().split('.')[1]

        if (whileNotNull && typeof decimal != 'undefined') {
            while (true) {
                if ((+raw).toFixed(fractionDigits).split('.')[1] == 0)
                    fractionDigits += 1
                else
                    break
            }

            return (+raw).toFixed(fractionDigits)
        }

        return (+raw).toFixed(fractionDigits).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
    }


}

export default utils
