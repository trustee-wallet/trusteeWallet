/**
 * @version 0.9
 */
const INITIAL_STATE = {
    value: '',
    config: {}
}

const qrCodeScannerStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_VALUE':
            return {
                ...state,
                value: action.value
            }
        case 'SET_CONFIG':
            return {
                ...state,
                config: action.config
            }
        default:
            return state
    }
}

export default qrCodeScannerStoreReducer
