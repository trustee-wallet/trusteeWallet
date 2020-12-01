/**
 * @version todo
 * @misha plz lets finish splitting the file
 */
import _ from 'lodash'
import { strings } from './i18n'
import { showModal } from '../appstores/Stores/Modal/ModalActions'

import React from 'react'


// to split
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

const utils = {

    // to remove ?
    isArrayEqual: (x, y) => _(x).xorWith(y, _.isEqual).isEmpty()
}

export default utils
