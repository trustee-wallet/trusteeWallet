/**
 * @version 0.43
 */
import store from '@app/store'

const { dispatch } = store

export function setQRConfig(data) {
    dispatch({
        type: 'SET_CONFIG',
        config: data
    })
}
