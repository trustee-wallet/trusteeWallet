/**
 * @version 0.9
 */
import store from '../../../store'

const { dispatch } = store

export function setQRConfig(data) {
    dispatch({
        type: 'SET_CONFIG',
        config: data
    })
}

export function setQRValue(data) {
    dispatch({
        type: 'SET_VALUE',
        value: data
    })
}
