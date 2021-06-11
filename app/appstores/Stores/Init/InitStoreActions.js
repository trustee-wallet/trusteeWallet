/**
 * @version 0.43
 */
import store from '@app/store'

import config from '@app/config/config'

const { dispatch } = store


export function setInitState(data) {
    if (config.debug.appErrors) {
        console.log(new Date().toISOString() + ' ACT/InitStore setInitState called ' + JSON.stringify(data))
    }
    return dispatch({
        type: 'SET_INIT_STATE',
        init: data
    })
}

export function setInitError(data) {
    if (config.debug.appErrors) {
        console.log(new Date().toISOString() + ' ACT/InitStore setInitError called ' + JSON.stringify(data))
    }
    return dispatch({
        type: 'SET_INIT_ERROR',
        initError: data
    })
}
