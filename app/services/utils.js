/**
 * @version todo
 * @misha plz lets finish splitting the file
 */
import _ from 'lodash'
import { strings } from './i18n'
import { showModal } from '../appstores/Stores/Modal/ModalActions'

import BlocksoftTransfer from '../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'

import React from 'react'


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

    /**
     * @param {string} currencyCode
     * @param {string} currencySymbol
     * @param {string} address
     * @returns {Promise<boolean>}
     */
    checkTransferHasError: async (currencyCode, currencySymbol, address) => {
        const checked = await (
            BlocksoftTransfer
                .setCurrencyCode(currencyCode)
                .setAddressTo(address)
        ).checkTransferHasError()

        if (checked) {

            checked.currencySymbol = currencySymbol
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings(`modal.checkTransferHasError.${checked.code}.title`, checked),
                description: strings(`modal.checkTransferHasError.${checked.code}.description`, checked)
            })

            return true
        }

        return false
    },

    isArrayEqual: (x, y) => _(x).xorWith(y, _.isEqual).isEmpty()
}

export default utils
