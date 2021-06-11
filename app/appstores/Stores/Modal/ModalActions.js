/**
 * @version 0.9
 */
import { closeOverlay, openOverlay } from 'react-native-blur-overlay'
import { Keyboard } from 'react-native'

import store from '../../../store'

const { dispatch } = store

export function showModal(data, callback = false) {

    setTimeout(() => {
        Keyboard.dismiss()
        openOverlay()
        Keyboard.dismiss()
    }, 500)

    Keyboard.dismiss()

    dispatch({
        type: 'SHOW_MODAL',
        data: data,
        callback: callback
    })
}

export function hideModal() {
    setTimeout(() => {
        closeOverlay()
    }, 500)

    dispatch({
        type: 'HIDE_MODAL',
        data: {},
        callback: () => {
        }
    })
}
