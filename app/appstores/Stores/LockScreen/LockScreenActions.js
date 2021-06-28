/**
 * @version 0.45
 */
import store from '@app/store'

const { dispatch } = store

export const LockScreenFlowTypes = {
    INIT_POPUP : 'INIT_POPUP',
    PUSH_POPUP_CALLBACK : 'PUSH_POPUP_CALLBACK',
    JUST_CALLBACK : 'JUST_CALLBACK',
    CREATE_PINCODE : 'CREATE_PINCODE',
    DELETE_PINCODE : 'DELETE_PINCODE',
    CHANGE_TOUCHID_STATUS : 'CHANGE_TOUCHID_STATUS',
    CHANGE_ASKING_STATUS : 'CHANGE_ASKING_STATUS',
    CHANGE_PINCODE_FIRST_STEP : 'CHANGE_PINCODE_FIRST_STEP'
}

export function setLockScreenConfig(data) {
    if (typeof data.flowType === 'undefined') {
        throw new Error('LockScreenActions setLockScreenConfig updated type => flowType')
    }
    dispatch({
        type: 'SET_LOCK_SCREEN_CONFIG',
        flowType : data.flowType,
        callback : data.callback || false
    })
}

export function resetLockScreen() {
    dispatch({
        type: 'SET_LOCK_SCREEN_CONFIG',
        flowType : false,
        callback : false
    })
}

