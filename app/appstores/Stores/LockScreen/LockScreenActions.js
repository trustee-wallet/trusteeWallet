/**
 * @version 0.45
 */
import store from '@app/store'
import Log from '@app/services/Log/Log'

const { dispatch } = store

export const LockScreenFlowTypes = {
    INIT_POPUP : 'INIT_POPUP',
    PUSH_POPUP_CALLBACK : 'PUSH_POPUP_CALLBACK',
    MNEMONIC_CALLBACK: 'MNEMONIC_CALLBACK',
    JUST_CALLBACK : 'JUST_CALLBACK',
    CREATE_PINCODE : 'CREATE_PINCODE',
    DELETE_PINCODE : 'DELETE_PINCODE',
    CHANGE_TOUCHID_STATUS : 'CHANGE_TOUCHID_STATUS',
    CHANGE_ASKING_STATUS : 'CHANGE_ASKING_STATUS',
    CHANGE_PINCODE_FIRST_STEP : 'CHANGE_PINCODE_FIRST_STEP'
}

export function setLockScreenConfig(data, source = '') {
    if (typeof data.flowType === 'undefined') {
        throw new Error('LockScreenActions setLockScreenConfig updated type => flowType')
    }
    dispatch({
        type: 'SET_LOCK_SCREEN_CONFIG',
        flowType : data.flowType,
        timeLocked : new Date().getTime(),
        callback : data.callback || false,
        noCallback : data.noCallback
    })
}

export function resetLockScreen(diffToReset = 0, source) {
    const oldData = store.getState().lockScreenStore.flowType
    const timeLocked = store.getState().lockScreenStore.timeLocked
    const passedTime = timeLocked ? (new Date().getTime() - timeLocked) : ' no time '
    if (timeLocked && passedTime < diffToReset) {
        return false
    }
    dispatch({
        type: 'SET_LOCK_SCREEN_CONFIG',
        flowType : false,
        callback : false
    })
}

