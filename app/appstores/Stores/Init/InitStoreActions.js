/**
 * @version 0.43
 */
import store from '@app/store'

const { dispatch } = store


export function setInitState(data) {
    return dispatch({
        type: 'SET_INIT_STATE',
        init: data
    })
}

export function setInitError(data) {
    return dispatch({
        type: 'SET_INIT_ERROR',
        initError: data
    })
}
