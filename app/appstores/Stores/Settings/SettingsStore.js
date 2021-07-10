/**
 * @version 0.50
 */
const INITIAL_STATE = {
    data: {
        isBalanceVisible : true
    },
    keystore: {
        lockScreenStatus: '0',
        askPinCodeWhenSending: '0',
        touchIDStatus: '0'
    }
}

const settingsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'UPDATE_SETTINGS':
            return {
                data: action.settings,
                keystore: action.keystore
            }
        default:
            return state
    }
}

export default settingsStoreReducer
